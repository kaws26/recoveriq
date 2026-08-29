// RecoverIQ — Razorpay Real-Time Polling & Server-Sent Events (SSE) Engine
// Implements incremental cursor synchronization, normalized failure events, idempotency, and real-time frontend streaming

import { Response } from 'express';
import { dbStore } from '../db/store';
import { razorpayVault } from './razorpay';
import { FailureReason, PaymentMethod, RevenueRiskCase } from '../../types';
import { MLRecoveryScorer } from './ml';
import { AIAgentEngine } from './ai';
import { PolicyEngine } from './policy';
import { RecoveryOrchestrator } from './recovery';

export interface StreamEvent {
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

class EventBroadcaster {
  private clients: Set<{ id: string; res: Response; merchantId: string }> = new Set();

  public registerClient(id: string, res: Response, merchantId: string) {
    this.clients.add({ id, res, merchantId });
  }

  public removeClient(id: string) {
    for (const c of this.clients) {
      if (c.id === id) {
        this.clients.delete(c);
        break;
      }
    }
  }

  public broadcast(merchantId: string, eventName: string, data: Record<string, any>) {
    const payload: StreamEvent = {
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
    };

    const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const client of this.clients) {
      if (client.merchantId === merchantId || client.merchantId === 'all') {
        try {
          client.res.write(message);
        } catch {
          this.clients.delete(client);
        }
      }
    }
  }
}

export const eventStream = new EventBroadcaster();

export class RazorpayPollingService {
  private static isRunning = false;
  private static pollIntervalMs = 5000;
  private static lastSyncedAtMap: Map<string, number> = new Map();
  private static processedPaymentIds: Set<string> = new Set();
  private static timer: NodeJS.Timeout | null = null;

  public static start(intervalSeconds = 5) {
    this.pollIntervalMs = intervalSeconds * 1000;
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[RecoverIQ] Razorpay Polling Service started (interval: ${intervalSeconds}s)`);
    this.poll();
  }

  public static stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[RecoverIQ] Razorpay Polling Service stopped.');
  }

  private static async poll() {
    if (!this.isRunning) return;

    try {
      // Poll active merchant connections
      const merchantId = 'merchant_rzp_live_01';
      const provider = razorpayVault.getProvider(merchantId);

      if (provider) {
        const lastSynced = this.lastSyncedAtMap.get(merchantId) || Math.floor((Date.now() - 300000) / 1000); // last 5 min default
        const payments = await provider.fetchRecentPayments({ from: lastSynced, count: 25 });

        if (payments && payments.length > 0) {
          let latestTimestamp = lastSynced;

          for (const p of payments) {
            if (p.created_at > latestTimestamp) {
              latestTimestamp = p.created_at;
            }

            if (this.processedPaymentIds.has(p.id)) continue;
            this.processedPaymentIds.add(p.id);

            // If payment failed in Razorpay Test Mode
            if (p.status === 'failed') {
              await this.handleFailedPaymentEvent({
                providerPaymentId: p.id,
                merchantId,
                amount: p.amount ? p.amount / 100 : 4999, // paisa to rupees
                currency: p.currency || 'INR',
                method: (p.method as PaymentMethod) || 'upi',
                errorCode: p.error_code || 'GATEWAY_ERROR',
                errorDescription: p.error_description || p.error_reason || 'Payment failed during test checkout',
                customerEmail: p.email,
                customerContact: p.contact,
                notes: p.notes,
                occurredAt: new Date(p.created_at * 1000).toISOString(),
              });
            }
          }

          this.lastSyncedAtMap.set(merchantId, latestTimestamp);
        }
      }
    } catch (err: any) {
      // Suppress transient poll error logs
    } finally {
      if (this.isRunning) {
        this.timer = setTimeout(() => this.poll(), this.pollIntervalMs);
      }
    }
  }

  /**
   * Pipeline executed upon detecting a failed payment:
   * payment.failed -> recovery_case.created -> recovery.analysis_started ->
   * recovery.analysis_completed -> policy.evaluated -> recovery.execution_started -> recovery.outcome_verified
   */
  public static async handleFailedPaymentEvent(params: {
    providerPaymentId: string;
    merchantId: string;
    amount: number;
    currency: string;
    method?: PaymentMethod;
    errorCode?: string;
    errorDescription?: string;
    customerEmail?: string;
    customerContact?: string;
    customerName?: string;
    notes?: Record<string, string>;
    occurredAt?: string;
  }): Promise<RevenueRiskCase> {
    const {
      providerPaymentId,
      merchantId,
      amount,
      currency,
      method = 'upi',
      errorCode = 'GATEWAY_TIMEOUT',
      errorDescription = 'Transaction failed during processing',
      customerEmail = 'customer@example.com',
      customerContact,
      customerName = 'Test Customer',
      occurredAt = new Date().toISOString(),
    } = params;

    // Determine canonical failure reason
    let failureReason: FailureReason = 'temporary_network_failure';
    const errUpper = (errorCode + ' ' + errorDescription).toUpperCase();

    if (errUpper.includes('INSUFFICIENT') || errUpper.includes('BALANCE')) {
      failureReason = 'insufficient_funds';
    } else if (errUpper.includes('EXPIRED') || errUpper.includes('VALIDITY')) {
      failureReason = 'expired_card';
    } else if (errUpper.includes('BANK') || errUpper.includes('DOWNTIME') || errUpper.includes('MAINTENANCE')) {
      failureReason = 'bank_unavailable';
    } else if (errUpper.includes('LIMIT')) {
      failureReason = 'limit_exceeded';
    } else if (errUpper.includes('MANDATE')) {
      failureReason = 'mandate_failed';
    } else if (errUpper.includes('AUTH') || errUpper.includes('OTP') || errUpper.includes('2FA')) {
      failureReason = 'authentication_failed';
    }

    // 1. Ingest Case into DataStore
    const riskCase = dbStore.ingestNewPaymentEvent({
      event_id: `evt_polled_${providerPaymentId}_${Date.now()}`,
      merchant_id: merchantId,
      amount,
      failure_reason: failureReason,
      failure_code: errorCode,
      failure_description: errorDescription,
      payment_method: method,
      customer_name: customerName,
      customer_email: customerEmail,
      source: 'razorpay_polling',
    });

    // Broadcast: payment.failed & recovery_case.created
    eventStream.broadcast(merchantId, 'payment.failed', {
      paymentId: riskCase.payment_id,
      amount,
      currency,
      failureReason,
      caseId: riskCase.id,
    });

    eventStream.broadcast(merchantId, 'recovery_case.created', {
      case: riskCase,
    });

    // 2. Trigger Real-Time AI Analysis & Policy Evaluation Pipeline
    setTimeout(async () => {
      try {
        eventStream.broadcast(merchantId, 'recovery.analysis_started', {
          caseId: riskCase.id,
        });

        const payment = dbStore.getPayment(riskCase.payment_id, merchantId);
        const customer = payment ? dbStore.getCustomer(payment.customer_id, merchantId) : undefined;
        const policy = dbStore.getPolicy(merchantId);

        if (payment) {
          // ML Scoring
          const features = MLRecoveryScorer.extractFeatures(payment, customer);
          const mlScore = MLRecoveryScorer.predictRecoveryProbability(features);
          const candidateStrategies = MLRecoveryScorer.compareCandidateStrategies(features, mlScore);
          riskCase.ml_score = mlScore;
          riskCase.status = 'SCORED';

          // AI Decision (Nemotron or Fallback)
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

          eventStream.broadcast(merchantId, 'recovery.analysis_completed', {
            caseId: riskCase.id,
            aiDecision,
            mlScore,
          });

          // Policy Evaluation
          const policyEval = PolicyEngine.evaluate(policy, riskCase, payment, aiDecision.action);
          riskCase.policy_evaluation = policyEval;
          dbStore.savePolicyEvaluation(policyEval);

          eventStream.broadcast(merchantId, 'policy.evaluated', {
            caseId: riskCase.id,
            policyEvaluation: policyEval,
          });

          // If auto-recovery is enabled & policy passed with RETRY action, automatically schedule/execute
          if (
            policy.auto_recovery_enabled &&
            policyEval.verdict === 'PASSED' &&
            ['RETRY_NOW', 'RETRY_AFTER_DELAY'].includes(policyEval.allowed_action) &&
            amount <= policy.max_auto_recovery_amount &&
            amount < policy.high_value_review_threshold
          ) {
            eventStream.broadcast(merchantId, 'recovery.execution_started', {
              caseId: riskCase.id,
              action: policyEval.allowed_action,
            });

            const executionResult = await RecoveryOrchestrator.executeAction({
              riskCase,
              payment,
              actionType: policyEval.allowed_action,
              delayMinutes: aiDecision.delay_minutes || 0,
              preferredSource: policy.preferred_execution_provider || 'simulation',
            });

            eventStream.broadcast(merchantId, 'recovery.outcome_verified', {
              caseId: riskCase.id,
              status: executionResult.updatedCase.status,
              recoveredAmount: executionResult.updatedCase.recovered_amount,
            });
          } else if (policyEval.verdict === 'ESCALATED_HUMAN_REVIEW' || amount >= policy.high_value_review_threshold) {
            riskCase.status = 'ESCALATED';
            dbStore.saveCase(riskCase);
            eventStream.broadcast(merchantId, 'case.escalated', {
              caseId: riskCase.id,
              reason: policyEval.reasons.join(', '),
            });
          }

          dbStore.saveCase(riskCase);
          eventStream.broadcast(merchantId, 'dashboard.updated', {
            summary: dbStore.getCases(merchantId),
          });
        }
      } catch (err: any) {
        console.error('Error in recovery pipeline:', err);
      }
    }, 400);

    return riskCase;
  }
}
