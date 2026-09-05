// RecoverIQ — Express REST API Route Handlers
import { Router, Request, Response } from 'express';
import { dbStore } from './db/store';
import { MLRecoveryScorer, ML_MODEL_METADATA } from './services/ml';
import { AIAgentEngine } from './services/ai';
import { PolicyEngine } from './services/policy';
import { RecoveryOrchestrator } from './services/recovery';
import { AnalyticsService } from './services/analytics';
import { DemoService } from './services/demo';
import { razorpayVault, RazorpayApiKeyConnectionProvider } from './services/razorpay';
import { RazorpayPollingService, eventStream } from './services/polling';
import { RecoveryLiftService } from './services/lift';
import { degradationTracker } from './services/degradation';
import { PolicySimulatorService } from './services/simulation';
import { UnrecoveredRevenueService } from './services/unrecovered';
import { CounterfactualService } from './services/counterfactual';
import { NaturalPolicyEngine } from './services/naturalPolicy';
import { CustomerFatigueEngine } from './services/fatigue';
import { PaymentMethod, FailureReason } from '../types';


export const apiRouter = Router();

// Start background polling service
RazorpayPollingService.start(5);

// Middleware: Extract or default Merchant Context for Tenant Isolation
const DEFAULT_MERCHANT_ID = 'merchant_rzp_live_01';

const getMerchantId = (req: Request): string => {
  return (req.headers['x-merchant-id'] as string) || DEFAULT_MERCHANT_ID;
};

const sendError = (res: Response, status: number, code: string, message: string) => {
  res.status(status).json({
    error: {
      code,
      message,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    },
  });
};

// ==========================================
// 1. AUTHENTICATION & COMPANY ONBOARDING
// ==========================================
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { company_name, business_email, currency, country } = req.body;
    if (!company_name || !business_email) {
      return sendError(res, 400, 'INVALID_INPUT', 'Company name and business email are required.');
    }

    const merchant = dbStore.registerCompany({
      company_name,
      business_email,
      currency: currency || 'INR',
      country: country || 'India',
    });

    res.status(201).json({
      success: true,
      token: `jwt_session_${Date.now()}`,
      user: {
        id: `usr_${Date.now()}`,
        name: company_name,
        email: business_email,
        role: 'MERCHANT_ADMIN',
        merchant,
      },
    });
  } catch (err: any) {
    sendError(res, 500, 'REGISTRATION_FAILED', err.message);
  }
});

apiRouter.post('/auth/login', (req, res) => {
  const { email } = req.body;
  const merchant = dbStore.getMerchant(DEFAULT_MERCHANT_ID);
  res.json({
    token: `jwt_session_${Date.now()}`,
    user: {
      id: 'usr_admin_01',
      name: 'Kawaljeet Singh',
      email: email || 'finance@apexdigital.in',
      role: 'MERCHANT_ADMIN',
      merchant,
    },
  });
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/auth/me', (req, res) => {
  const merchant = dbStore.getMerchant(getMerchantId(req));
  res.json({
    user: {
      id: 'usr_admin_01',
      name: 'Kawaljeet Singh',
      email: 'finance@apexdigital.in',
      role: 'MERCHANT_ADMIN',
      merchant,
    },
  });
});

// ==========================================
// 1.1 RAZORPAY TEST MODE INTEGRATION (SECURE SERVER-SIDE)
// ==========================================
apiRouter.post('/integrations/razorpay/connect', async (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const { key_id, key_secret } = req.body;

    if (!key_id || !key_secret) {
      return sendError(res, 400, 'MISSING_CREDENTIALS', 'Razorpay Test Key ID and Key Secret are required.');
    }

    // Securely test against Razorpay Test API
    const provider = new RazorpayApiKeyConnectionProvider(key_id, key_secret);
    const validation = await provider.validateCredentials();

    if (!validation.valid) {
      razorpayVault.saveCredentials(merchantId, { keyId: key_id, keySecret: key_secret }, false, validation.error);
      return sendError(res, 400, 'RAZORPAY_CONNECTION_FAILED', validation.error || 'Invalid credentials or API unreachable.');
    }

    const status = razorpayVault.saveCredentials(merchantId, { keyId: key_id, keySecret: key_secret }, true);

    // Update merchant status in store
    const merchant = dbStore.getMerchant(merchantId);
    if (merchant) {
      merchant.razorpay_configured = true;
    }

    dbStore.addAuditEvent({
      merchant_id: merchantId,
      event_type: 'POLICY_UPDATED',
      stage: 'AUDIT',
      actor: 'MERCHANT_ADMIN',
      summary: `Razorpay Test Mode connected and verified healthy (${status.keyIdMasked}).`,
      details: { environment: 'test', key_id_masked: status.keyIdMasked },
    });

    res.json({
      success: true,
      message: 'Razorpay Test Mode connected successfully.',
      connection: status,
    });
  } catch (err: any) {
    sendError(res, 500, 'RAZORPAY_CONNECT_ERROR', err.message);
  }
});

apiRouter.get('/integrations/razorpay/status', (req, res) => {
  const merchantId = getMerchantId(req);
  const status = razorpayVault.getPublicStatus(merchantId);
  res.json(status);
});

apiRouter.post('/integrations/razorpay/disconnect', (req, res) => {
  const merchantId = getMerchantId(req);
  razorpayVault.disconnect(merchantId);

  const merchant = dbStore.getMerchant(merchantId);
  if (merchant) {
    merchant.razorpay_configured = false;
  }

  dbStore.addAuditEvent({
    merchant_id: merchantId,
    event_type: 'POLICY_UPDATED',
    stage: 'AUDIT',
    actor: 'MERCHANT_ADMIN',
    summary: 'Razorpay connection disconnected by merchant administrator.',
    details: {},
  });

  res.json({ success: true, message: 'Razorpay disconnected.' });
});

// ==========================================
// 1.2 SERVER-SENT EVENTS (SSE) REAL-TIME STREAM
// ==========================================
apiRouter.get('/events/stream', (req, res) => {
  const merchantId = getMerchantId(req);
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  eventStream.registerClient(clientId, res, merchantId);

  req.on('close', () => {
    eventStream.removeClient(clientId);
  });
});

// ==========================================
// 2. DASHBOARD
// ==========================================
apiRouter.get('/dashboard/summary', (req, res) => {
  try {
    const summary = AnalyticsService.getDashboardSummary(getMerchantId(req));
    res.json(summary);
  } catch (err: any) {
    sendError(res, 500, 'DASHBOARD_FETCH_FAILED', err.message);
  }
});

apiRouter.get('/dashboard/trends', (req, res) => {
  try {
    const trends = AnalyticsService.getTrends(getMerchantId(req));
    res.json(trends);
  } catch (err: any) {
    sendError(res, 500, 'TRENDS_FETCH_FAILED', err.message);
  }
});

// ==========================================
// 3. PAYMENTS, ORDER CREATION & CUSTOMER CHECKOUT
// ==========================================
apiRouter.post('/payments/create', async (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const { amount, currency, customer_name, customer_email, customer_phone, description } = req.body;

    if (!amount || !customer_name || !customer_email) {
      return sendError(res, 400, 'INVALID_INPUT', 'Amount, customer name, and customer email are required.');
    }

    let razorpayOrderId: string | undefined;

    // If Razorpay Test Mode is connected, try to generate real Razorpay Test Order
    const provider = razorpayVault.getProvider(merchantId);
    if (provider) {
      try {
        const order = await provider.createOrder({
          amount: Math.round(Number(amount) * 100), // paisa
          currency: currency || 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            customer_name,
            customer_email,
            source: 'RecoverIQ_Test_Checkout',
          },
        });
        razorpayOrderId = order.id;
      } catch (err: any) {
        console.warn('Razorpay order creation fallback to local order:', err.message);
      }
    }

    const payment = dbStore.createPaymentOrder({
      merchant_id: merchantId,
      amount: Number(amount),
      currency: currency || 'INR',
      customer_name,
      customer_email,
      customer_phone,
      description: description || 'Merchant Order Checkout',
      razorpay_order_id: razorpayOrderId,
    });

    eventStream.broadcast(merchantId, 'payment.created', {
      payment,
      checkout_url: `/pay/${payment.id}`,
    });

    res.status(201).json({
      success: true,
      payment,
      checkout_url: `/pay/${payment.id}`,
      razorpay_order_id: razorpayOrderId,
      message: 'Payment created successfully. Customer checkout link generated.',
    });
  } catch (err: any) {
    sendError(res, 500, 'PAYMENT_CREATION_FAILED', err.message);
  }
});

// Customer-Facing Checkout Session (Strictly No Internal AI Secrets)
apiRouter.get('/checkout/:payment_id', (req, res) => {
  const session = dbStore.getCheckoutSession(req.params.payment_id);
  if (!session) {
    return sendError(res, 404, 'CHECKOUT_NOT_FOUND', 'Payment session does not exist or has expired.');
  }

  const clientKey = razorpayVault.getPublicClientKey(session.merchant_id);

  res.json({
    payment_id: session.id,
    merchant_name: session.merchant_name,
    amount: session.amount,
    currency: session.currency,
    description: session.failure_description || 'Standard Order Checkout',
    customer_name: session.customer?.name || 'Customer',
    customer_email: session.customer?.email || '',
    customer_phone: session.customer?.phone || '',
    status: session.status,
    razorpay_order_id: session.external_reference,
    razorpay_key_id: clientKey,
    created_at: session.created_at,
  });
});

// Customer Checkout Completion (Success or Intentional Test Decline)
apiRouter.post('/checkout/:payment_id/complete', async (req, res) => {
  try {
    const paymentId = req.params.payment_id;
    const { status, failure_reason, failure_code, failure_description, payment_method, provider_payment_id } = req.body;

    const payment = dbStore.getPayment(paymentId, DEFAULT_MERCHANT_ID);
    if (!payment) {
      return sendError(res, 404, 'PAYMENT_NOT_FOUND', 'Payment not found');
    }

    if (status === 'captured') {
      payment.status = 'captured';
      dbStore.addAuditEvent({
        merchant_id: payment.merchant_id,
        payment_id: payment.id,
        event_type: 'OUTCOME_VERIFIED',
        stage: 'VERIFY',
        actor: 'SYSTEM_INGEST',
        summary: `Customer completed payment of ₹${payment.amount.toLocaleString('en-IN')} successfully via checkout.`,
        details: { payment_id: payment.id, method: payment_method || 'upi' },
      });

      eventStream.broadcast(payment.merchant_id, 'payment.captured', {
        paymentId: payment.id,
        amount: payment.amount,
      });

      return res.json({
        success: true,
        status: 'captured',
        message: 'Payment captured successfully.',
      });
    }

    // Payment Failed -> Trigger RecoverIQ Detection & Real-Time Recovery Pipeline
    payment.status = 'failed';
    payment.failure_reason = failure_reason || 'temporary_network_failure';
    payment.failure_code = failure_code || 'GATEWAY_TIMEOUT';
    payment.failure_description = failure_description || 'Payment failed during customer checkout';
    payment.payment_method = payment_method || 'upi';

    const riskCase = await RazorpayPollingService.handleFailedPaymentEvent({
      providerPaymentId: provider_payment_id || `tx_${Date.now()}`,
      merchantId: payment.merchant_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.payment_method,
      errorCode: payment.failure_code,
      errorDescription: payment.failure_description,
      customerEmail: payment.customer?.email,
      customerName: payment.customer?.name,
      occurredAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      status: 'failed',
      case_id: riskCase.id,
      message: 'Payment failure recorded and ingested into RecoverIQ recovery pipeline.',
    });
  } catch (err: any) {
    sendError(res, 500, 'CHECKOUT_COMPLETION_ERROR', err.message);
  }
});

apiRouter.get('/payments', (req, res) => {
  const payments = dbStore.getAllPayments(getMerchantId(req));
  res.json(payments);
});

apiRouter.get('/payments/:payment_id', (req, res) => {
  const payment = dbStore.getPayment(req.params.payment_id, getMerchantId(req));
  if (!payment) {
    return sendError(res, 404, 'PAYMENT_NOT_FOUND', `Payment ${req.params.payment_id} does not exist.`);
  }
  res.json(payment);
});

apiRouter.get('/customers', (req, res) => {
  const customers = dbStore.getAllCustomers(getMerchantId(req));
  res.json(customers);
});

// ==========================================
// 4. REVENUE AT RISK & RECOVERY QUEUE
// ==========================================
apiRouter.get('/revenue-at-risk', (req, res) => {
  const status = req.query.status as string;
  const search = req.query.search as string;
  const cases = dbStore.getCases(getMerchantId(req), { status, search });
  res.json(cases);
});

apiRouter.get('/revenue-at-risk/:case_id', (req, res) => {
  const riskCase = dbStore.getCaseById(req.params.case_id, getMerchantId(req));
  if (!riskCase) {
    return sendError(res, 404, 'CASE_NOT_FOUND', `Case ${req.params.case_id} was not found.`);
  }
  res.json(riskCase);
});

apiRouter.get('/recovery/queue', (req, res) => {
  const cases = dbStore.getCases(getMerchantId(req));
  // Queue contains cases that are pending, scored, decided, or scheduled
  const queue = cases.filter((c) => ['PENDING', 'SCORED', 'DECIDED', 'SCHEDULED', 'ESCALATED'].includes(c.status));
  res.json(queue);
});

apiRouter.get('/recovery/:case_id', (req, res) => {
  const riskCase = dbStore.getCaseById(req.params.case_id, getMerchantId(req));
  if (!riskCase) {
    return sendError(res, 404, 'CASE_NOT_FOUND', `Case ${req.params.case_id} not found.`);
  }
  res.json(riskCase);
});

// ==========================================
// 5. RECOVERY ACTIONS: ANALYZE, EXECUTE, STOP, ESCALATE
// ==========================================
apiRouter.post('/recovery/:case_id/analyze', async (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const riskCase = dbStore.getCaseById(req.params.case_id, merchantId);
    if (!riskCase) {
      return sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found');
    }

    const payment = dbStore.getPayment(riskCase.payment_id, merchantId);
    if (!payment) {
      return sendError(res, 404, 'PAYMENT_NOT_FOUND', 'Associated payment not found');
    }

    const customer = dbStore.getCustomer(payment.customer_id, merchantId);
    const policy = dbStore.getPolicy(merchantId);

    // 1. ML Scoring
    const features = MLRecoveryScorer.extractFeatures(payment, customer);
    const mlScore = MLRecoveryScorer.predictRecoveryProbability(features);
    const candidateStrategies = MLRecoveryScorer.compareCandidateStrategies(features, mlScore);

    riskCase.ml_score = mlScore;
    riskCase.status = 'SCORED';

    dbStore.addAuditEvent({
      merchant_id: merchantId,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'ML_PROBABILITY_SCORED',
      stage: 'SCORE',
      actor: 'ML_ENGINE',
      summary: `XGBoost ML model computed recovery likelihood at ${(mlScore.probability * 100).toFixed(0)}%.`,
      details: { mlScore, features },
    });

    // 2. AI Agent Decision (Nemotron or Fallback)
    const aiDecision = await AIAgentEngine.decide({
      riskCase,
      payment,
      customer,
      mlScore,
      policy,
      candidateStrategies,
    });
    riskCase.ai_decision = aiDecision;
    riskCase.status = 'DECIDED';
    dbStore.saveAIDecision(aiDecision);

    dbStore.addAuditEvent({
      merchant_id: merchantId,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'AI_DECISION_GENERATED',
      stage: 'DECIDE',
      actor: 'AI_AGENT',
      summary: `AI Agent (${aiDecision.ai_provider}) proposed ${aiDecision.action} (${(aiDecision.confidence * 100).toFixed(0)}% confidence).`,
      details: aiDecision,
    });

    // 3. Policy Guardrail Evaluation
    const policyEval = PolicyEngine.evaluate(policy, riskCase, payment, aiDecision.action);
    riskCase.policy_evaluation = policyEval;
    dbStore.savePolicyEvaluation(policyEval);

    dbStore.addAuditEvent({
      merchant_id: merchantId,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'POLICY_GUARDRAIL_EVALUATED',
      stage: 'POLICY',
      actor: 'POLICY_ENGINE',
      summary: `Policy check result: ${policyEval.verdict}. Action allowed: ${policyEval.allowed_action}.`,
      details: policyEval,
    });

    dbStore.saveCase(riskCase);
    res.json(dbStore.populateCase(riskCase));
  } catch (err: any) {
    sendError(res, 500, 'ANALYSIS_FAILED', err.message);
  }
});

apiRouter.post('/recovery/:case_id/execute', async (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const riskCase = dbStore.getCaseById(req.params.case_id, merchantId);
    if (!riskCase) {
      return sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found');
    }

    const payment = dbStore.getPayment(riskCase.payment_id, merchantId);
    if (!payment) {
      return sendError(res, 404, 'PAYMENT_NOT_FOUND', 'Associated payment not found');
    }

    const policy = dbStore.getPolicy(merchantId);

    // If not analyzed yet, run policy on requested or default action
    const actionToRun = req.body.action || riskCase.policy_evaluation?.allowed_action || 'RETRY_AFTER_DELAY';

    // Guardrail Check
    const policyEval = PolicyEngine.evaluate(policy, riskCase, payment, actionToRun);
    if (policyEval.verdict === 'BLOCKED') {
      return sendError(res, 400, 'POLICY_BLOCKED', `Action blocked by policy: ${policyEval.reasons.join(', ')}`);
    }

    const { actionRecord, updatedCase } = await RecoveryOrchestrator.executeAction({
      riskCase,
      payment,
      actionType: policyEval.allowed_action,
      delayMinutes: req.body.delay_minutes || 0,
      preferredSource: req.body.execution_source || policy.preferred_execution_provider || 'simulation',
    });

    res.json({
      action: actionRecord,
      case: updatedCase,
    });
  } catch (err: any) {
    sendError(res, 500, 'RECOVERY_EXECUTION_FAILED', err.message);
  }
});

apiRouter.post('/recovery/:case_id/stop', (req, res) => {
  const merchantId = getMerchantId(req);
  const riskCase = dbStore.getCaseById(req.params.case_id, merchantId);
  if (!riskCase) {
    return sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found');
  }

  riskCase.status = 'STOPPED';
  riskCase.notes = req.body.reason || 'Manually stopped by merchant administrator.';
  dbStore.saveCase(riskCase);

  dbStore.addAuditEvent({
    merchant_id: merchantId,
    case_id: riskCase.id,
    payment_id: riskCase.payment_id,
    event_type: 'MANUAL_OVERRIDE',
    stage: 'AUDIT',
    actor: 'MERCHANT_ADMIN',
    summary: `Recovery process stopped manually. Reason: ${riskCase.notes}`,
    details: { reason: riskCase.notes },
  });

  res.json(dbStore.populateCase(riskCase));
});

apiRouter.post('/recovery/:case_id/escalate', (req, res) => {
  const merchantId = getMerchantId(req);
  const riskCase = dbStore.getCaseById(req.params.case_id, merchantId);
  if (!riskCase) {
    return sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found');
  }

  riskCase.status = 'ESCALATED';
  riskCase.priority = 'CRITICAL';
  riskCase.notes = req.body.notes || 'Escalated for VIP Merchant Concierge review.';
  dbStore.saveCase(riskCase);

  dbStore.addAuditEvent({
    merchant_id: merchantId,
    case_id: riskCase.id,
    payment_id: riskCase.payment_id,
    event_type: 'CASE_ESCALATED',
    stage: 'POLICY',
    actor: 'MERCHANT_ADMIN',
    summary: `Case explicitly escalated to VIP specialist queue.`,
    details: { notes: riskCase.notes },
  });

  res.json(dbStore.populateCase(riskCase));
});

// ==========================================
// 6. AI DECISIONS LOG
// ==========================================
apiRouter.get('/ai/decisions', (req, res) => {
  const decisions = dbStore.getAllAIDecisions(getMerchantId(req));
  res.json(decisions);
});

apiRouter.get('/ai/decisions/:decision_id', (req, res) => {
  const decision = dbStore.getAIDecision(req.params.decision_id);
  if (!decision) {
    return sendError(res, 404, 'DECISION_NOT_FOUND', 'Decision not found');
  }
  res.json(decision);
});

// ==========================================
// 7. ANALYTICS & AUDIT
// ==========================================
apiRouter.get('/analytics/summary', (req, res) => {
  const summary = AnalyticsService.getDashboardSummary(getMerchantId(req));
  res.json(summary);
});

apiRouter.get('/analytics/failure-reasons', (req, res) => {
  const reasons = AnalyticsService.getFailureReasons(getMerchantId(req));
  res.json(reasons);
});

apiRouter.get('/analytics/interventions', (req, res) => {
  const interventions = AnalyticsService.getInterventions(getMerchantId(req));
  res.json(interventions);
});

apiRouter.get('/audit', (req, res) => {
  const caseId = req.query.case_id as string | undefined;
  const events = dbStore.getAuditEvents(getMerchantId(req), caseId);
  res.json(events);
});

apiRouter.get('/audit/export', (req, res) => {
  const caseId = req.query.case_id as string | undefined;
  const events = dbStore.getAuditEvents(getMerchantId(req), caseId);
  
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = [
    'Event ID',
    'Timestamp (ISO)',
    'Merchant ID',
    'Case ID',
    'Payment ID',
    'Stage',
    'Event Type',
    'Actor',
    'Summary',
    'Details (JSON)',
  ];

  const rows = events.map((e) => [
    escapeCsv(e.id),
    escapeCsv(e.timestamp),
    escapeCsv(e.merchant_id),
    escapeCsv(e.case_id || ''),
    escapeCsv(e.payment_id || ''),
    escapeCsv(e.stage),
    escapeCsv(e.event_type),
    escapeCsv(e.actor),
    escapeCsv(e.summary),
    escapeCsv(e.details),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="recoveriq_audit_trail_${new Date().toISOString().split('T')[0]}.csv"`);
  res.status(200).send(csvContent);
});

// ==========================================
// 8. SETTINGS & POLICY CONFIG
// ==========================================
apiRouter.get('/settings/policies', (req, res) => {
  const policy = dbStore.getPolicy(getMerchantId(req));
  res.json(policy);
});

apiRouter.put('/settings/policies', (req, res) => {
  try {
    const updated = dbStore.updatePolicy(getMerchantId(req), req.body);
    res.json(updated);
  } catch (err: any) {
    sendError(res, 400, 'POLICY_UPDATE_FAILED', err.message);
  }
});

// ==========================================
// 9. ML MODEL INFO & SCORING
// ==========================================
apiRouter.get('/ml/model-info', (_req, res) => {
  res.json(ML_MODEL_METADATA);
});

apiRouter.get('/ml/metrics', (_req, res) => {
  res.json({
    metrics: ML_MODEL_METADATA.metrics,
    dataset: ML_MODEL_METADATA.dataset_version,
    feature_importances: {
      failure_reason: 0.38,
      customer_payment_success_rate: 0.22,
      retry_count: 0.16,
      time_since_failure: 0.12,
      amount: 0.07,
      payment_method: 0.05,
    },
  });
});

apiRouter.post('/ml/score', (req, res) => {
  try {
    const features = req.body;
    const score = MLRecoveryScorer.predictRecoveryProbability(features);
    res.json(score);
  } catch (err: any) {
    sendError(res, 400, 'ML_SCORING_FAILED', err.message);
  }
});

// ==========================================
// 10. DEMO RUNNER & SEEDING
// ==========================================
apiRouter.post('/demo/run', async (req, res) => {
  try {
    const scenario = req.body.scenario || 'golden_path';
    const result = await DemoService.runScenario(scenario);
    res.json(result);
  } catch (err: any) {
    sendError(res, 500, 'DEMO_RUN_FAILED', err.message);
  }
});

apiRouter.post('/demo/seed', (_req, res) => {
  dbStore.seedInitialData();
  res.json({
    success: true,
    message: 'Database reseeded successfully with canonical scenarios and audit history.',
  });
});

apiRouter.post('/events/ingest', (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const { amount, failure_reason, failure_code, failure_description, payment_method, customer_name, customer_email, source } = req.body;

    const riskCase = dbStore.ingestNewPaymentEvent({
      event_id: `evt_ingest_${Date.now()}`,
      merchant_id: merchantId,
      amount: Number(amount) || 4999,
      failure_reason: failure_reason || 'temporary_network_failure',
      failure_code: failure_code || 'GATEWAY_TIMEOUT',
      failure_description: failure_description || 'Live payment failure event ingested',
      payment_method: payment_method || 'upi',
      customer_name,
      customer_email,
      source: source || 'simulation',
    });

    res.status(201).json({
      success: true,
      case: riskCase,
    });
  } catch (err: any) {
    sendError(res, 400, 'EVENT_INGESTION_FAILED', err.message);
  }
});

// ==========================================
// 11. RECOVERY LIFT LAB & BENCHMARKING
// ==========================================
apiRouter.get('/analytics/lift', (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const lift = RecoveryLiftService.getLiftMetrics(merchantId);
    res.json(lift);
  } catch (err: any) {
    sendError(res, 500, 'LIFT_CALCULATION_FAILED', err.message);
  }
});

// ==========================================
// 12. PAYMENT DEGRADATION & OUTAGE RADAR
// ==========================================
apiRouter.get('/degradation/alerts', (_req, res) => {
  try {
    const alerts = degradationTracker.getAlerts();
    res.json(alerts);
  } catch (err: any) {
    sendError(res, 500, 'DEGRADATION_FETCH_FAILED', err.message);
  }
});

apiRouter.post('/degradation/mitigate', (req, res) => {
  try {
    const { alert_id, active } = req.body;
    if (!alert_id) {
      return sendError(res, 400, 'INVALID_INPUT', 'Alert ID is required.');
    }
    const updated = degradationTracker.toggleMitigation(alert_id, active);
    res.json({
      success: true,
      alert: updated,
      message: `Mitigation for ${updated.issuer_or_network} is now ${updated.mitigation_active ? 'ACTIVE' : 'INACTIVE'}.`,
    });
  } catch (err: any) {
    sendError(res, 500, 'MITIGATION_UPDATE_FAILED', err.message);
  }
});

// ==========================================
// 13. POLICY SIMULATOR & WHAT-IF ENGINE
// ==========================================
apiRouter.post('/policy/simulate', (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const input = req.body;
    const result = PolicySimulatorService.simulate(merchantId, {
      max_retries: Number(input.max_retries) || 3,
      max_recovery_window_hours: Number(input.max_recovery_window_hours) || 72,
      max_auto_recovery_amount: Number(input.max_auto_recovery_amount) || 25000,
      high_value_review_threshold: Number(input.high_value_review_threshold) || 10000,
      quiet_hours_start: Number(input.quiet_hours_start) || 22,
      quiet_hours_end: Number(input.quiet_hours_end) || 8,
      auto_recovery_enabled: input.auto_recovery_enabled !== false,
      enable_auto_cooldown: Boolean(input.enable_auto_cooldown),
      preferred_channels: input.preferred_channels || ['api', 'whatsapp', 'sms'],
    });
    res.json(result);
  } catch (err: any) {
    sendError(res, 500, 'SIMULATION_FAILED', err.message);
  }
});

apiRouter.post('/policy/natural-parse', (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const { prompt } = req.body;
    if (!prompt) {
      return sendError(res, 400, 'INVALID_INPUT', 'Natural language prompt is required.');
    }
    const currentPolicy = dbStore.getPolicy(merchantId);
    const parsed = NaturalPolicyEngine.parsePrompt(prompt, currentPolicy);
    res.json(parsed);
  } catch (err: any) {
    sendError(res, 500, 'NATURAL_PARSE_FAILED', err.message);
  }
});

// ==========================================
// 14. UNRECOVERED REVENUE AUTOPSY & PLAYBOOK
// ==========================================
apiRouter.get('/analytics/unrecovered', (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const analysis = UnrecoveredRevenueService.getAnalysis(merchantId);
    res.json(analysis);
  } catch (err: any) {
    sendError(res, 500, 'UNRECOVERED_ANALYSIS_FAILED', err.message);
  }
});

// ==========================================
// 15. CASE COUNTERFACTUAL WHAT-IF SCENARIOS
// ==========================================
apiRouter.get('/recovery/:case_id/counterfactual', (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const riskCase = dbStore.getCaseById(req.params.case_id, merchantId);
    if (!riskCase) {
      return sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found');
    }
    const scenarios = CounterfactualService.generateScenarios(riskCase);
    res.json({
      case_id: riskCase.id,
      amount: riskCase.at_risk_amount,
      scenarios,
    });
  } catch (err: any) {
    sendError(res, 500, 'COUNTERFACTUAL_FAILED', err.message);
  }
});

// ==========================================
// 16. CUSTOMER FATIGUE PROFILE
// ==========================================
apiRouter.get('/customers/:customer_id/fatigue', (req, res) => {
  try {
    const merchantId = getMerchantId(req);
    const profile = CustomerFatigueEngine.getFatigueProfile(req.params.customer_id, merchantId);
    res.json(profile);
  } catch (err: any) {
    sendError(res, 500, 'FATIGUE_FETCH_FAILED', err.message);
  }
});

