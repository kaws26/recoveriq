// In-memory Database Store with Tenant Isolation, Indexes, Transactions & Audit Trails
import {
  Merchant,
  Customer,
  Payment,
  RevenueRiskCase,
  PolicyConfig,
  PolicyEvaluation,
  AIDecision,
  RecoveryActionRecord,
  AuditEvent,
  CaseStatus,
  FailureReason,
  PaymentMethod,
  RecoveryActionType,
  MakerCheckerRequest,
  GatewayRouteHealth,
  EnterpriseRole,
} from '../../types';
import { NextBestActionEngine } from '../services/nba';
import { CustomerFatigueEngine } from '../services/fatigue';
import { MLRecoveryScorer } from '../services/ml';
import { DiagnosticEngine } from '../services/diagnosis';


class RecoverIQDataStore {
  private merchants: Map<string, Merchant> = new Map();
  private customers: Map<string, Customer> = new Map();
  private payments: Map<string, Payment> = new Map();
  private cases: Map<string, RevenueRiskCase> = new Map();
  private policies: Map<string, PolicyConfig> = new Map();
  private policyEvaluations: Map<string, PolicyEvaluation> = new Map();
  private aiDecisions: Map<string, AIDecision> = new Map();
  private recoveryActions: Map<string, RecoveryActionRecord> = new Map();
  private auditEvents: AuditEvent[] = [];
  private idempotencyKeys: Set<string> = new Set();
  private makerCheckerRequests: Map<string, MakerCheckerRequest> = new Map();
  private gatewayRoutes: GatewayRouteHealth[] = [];

  constructor() {
    this.seedInitialData();
  }

  // --- SEED DATA ENGINE ---
  public seedInitialData() {
    this.merchants.clear();
    this.customers.clear();
    this.payments.clear();
    this.cases.clear();
    this.policies.clear();
    this.policyEvaluations.clear();
    this.aiDecisions.clear();
    this.recoveryActions.clear();
    this.auditEvents = [];
    this.idempotencyKeys.clear();

    const now = new Date();
    const isoNow = now.toISOString();

    // 1. Merchant
    const defaultMerchant: Merchant = {
      id: 'merchant_rzp_live_01',
      name: 'Apex Digital Technologies Pvt Ltd',
      email: 'finance@apexdigital.in',
      currency: 'INR',
      razorpay_configured: Boolean(process.env.RAZORPAY_KEY_ID),
      nvidia_configured: Boolean(process.env.NVIDIA_API_KEY),
      demo_mode: process.env.DEMO_MODE !== 'false',
      created_at: new Date(now.getTime() - 90 * 86400000).toISOString(),
    };
    this.merchants.set(defaultMerchant.id, defaultMerchant);

    // 2. Policy Configuration for Merchant
    const defaultPolicy: PolicyConfig = {
      merchant_id: defaultMerchant.id,
      max_retries: 3,
      max_recovery_window_hours: 72,
      max_auto_recovery_amount: 25000,
      high_value_review_threshold: 10000,
      quiet_hours_start: 22,
      quiet_hours_end: 8,
      auto_recovery_enabled: true,
      preferred_execution_provider: (process.env.RECOVERY_EXECUTION_PROVIDER as any) || 'simulation',
      updated_at: isoNow,
    };
    this.policies.set(defaultMerchant.id, defaultPolicy);

    // 3. Customers
    const seededCustomers: Customer[] = [
      {
        id: 'cust_01',
        merchant_id: defaultMerchant.id,
        name: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        phone: '+919876543210',
        lifetime_value: 84500,
        payment_success_rate: 0.94,
        recovery_rate: 0.90,
        total_transactions: 18,
        failed_transactions: 1,
        recovered_transactions: 1,
        created_at: new Date(now.getTime() - 180 * 86400000).toISOString(),
      },
      {
        id: 'cust_02',
        merchant_id: defaultMerchant.id,
        name: 'Priya Venkatesh',
        email: 'priya.v@enterprise.co',
        phone: '+919811223344',
        lifetime_value: 320000,
        payment_success_rate: 0.98,
        recovery_rate: 0.95,
        total_transactions: 42,
        failed_transactions: 2,
        recovered_transactions: 2,
        created_at: new Date(now.getTime() - 365 * 86400000).toISOString(),
      },
      {
        id: 'cust_03',
        merchant_id: defaultMerchant.id,
        name: 'Vikram Malhotra',
        email: 'v.malhotra@cloudcorp.io',
        phone: '+919988776655',
        lifetime_value: 12500,
        payment_success_rate: 0.45,
        recovery_rate: 0.20,
        total_transactions: 6,
        failed_transactions: 4,
        recovered_transactions: 0,
        created_at: new Date(now.getTime() - 45 * 86400000).toISOString(),
      },
      {
        id: 'cust_04',
        merchant_id: defaultMerchant.id,
        name: 'Ananya Deshmukh',
        email: 'ananya.d@fintechinnovate.com',
        phone: '+919765432109',
        lifetime_value: 48000,
        payment_success_rate: 0.88,
        recovery_rate: 0.82,
        total_transactions: 12,
        failed_transactions: 2,
        recovered_transactions: 1,
        created_at: new Date(now.getTime() - 120 * 86400000).toISOString(),
      },
      {
        id: 'cust_05',
        merchant_id: defaultMerchant.id,
        name: 'Siddharth Roy',
        email: 'siddharth@royconsulting.in',
        phone: '+919823456789',
        lifetime_value: 154000,
        payment_success_rate: 0.92,
        recovery_rate: 0.88,
        total_transactions: 24,
        failed_transactions: 2,
        recovered_transactions: 1,
        created_at: new Date(now.getTime() - 200 * 86400000).toISOString(),
      },
    ];
    seededCustomers.forEach((c) => this.customers.set(c.id, c));

    // 4. Primary Hackathon Showcase Cases
    // Case 1 (Golden Path Demo): ₹4,999 Temporary Network Failure -> Ready to Analyze & Recover
    this.createSeededCase({
      case_id: 'case_demo_gold_01',
      payment_id: 'pay_rzp_demo_4999',
      customer_id: 'cust_01',
      merchant_id: defaultMerchant.id,
      amount: 4999,
      payment_method: 'upi',
      failure_reason: 'temporary_network_failure',
      failure_code: 'GATEWAY_TIMEOUT',
      failure_description: 'NPCI UPI Gateway response timeout during collect request',
      retry_count: 0,
      subscription_flag: true,
      mandate_flag: false,
      checkout_abandoned: false,
      status: 'PENDING',
      priority: 'HIGH',
      minutes_ago: 12,
    });

    // Case 2 (High Value Policy Escalation): ₹38,500 High Value Enterprise Subscription
    this.createSeededCase({
      case_id: 'case_demo_highval_02',
      payment_id: 'pay_rzp_demo_38500',
      customer_id: 'cust_02',
      merchant_id: defaultMerchant.id,
      amount: 38500,
      payment_method: 'card',
      failure_reason: 'bank_unavailable',
      failure_code: 'HDFC_CORE_BANKING_DOWN',
      failure_description: 'Issuer bank host offline for scheduled maintenance',
      retry_count: 1,
      subscription_flag: true,
      mandate_flag: true,
      checkout_abandoned: false,
      status: 'ESCALATED',
      priority: 'CRITICAL',
      minutes_ago: 45,
      with_ml: true,
      with_policy_escalation: true,
    });

    // Case 3 (Max Retries Policy Blocked): ₹1,850 Over Retried
    this.createSeededCase({
      case_id: 'case_demo_blocked_03',
      payment_id: 'pay_rzp_demo_1850',
      customer_id: 'cust_03',
      merchant_id: defaultMerchant.id,
      amount: 1850,
      payment_method: 'card',
      failure_reason: 'insufficient_funds',
      failure_code: 'INSUFFICIENT_FUNDS',
      failure_description: 'Declined by issuer due to insufficient balance in debit account',
      retry_count: 3,
      subscription_flag: false,
      mandate_flag: false,
      checkout_abandoned: false,
      status: 'BLOCKED',
      priority: 'LOW',
      minutes_ago: 120,
      with_ml: true,
      with_policy_block: true,
    });

    // Case 4 (Already Recovered Demo Case): ₹14,999 Annual SaaS Plan Recovered
    this.createSeededCase({
      case_id: 'case_demo_recovered_04',
      payment_id: 'pay_rzp_demo_14999',
      customer_id: 'cust_04',
      merchant_id: defaultMerchant.id,
      amount: 14999,
      payment_method: 'card',
      failure_reason: 'temporary_network_failure',
      failure_code: '3DS_TIMEOUT',
      failure_description: 'ACS 2FA challenge timed out during customer verification',
      retry_count: 1,
      subscription_flag: true,
      mandate_flag: false,
      checkout_abandoned: false,
      status: 'SUCCEEDED',
      recovered_amount: 14999,
      priority: 'HIGH',
      minutes_ago: 360,
      with_ml: true,
      with_full_recovery_trail: true,
    });

    // Case 5 (Payment Link / Insufficient Funds Reminder): ₹7,499
    this.createSeededCase({
      case_id: 'case_demo_remind_05',
      payment_id: 'pay_rzp_demo_7499',
      customer_id: 'cust_05',
      merchant_id: defaultMerchant.id,
      amount: 7499,
      payment_method: 'upi',
      failure_reason: 'insufficient_funds',
      failure_code: 'UPI_INSUFFICIENT_FUNDS',
      failure_description: 'User balance below transaction threshold',
      retry_count: 1,
      subscription_flag: false,
      mandate_flag: false,
      checkout_abandoned: false,
      status: 'SCHEDULED',
      priority: 'MEDIUM',
      minutes_ago: 80,
      with_ml: true,
      with_decision: true,
    });

    // Additional Historical Ingested Records for realistic Analytics & Funnels
    this.seedHistoricalCases(defaultMerchant.id);
  }

  private createSeededCase(params: {
    case_id: string;
    payment_id: string;
    customer_id: string;
    merchant_id: string;
    amount: number;
    payment_method: PaymentMethod;
    failure_reason: FailureReason;
    failure_code: string;
    failure_description: string;
    retry_count: number;
    subscription_flag: boolean;
    mandate_flag: boolean;
    checkout_abandoned: boolean;
    status: CaseStatus;
    recovered_amount?: number;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    minutes_ago: number;
    with_ml?: boolean;
    with_decision?: boolean;
    with_policy_escalation?: boolean;
    with_policy_block?: boolean;
    with_full_recovery_trail?: boolean;
  }) {
    const occurredAt = new Date(Date.now() - params.minutes_ago * 60000).toISOString();

    const payment: Payment = {
      id: params.payment_id,
      merchant_id: params.merchant_id,
      customer_id: params.customer_id,
      amount: params.amount,
      currency: 'INR',
      status: params.recovered_amount ? 'captured' : 'failed',
      payment_method: params.payment_method,
      failure_reason: params.failure_reason,
      failure_code: params.failure_code,
      failure_description: params.failure_description,
      retry_count: params.retry_count,
      subscription_flag: params.subscription_flag,
      mandate_flag: params.mandate_flag,
      checkout_abandoned: params.checkout_abandoned,
      external_reference: `rzp_${params.payment_id}`,
      occurred_at: occurredAt,
      created_at: occurredAt,
    };
    this.payments.set(payment.id, payment);

    const customer = this.customers.get(params.customer_id);

    const riskCase: RevenueRiskCase = {
      id: params.case_id,
      merchant_id: params.merchant_id,
      payment_id: payment.id,
      status: params.status,
      priority: params.priority,
      at_risk_amount: params.amount,
      recovered_amount: params.recovered_amount || 0,
      execution_source: 'simulation',
      recovery_attempts: params.retry_count,
      tags: [params.payment_method.toUpperCase(), params.failure_reason],
      created_at: occurredAt,
      updated_at: occurredAt,
    };

    // Stage 1 Audit: Detection
    this.auditEvents.push({
      id: `aud_detect_${riskCase.id}`,
      merchant_id: params.merchant_id,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'PAYMENT_FAILED_DETECTED',
      stage: 'DETECT',
      actor: 'SYSTEM_INGEST',
      summary: `Failed payment of ₹${params.amount.toLocaleString('en-IN')} ingested via Razorpay webhook. Reason: ${params.failure_code}`,
      details: {
        amount: params.amount,
        failure_reason: params.failure_reason,
        method: params.payment_method,
      },
      timestamp: occurredAt,
    });

    // Stage 2: Root Cause Diagnosis & Error Forensics
    const diagnosis = DiagnosticEngine.diagnose(payment, customer, params.merchant_id, riskCase.id);
    riskCase.diagnosis = diagnosis;

    this.auditEvents.push({
      id: `aud_diag_${riskCase.id}`,
      merchant_id: params.merchant_id,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'DIAGNOSIS_COMPLETED',
      stage: 'DIAGNOSE',
      actor: 'DIAGNOSTIC_ENGINE',
      summary: `Stage 2 Diagnosis: ${diagnosis.classification} failure categorized under ${diagnosis.category}. ${diagnosis.root_cause_title}. Recoverability score: ${diagnosis.recoverability_score}/100.`,
      details: diagnosis,
      timestamp: new Date(new Date(occurredAt).getTime() + 5000).toISOString(),
    });

    if (params.with_ml || params.with_full_recovery_trail || params.with_decision || params.with_policy_escalation || params.with_policy_block) {
      riskCase.ml_score = {
        probability: params.failure_reason === 'temporary_network_failure' ? 0.87 : params.amount > 30000 ? 0.74 : 0.62,
        confidence_interval: [0.82, 0.91],
        risk_band: params.failure_reason === 'temporary_network_failure' ? 'HIGH_PROBABILITY' : 'MODERATE',
        feature_importances: {
          failure_reason: 0.38,
          customer_payment_success_rate: 0.24,
          time_since_failure: 0.16,
          retry_count: 0.12,
          amount: 0.10,
        },
        model_version: 'recovery_xgb_v1.2.0',
        calculated_at: new Date(Date.now() - (params.minutes_ago - 2) * 60000).toISOString(),
      };

      this.auditEvents.push({
        id: `aud_ml_${riskCase.id}`,
        merchant_id: params.merchant_id,
        case_id: riskCase.id,
        payment_id: payment.id,
        event_type: 'ML_PROBABILITY_SCORED',
        stage: 'SCORE',
        actor: 'ML_ENGINE',
        summary: `XGBoost ML probability scored at ${(riskCase.ml_score.probability * 100).toFixed(0)}% likelihood of recovery.`,
        details: {
          probability: riskCase.ml_score.probability,
          risk_band: riskCase.ml_score.risk_band,
          model_version: riskCase.ml_score.model_version,
        },
        timestamp: riskCase.ml_score.calculated_at,
      });
    }

    if (params.with_policy_escalation) {
      riskCase.policy_evaluation = {
        id: `pol_eval_${riskCase.id}`,
        case_id: riskCase.id,
        verdict: 'ESCALATED_HUMAN_REVIEW',
        evaluated_action: 'RETRY_AFTER_DELAY',
        allowed_action: 'ESCALATE',
        rules_checked: [
          { rule_id: 'POL-001', name: 'Max Retries Check', description: 'Ensure attempts < 3', passed: true, severity: 'BLOCK' },
          { rule_id: 'POL-003', name: 'Auto-Recovery Ceiling', description: 'Ensure amount ≤ ₹25,000', passed: false, severity: 'ESCALATE', reason: 'Amount ₹38,500 exceeds auto-recovery threshold ₹25,000' },
          { rule_id: 'POL-004', name: 'High-Value Review Threshold', description: 'Requires approval if ≥ ₹10,000', passed: false, severity: 'ESCALATE', reason: 'High-value enterprise transaction requires human specialist review' },
        ],
        reasons: ['Amount ₹38,500 exceeds auto-recovery limit ₹25,000. Escalated to VIP Merchant Operations.'],
        evaluated_at: new Date(Date.now() - (params.minutes_ago - 3) * 60000).toISOString(),
      };

      this.auditEvents.push({
        id: `aud_pol_${riskCase.id}`,
        merchant_id: params.merchant_id,
        case_id: riskCase.id,
        payment_id: payment.id,
        event_type: 'POLICY_GUARDRAIL_EVALUATED',
        stage: 'POLICY',
        actor: 'POLICY_ENGINE',
        summary: `Deterministic policy engine triggered escalation: Amount ₹38,500 exceeds ₹25,000 auto-recovery ceiling.`,
        details: riskCase.policy_evaluation,
        timestamp: riskCase.policy_evaluation.evaluated_at,
      });
    }

    if (params.with_policy_block) {
      riskCase.policy_evaluation = {
        id: `pol_eval_${riskCase.id}`,
        case_id: riskCase.id,
        verdict: 'BLOCKED',
        evaluated_action: 'RETRY_NOW',
        allowed_action: 'STOP',
        rules_checked: [
          { rule_id: 'POL-001', name: 'Max Retries Check', description: 'Ensure attempts < 3', passed: false, severity: 'BLOCK', reason: 'Retry count is 3 (limit: 3)' },
        ],
        reasons: ['Maximum allowable retries (3) reached. Automated recovery stopped to prevent customer harassment and bank penalty.'],
        evaluated_at: new Date(Date.now() - (params.minutes_ago - 3) * 60000).toISOString(),
      };

      this.auditEvents.push({
        id: `aud_pol_${riskCase.id}`,
        merchant_id: params.merchant_id,
        case_id: riskCase.id,
        payment_id: payment.id,
        event_type: 'CASE_BLOCKED',
        stage: 'POLICY',
        actor: 'POLICY_ENGINE',
        summary: `Policy blocked further retry attempts: Max retries threshold (3) reached.`,
        details: riskCase.policy_evaluation,
        timestamp: riskCase.policy_evaluation.evaluated_at,
      });
    }

    if (params.with_full_recovery_trail) {
      const execTime = new Date(Date.now() - (params.minutes_ago - 10) * 60000).toISOString();
      const verifTime = new Date(Date.now() - (params.minutes_ago - 11) * 60000).toISOString();

      riskCase.latest_action = {
        id: `act_${riskCase.id}`,
        case_id: riskCase.id,
        merchant_id: params.merchant_id,
        action_type: 'RETRY_AFTER_DELAY',
        status: 'SUCCEEDED',
        execution_source: 'simulation',
        idempotency_key: `idem_${riskCase.id}_01`,
        executed_at: execTime,
        verified_at: verifTime,
        external_transaction_id: `sim_tx_rec_${params.payment_id}`,
        recovered_amount: params.amount,
        created_at: execTime,
      };

      this.auditEvents.push({
        id: `aud_exec_${riskCase.id}`,
        merchant_id: params.merchant_id,
        case_id: riskCase.id,
        payment_id: payment.id,
        event_type: 'RECOVERY_PROVIDER_RESPONSE',
        stage: 'EXECUTE',
        actor: 'EXECUTION_PROVIDER',
        summary: `Simulation provider executed delayed retry (ID: sim_tx_rec_${params.payment_id}). Status: SUCCESS.`,
        details: { execution_source: 'simulation', external_ref: `sim_tx_rec_${params.payment_id}` },
        timestamp: execTime,
      });

      this.auditEvents.push({
        id: `aud_verif_${riskCase.id}`,
        merchant_id: params.merchant_id,
        case_id: riskCase.id,
        payment_id: payment.id,
        event_type: 'OUTCOME_VERIFIED',
        stage: 'VERIFY',
        actor: 'SYSTEM_INGEST',
        summary: `Independent cryptographic verification confirmed transaction capture. Outcome: VERIFIED SUCCESS.`,
        details: { status: 'SUCCEEDED', verified_amount: params.amount },
        timestamp: verifTime,
      });

      this.auditEvents.push({
        id: `aud_rec_${riskCase.id}`,
        merchant_id: params.merchant_id,
        case_id: riskCase.id,
        payment_id: payment.id,
        event_type: 'REVENUE_RECOVERED_RECORDED',
        stage: 'MEASURE',
        actor: 'SYSTEM_INGEST',
        summary: `Recovered ₹${params.amount.toLocaleString('en-IN')} added to Merchant ledger.`,
        details: { recovered_amount: params.amount, currency: 'INR' },
        timestamp: verifTime,
      });
    }

    this.cases.set(riskCase.id, riskCase);
  }

  private seedHistoricalCases(merchantId: string) {
    const baseDate = new Date();
    // Seed 25 background historical cases for rich metrics and charts
    const historicalConfigs = [
      { amount: 2499, reason: 'temporary_network_failure' as FailureReason, status: 'SUCCEEDED' as CaseStatus, daysAgo: 1 },
      { amount: 5999, reason: 'temporary_network_failure' as FailureReason, status: 'SUCCEEDED' as CaseStatus, daysAgo: 2 },
      { amount: 12000, reason: 'bank_unavailable' as FailureReason, status: 'SUCCEEDED' as CaseStatus, daysAgo: 2 },
      { amount: 3500, reason: 'insufficient_funds' as FailureReason, status: 'SUCCEEDED' as CaseStatus, daysAgo: 3 },
      { amount: 1999, reason: 'temporary_network_failure' as FailureReason, status: 'SUCCEEDED' as CaseStatus, daysAgo: 4 },
      { amount: 22000, reason: 'bank_unavailable' as FailureReason, status: 'ESCALATED' as CaseStatus, daysAgo: 4 },
      { amount: 1499, reason: 'expired_card' as FailureReason, status: 'BLOCKED' as CaseStatus, daysAgo: 5 },
      { amount: 8999, reason: 'temporary_network_failure' as FailureReason, status: 'SUCCEEDED' as CaseStatus, daysAgo: 5 },
      { amount: 4500, reason: 'insufficient_funds' as FailureReason, status: 'FAILED' as CaseStatus, daysAgo: 6 },
      { amount: 16500, reason: 'temporary_network_failure' as FailureReason, status: 'SUCCEEDED' as CaseStatus, daysAgo: 7 },
    ];

    historicalConfigs.forEach((h, index) => {
      const time = new Date(baseDate.getTime() - h.daysAgo * 86400000 - index * 3600000).toISOString();
      const pId = `pay_hist_${index + 10}`;
      const cId = `case_hist_${index + 10}`;

      const p: Payment = {
        id: pId,
        merchant_id: merchantId,
        customer_id: 'cust_01',
        amount: h.amount,
        currency: 'INR',
        status: h.status === 'SUCCEEDED' ? 'captured' : 'failed',
        payment_method: 'upi',
        failure_reason: h.reason,
        failure_code: 'HIST_ERR',
        failure_description: 'Historical transaction log',
        retry_count: h.status === 'SUCCEEDED' ? 1 : 2,
        subscription_flag: true,
        mandate_flag: false,
        checkout_abandoned: false,
        occurred_at: time,
        created_at: time,
      };
      this.payments.set(p.id, p);

      const rCase: RevenueRiskCase = {
        id: cId,
        merchant_id: merchantId,
        payment_id: p.id,
        status: h.status,
        priority: h.amount > 10000 ? 'HIGH' : 'MEDIUM',
        at_risk_amount: h.amount,
        recovered_amount: h.status === 'SUCCEEDED' ? h.amount : 0,
        execution_source: 'simulation',
        recovery_attempts: 1,
        tags: [h.reason],
        created_at: time,
        updated_at: time,
      };
      this.cases.set(rCase.id, rCase);
    });
  }

  // --- REPOSITORIES & QUERIES (with Merchant Isolation) ---

  public getMerchant(merchantId: string): Merchant | undefined {
    return this.merchants.get(merchantId);
  }

  public getPolicy(merchantId: string): PolicyConfig {
    let policy = this.policies.get(merchantId);
    if (!policy) {
      policy = {
        merchant_id: merchantId,
        max_retries: 3,
        max_recovery_window_hours: 72,
        max_auto_recovery_amount: 25000,
        high_value_review_threshold: 10000,
        quiet_hours_start: 22,
        quiet_hours_end: 8,
        auto_recovery_enabled: true,
        preferred_execution_provider: 'simulation',
        updated_at: new Date().toISOString(),
      };
      this.policies.set(merchantId, policy);
    }
    return policy;
  }

  public updatePolicy(merchantId: string, updates: Partial<PolicyConfig>): PolicyConfig {
    const current = this.getPolicy(merchantId);
    const updated: PolicyConfig = {
      ...current,
      ...updates,
      merchant_id: merchantId,
      updated_at: new Date().toISOString(),
    };
    this.policies.set(merchantId, updated);

    this.addAuditEvent({
      merchant_id: merchantId,
      event_type: 'POLICY_UPDATED',
      stage: 'POLICY',
      actor: 'MERCHANT_ADMIN',
      summary: 'Merchant recovery policy rules and thresholds updated.',
      details: updates,
    });

    return updated;
  }

  public getCases(merchantId: string, filter?: { status?: string; search?: string }): RevenueRiskCase[] {
    const list: RevenueRiskCase[] = [];
    for (const c of this.cases.values()) {
      if (c.merchant_id !== merchantId) continue;
      if (filter?.status && filter.status !== 'ALL' && c.status !== filter.status) continue;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const payment = this.payments.get(c.payment_id);
        const customer = payment ? this.customers.get(payment.customer_id) : undefined;
        const match =
          c.id.toLowerCase().includes(q) ||
          c.payment_id.toLowerCase().includes(q) ||
          (customer && customer.name.toLowerCase().includes(q)) ||
          (payment && payment.failure_description.toLowerCase().includes(q));
        if (!match) continue;
      }
      // Attach populated relations
      const populated = this.populateCase(c);
      list.push(populated);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getCaseById(caseId: string, merchantId: string): RevenueRiskCase | undefined {
    const c = this.cases.get(caseId);
    if (!c || c.merchant_id !== merchantId) return undefined;
    return this.populateCase(c);
  }

  public populateCase(c: RevenueRiskCase): RevenueRiskCase {
    const payment = this.payments.get(c.payment_id);
    const customer = payment ? this.customers.get(payment.customer_id) : undefined;
    const policy = this.getPolicy(c.merchant_id);

    // Compute or extract ML score if not already present
    let mlScore = c.ml_score;
    if (!mlScore && payment) {
      const features = MLRecoveryScorer.extractFeatures(payment, customer);
      mlScore = MLRecoveryScorer.predictRecoveryProbability(features);
    }

    // Compute Next Best Actions & Customer Fatigue
    let nextBestActions = c.next_best_actions;
    let fatigueProfile = c.fatigue_profile;

    if (payment && mlScore && policy) {
      if (!nextBestActions || nextBestActions.length === 0) {
        nextBestActions = NextBestActionEngine.rankActions({
          payment,
          customer,
          mlScore,
          policy,
          riskCase: c,
        });
      }
      if (customer && !fatigueProfile) {
        fatigueProfile = CustomerFatigueEngine.getFatigueProfile(customer.id, c.merchant_id);
      }
    }

    return {
      ...c,
      payment: payment ? { ...payment, customer } : undefined,
      customer,
      ml_score: mlScore,
      next_best_actions: nextBestActions,
      fatigue_profile: fatigueProfile,
    };
  }

  public saveCase(c: RevenueRiskCase): void {
    c.updated_at = new Date().toISOString();
    this.cases.set(c.id, c);
  }

  public getPayment(paymentId: string, merchantId: string): Payment | undefined {
    const p = this.payments.get(paymentId);
    if (!p || p.merchant_id !== merchantId) return undefined;
    const customer = this.customers.get(p.customer_id);
    return { ...p, customer };
  }

  public registerCompany(payload: {
    company_name: string;
    business_email: string;
    currency?: string;
    country?: string;
  }): Merchant {
    const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const merchant: Merchant = {
      id: merchantId,
      name: payload.company_name,
      email: payload.business_email,
      currency: payload.currency || 'INR',
      razorpay_configured: false,
      nvidia_configured: Boolean(process.env.NVIDIA_API_KEY),
      demo_mode: false,
      created_at: now,
    };
    this.merchants.set(merchant.id, merchant);

    // Initialize default policy for new company
    const policy: PolicyConfig = {
      merchant_id: merchant.id,
      max_retries: 3,
      max_recovery_window_hours: 72,
      max_auto_recovery_amount: 25000,
      high_value_review_threshold: 10000,
      quiet_hours_start: 22,
      quiet_hours_end: 8,
      auto_recovery_enabled: true,
      preferred_execution_provider: 'simulation',
      updated_at: now,
    };
    this.policies.set(merchant.id, policy);

    this.addAuditEvent({
      merchant_id: merchant.id,
      event_type: 'POLICY_UPDATED',
      stage: 'AUDIT',
      actor: 'MERCHANT_ADMIN',
      summary: `New company '${merchant.name}' registered with currency ${merchant.currency}.`,
      details: { company_name: merchant.name, email: merchant.email, currency: merchant.currency },
    });

    return merchant;
  }

  public createPaymentOrder(params: {
    merchant_id: string;
    amount: number;
    currency: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    description: string;
    razorpay_order_id?: string;
  }): Payment {
    const now = new Date().toISOString();

    // Ensure or create customer
    let customer: Customer | undefined;
    for (const c of this.customers.values()) {
      if (c.merchant_id === params.merchant_id && c.email.toLowerCase() === params.customer_email.toLowerCase()) {
        customer = c;
        break;
      }
    }

    if (!customer) {
      const custId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      customer = {
        id: custId,
        merchant_id: params.merchant_id,
        name: params.customer_name,
        email: params.customer_email,
        phone: params.customer_phone || '+919876543210',
        lifetime_value: params.amount,
        payment_success_rate: 0.9,
        recovery_rate: 0.85,
        total_transactions: 1,
        failed_transactions: 0,
        recovered_transactions: 0,
        created_at: now,
      };
      this.customers.set(customer.id, customer);
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payment: Payment = {
      id: paymentId,
      merchant_id: params.merchant_id,
      customer_id: customer.id,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: 'pending',
      payment_method: 'upi',
      failure_reason: 'temporary_network_failure',
      failure_code: 'INITIATED',
      failure_description: params.description || 'Order checkout initiated',
      retry_count: 0,
      subscription_flag: false,
      mandate_flag: false,
      checkout_abandoned: false,
      external_reference: params.razorpay_order_id || `ord_${Date.now()}`,
      occurred_at: now,
      created_at: now,
    };

    this.payments.set(payment.id, payment);

    this.addAuditEvent({
      merchant_id: params.merchant_id,
      payment_id: payment.id,
      event_type: 'CASE_CREATED',
      stage: 'DETECT',
      actor: 'MERCHANT_ADMIN',
      summary: `Test payment of ₹${params.amount.toLocaleString('en-IN')} created for ${params.customer_name}. Checkout link ready.`,
      details: { amount: params.amount, description: params.description, customer: params.customer_name },
    });

    return { ...payment, customer };
  }

  public getCheckoutSession(paymentId: string): (Payment & { merchant_name: string; customer?: Customer }) | undefined {
    const payment = this.payments.get(paymentId);
    if (!payment) return undefined;
    const customer = this.customers.get(payment.customer_id);
    const merchant = this.merchants.get(payment.merchant_id);

    return {
      ...payment,
      customer,
      merchant_name: merchant?.name || 'RecoverIQ Merchant',
    };
  }

  public getAllPayments(merchantId: string): Payment[] {
    const list: Payment[] = [];
    for (const p of this.payments.values()) {
      if (p.merchant_id === merchantId) {
        const customer = this.customers.get(p.customer_id);
        list.push({ ...p, customer });
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getCustomer(customerId: string, merchantId: string): Customer | undefined {
    const cust = this.customers.get(customerId);
    if (!cust || cust.merchant_id !== merchantId) return undefined;
    return cust;
  }

  public getAllCustomers(merchantId: string): Customer[] {
    const list: Customer[] = [];
    for (const c of this.customers.values()) {
      if (c.merchant_id === merchantId) list.push(c);
    }
    return list;
  }

  public getAuditEvents(merchantId: string, caseId?: string): AuditEvent[] {
    return this.auditEvents
      .filter((a) => a.merchant_id === merchantId && (!caseId || a.case_id === caseId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'> & { timestamp?: string }): AuditEvent {
    const created: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    this.auditEvents.push(created);
    return created;
  }

  public checkAndRegisterIdempotencyKey(key: string): boolean {
    if (this.idempotencyKeys.has(key)) {
      return false; // already executed
    }
    this.idempotencyKeys.add(key);
    return true;
  }

  public saveAIDecision(decision: AIDecision): void {
    this.aiDecisions.set(decision.id, decision);
  }

  public getAIDecision(decisionId: string): AIDecision | undefined {
    return this.aiDecisions.get(decisionId);
  }

  public getAllAIDecisions(merchantId: string): AIDecision[] {
    const list: AIDecision[] = [];
    for (const d of this.aiDecisions.values()) {
      if (d.merchant_id === merchantId) list.push(d);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public savePolicyEvaluation(evaluation: PolicyEvaluation): void {
    this.policyEvaluations.set(evaluation.id, evaluation);
  }

  public saveRecoveryAction(action: RecoveryActionRecord): void {
    this.recoveryActions.set(action.id, action);
  }

  public ingestNewPaymentEvent(params: {
    event_id: string;
    merchant_id: string;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    amount: number;
    failure_reason: FailureReason;
    failure_code?: string;
    failure_description?: string;
    payment_method?: PaymentMethod;
    source: 'simulation' | 'razorpay_polling' | 'razorpay_webhook';
  }): RevenueRiskCase {
    const now = new Date();
    const isoNow = now.toISOString();

    // Ensure customer exists
    let custId = params.customer_id;
    if (!custId || !this.customers.has(custId)) {
      custId = `cust_${Math.random().toString(36).substring(2, 7)}`;
      const newCust: Customer = {
        id: custId,
        merchant_id: params.merchant_id,
        name: params.customer_name || 'Karan Mehra',
        email: params.customer_email || 'karan.m@growthlead.in',
        phone: '+919833445566',
        lifetime_value: 34000,
        payment_success_rate: 0.89,
        recovery_rate: 0.75,
        total_transactions: 9,
        failed_transactions: 1,
        recovered_transactions: 0,
        created_at: isoNow,
      };
      this.customers.set(custId, newCust);
    }

    const payId = `pay_ingest_${Date.now()}`;
    const payment: Payment = {
      id: payId,
      merchant_id: params.merchant_id,
      customer_id: custId,
      amount: params.amount,
      currency: 'INR',
      status: 'failed',
      payment_method: params.payment_method || 'upi',
      failure_reason: params.failure_reason,
      failure_code: params.failure_code || 'GATEWAY_ERROR',
      failure_description: params.failure_description || 'Payment failed during gateway processing',
      retry_count: 0,
      subscription_flag: true,
      mandate_flag: false,
      checkout_abandoned: false,
      occurred_at: isoNow,
      created_at: isoNow,
    };
    this.payments.set(payment.id, payment);

    const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const priority = params.amount > 20000 ? 'CRITICAL' : params.amount > 5000 ? 'HIGH' : 'MEDIUM';

    const riskCase: RevenueRiskCase = {
      id: caseId,
      merchant_id: params.merchant_id,
      payment_id: payment.id,
      status: 'PENDING',
      priority,
      at_risk_amount: params.amount,
      recovered_amount: 0,
      execution_source: 'simulation',
      recovery_attempts: 0,
      tags: [(params.payment_method || 'upi').toUpperCase(), params.failure_reason],
      created_at: isoNow,
      updated_at: isoNow,
    };
    this.cases.set(riskCase.id, riskCase);

    this.addAuditEvent({
      merchant_id: params.merchant_id,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'PAYMENT_FAILED_DETECTED',
      stage: 'DETECT',
      actor: 'SYSTEM_INGEST',
      summary: `Live event ingestion: Payment of ₹${params.amount.toLocaleString('en-IN')} failed (${params.failure_reason}). Source: ${params.source}.`,
      details: {
        event_id: params.event_id,
        amount: params.amount,
        failure_reason: params.failure_reason,
        source: params.source,
      },
    });

    // Stage 2: Immediate Root Cause Diagnosis
    const customer = this.customers.get(custId);
    const diagnosis = DiagnosticEngine.diagnose(payment, customer, params.merchant_id, riskCase.id);
    riskCase.diagnosis = diagnosis;
    this.cases.set(riskCase.id, riskCase);

    this.addAuditEvent({
      merchant_id: params.merchant_id,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'DIAGNOSIS_COMPLETED',
      stage: 'DIAGNOSE',
      actor: 'DIAGNOSTIC_ENGINE',
      summary: `Stage 2 Diagnosis: ${diagnosis.classification} failure categorized under ${diagnosis.category}. ${diagnosis.root_cause_title}. Recoverability score: ${diagnosis.recoverability_score}/100.`,
      details: diagnosis,
    });

    return this.populateCase(riskCase);
  }

  public saveDiagnosis(caseId: string, diagnosis: any): void {
    const riskCase = this.cases.get(caseId);
    if (riskCase) {
      riskCase.diagnosis = diagnosis;
      if (riskCase.status === 'PENDING') {
        riskCase.status = 'DIAGNOSED';
      }
      riskCase.updated_at = new Date().toISOString();
      this.cases.set(caseId, riskCase);
    }
  }

  // --- MAKER-CHECKER (4-EYE PRINCIPLE) GOVERNANCE ---
  public createMakerCheckerRequest(params: {
    merchant_id: string;
    case_id: string;
    action_type: RecoveryActionType | 'WRITE_OFF' | 'MANUAL_REFUND' | 'POLICY_OVERRIDE';
    amount: number;
    currency?: string;
    reason: string;
    justification_notes: string;
    requested_by: {
      user_id: string;
      name: string;
      role: EnterpriseRole;
    };
  }): MakerCheckerRequest {
    const riskCase = this.cases.get(params.case_id);
    const id = `req_mc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const request: MakerCheckerRequest = {
      id,
      merchant_id: params.merchant_id,
      case_id: params.case_id,
      payment_id: riskCase?.payment_id || `pay_${params.case_id}`,
      requested_by: params.requested_by,
      action_type: params.action_type,
      amount: params.amount,
      currency: params.currency || 'INR',
      reason: params.reason,
      justification_notes: params.justification_notes,
      status: 'PENDING_APPROVAL',
      created_at: new Date().toISOString(),
    };

    this.makerCheckerRequests.set(id, request);

    this.addAuditEvent({
      merchant_id: params.merchant_id,
      case_id: params.case_id,
      payment_id: request.payment_id,
      event_type: 'CASE_ESCALATED',
      stage: 'DECIDE',
      actor: 'MERCHANT_ADMIN',
      summary: `Dual-Authorization (Maker-Checker) approval requested for ${params.action_type} (₹${params.amount.toLocaleString('en-IN')}) by ${params.requested_by.name} (${params.requested_by.role}).`,
      details: {
        request_id: id,
        reason: params.reason,
        justification: params.justification_notes,
      },
    });

    return request;
  }

  public getMakerCheckerRequests(merchantId: string): MakerCheckerRequest[] {
    const list: MakerCheckerRequest[] = [];
    for (const req of this.makerCheckerRequests.values()) {
      if (req.merchant_id === merchantId) {
        list.push(req);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public approveMakerCheckerRequest(
    requestId: string,
    reviewedBy: { user_id: string; name: string; role: EnterpriseRole },
    reviewNotes?: string
  ): MakerCheckerRequest {
    const request = this.makerCheckerRequests.get(requestId);
    if (!request) {
      throw new Error(`Maker-Checker request ${requestId} not found`);
    }

    request.status = 'APPROVED';
    request.reviewed_by = reviewedBy;
    request.reviewed_at = new Date().toISOString();
    request.review_notes = reviewNotes || 'Authorized and approved by Risk Officer.';

    // Update the associated risk case
    const riskCase = this.cases.get(request.case_id);
    if (riskCase) {
      if (request.action_type === 'WRITE_OFF') {
        riskCase.status = 'STOPPED';
      } else {
        riskCase.status = 'EXECUTING';
      }
      riskCase.updated_at = new Date().toISOString();
      this.cases.set(riskCase.id, riskCase);
    }

    this.addAuditEvent({
      merchant_id: request.merchant_id,
      case_id: request.case_id,
      payment_id: request.payment_id,
      event_type: 'MANUAL_OVERRIDE',
      stage: 'EXECUTE',
      actor: 'MERCHANT_ADMIN',
      summary: `Maker-Checker Dual Approval GRANTED by ${reviewedBy.name} (${reviewedBy.role}) for ${request.action_type}. Request ID: ${requestId}.`,
      details: {
        request_id: requestId,
        approved_by: reviewedBy,
        review_notes: request.review_notes,
      },
    });

    return request;
  }

  public rejectMakerCheckerRequest(
    requestId: string,
    reviewedBy: { user_id: string; name: string; role: EnterpriseRole },
    reviewNotes?: string
  ): MakerCheckerRequest {
    const request = this.makerCheckerRequests.get(requestId);
    if (!request) {
      throw new Error(`Maker-Checker request ${requestId} not found`);
    }

    request.status = 'REJECTED';
    request.reviewed_by = reviewedBy;
    request.reviewed_at = new Date().toISOString();
    request.review_notes = reviewNotes || 'Declined by Risk Officer.';

    this.addAuditEvent({
      merchant_id: request.merchant_id,
      case_id: request.case_id,
      payment_id: request.payment_id,
      event_type: 'CASE_BLOCKED',
      stage: 'DECIDE',
      actor: 'MERCHANT_ADMIN',
      summary: `Maker-Checker Dual Approval REJECTED by ${reviewedBy.name} (${reviewedBy.role}). Reason: ${request.review_notes}`,
      details: {
        request_id: requestId,
        rejected_by: reviewedBy,
        review_notes: request.review_notes,
      },
    });

    return request;
  }

  // --- GATEWAY HEALTH & SMART ROUTING SWITCH MATRIX ---
  public getGatewayRoutes(): GatewayRouteHealth[] {
    if (this.gatewayRoutes.length === 0) {
      this.gatewayRoutes = [
        {
          id: 'gw_rzp_in',
          name: 'Razorpay Primary Switch',
          provider: 'razorpay',
          status: 'OPERATIONAL',
          success_rate: 0.942,
          p95_latency_ms: 320,
          routing_weight_pct: 60,
          supported_methods: ['upi', 'card', 'netbanking', 'wallet', 'emi'],
          circuit_breaker_active: false,
          primary_currency: 'INR',
        },
        {
          id: 'gw_stripe_global',
          name: 'Stripe International Gateway',
          provider: 'stripe',
          status: 'OPERATIONAL',
          success_rate: 0.968,
          p95_latency_ms: 410,
          routing_weight_pct: 20,
          supported_methods: ['card'],
          circuit_breaker_active: false,
          primary_currency: 'USD',
        },
        {
          id: 'gw_npci_upi',
          name: 'NPCI UPI 2.0 Direct Switch',
          provider: 'npci_upi',
          status: 'OPERATIONAL',
          success_rate: 0.915,
          p95_latency_ms: 240,
          routing_weight_pct: 10,
          supported_methods: ['upi'],
          circuit_breaker_active: false,
          primary_currency: 'INR',
        },
        {
          id: 'gw_cashfree_failover',
          name: 'Cashfree Auto-Failover Switch',
          provider: 'cashfree',
          status: 'OPERATIONAL',
          success_rate: 0.928,
          p95_latency_ms: 380,
          routing_weight_pct: 5,
          supported_methods: ['upi', 'card', 'netbanking'],
          circuit_breaker_active: false,
          primary_currency: 'INR',
        },
        {
          id: 'gw_payu_backup',
          name: 'PayU Enterprise Backup',
          provider: 'payu',
          status: 'OPERATIONAL',
          success_rate: 0.894,
          p95_latency_ms: 460,
          routing_weight_pct: 5,
          supported_methods: ['netbanking', 'card', 'emi'],
          circuit_breaker_active: false,
          primary_currency: 'INR',
        },
      ];
    }
    return this.gatewayRoutes;
  }

  public updateGatewayRoute(routeId: string, updates: Partial<GatewayRouteHealth>): GatewayRouteHealth {
    const routes = this.getGatewayRoutes();
    const index = routes.findIndex((r) => r.id === routeId);
    if (index === -1) {
      throw new Error(`Gateway route ${routeId} not found`);
    }
    this.gatewayRoutes[index] = { ...this.gatewayRoutes[index], ...updates };
    return this.gatewayRoutes[index];
  }
}

export const dbStore = new RecoverIQDataStore();

