// RecoverIQ — Demo Execution & Scenario Engine
import { RevenueRiskCase } from '../../types';
import { dbStore } from '../db/store';
import { MLRecoveryScorer } from './ml';
import { AIAgentEngine } from './ai';
import { PolicyEngine } from './policy';
import { RecoveryOrchestrator } from './recovery';

export class DemoService {
  /**
   * Executes the full canonical Hackathon showcase recovery lifecycle deterministically:
   * DETECT → DIAGNOSE → SCORE → DECIDE → POLICY CHECK → EXECUTE → VERIFY → MEASURE → AUDIT
   */
  public static async runScenario(scenarioType: 'golden_path' | 'high_value' | 'max_retry' | 'reminder' = 'golden_path'): Promise<{
    success: boolean;
    case_id: string;
    stage_results: Record<string, any>;
    riskCase: RevenueRiskCase;
  }> {
    const merchantId = 'merchant_rzp_live_01';
    const policy = dbStore.getPolicy(merchantId);

    let targetCaseId = 'case_demo_gold_01';
    if (scenarioType === 'high_value') targetCaseId = 'case_demo_highval_02';
    else if (scenarioType === 'max_retry') targetCaseId = 'case_demo_blocked_03';
    else if (scenarioType === 'reminder') targetCaseId = 'case_demo_remind_05';

    let riskCase = dbStore.getCaseById(targetCaseId, merchantId);

    // If case doesn't exist or is already completed in golden path, reset or create a fresh one
    if (!riskCase || (scenarioType === 'golden_path' && riskCase.status === 'SUCCEEDED')) {
      riskCase = dbStore.ingestNewPaymentEvent({
        event_id: `evt_demo_${Date.now()}`,
        merchant_id: merchantId,
        customer_name: 'Rohan Sharma (VIP Member)',
        customer_email: 'rohan.sharma@example.com',
        amount: 4999,
        failure_reason: 'temporary_network_failure',
        failure_code: 'GATEWAY_TIMEOUT',
        failure_description: 'NPCI UPI Gateway response timeout during collect request',
        payment_method: 'upi',
        source: 'simulation',
      });
      targetCaseId = riskCase.id;
    }

    const payment = dbStore.getPayment(riskCase.payment_id, merchantId)!;
    const customer = dbStore.getCustomer(payment.customer_id, merchantId);

    const stageResults: Record<string, any> = {};

    // 1. Stage: SCORE (ML Model)
    const features = MLRecoveryScorer.extractFeatures(payment, customer);
    const mlScore = MLRecoveryScorer.predictRecoveryProbability(features);
    const candidateStrategies = MLRecoveryScorer.compareCandidateStrategies(features, mlScore);

    riskCase.ml_score = mlScore;
    riskCase.status = 'SCORED';
    dbStore.saveCase(riskCase);

    dbStore.addAuditEvent({
      merchant_id: merchantId,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'ML_PROBABILITY_SCORED',
      stage: 'SCORE',
      actor: 'ML_ENGINE',
      summary: `XGBoost ML scored recovery probability at ${(mlScore.probability * 100).toFixed(0)}% (Risk Band: ${mlScore.risk_band}).`,
      details: { mlScore, features },
    });
    stageResults.score = mlScore;

    // 2. Stage: DECIDE (AI Agent — Nemotron or Deterministic Fallback)
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
    dbStore.saveCase(riskCase);

    dbStore.addAuditEvent({
      merchant_id: merchantId,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'AI_DECISION_GENERATED',
      stage: 'DECIDE',
      actor: 'AI_AGENT',
      summary: `AI Agent (${aiDecision.ai_provider}) recommends ${aiDecision.action} with ${(aiDecision.confidence * 100).toFixed(0)}% confidence.`,
      details: aiDecision,
    });
    stageResults.decision = aiDecision;

    // 3. Stage: POLICY CHECK (Deterministic Guardrails)
    const policyEval = PolicyEngine.evaluate(policy, riskCase, payment, aiDecision.action);
    riskCase.policy_evaluation = policyEval;
    dbStore.savePolicyEvaluation(policyEval);
    dbStore.saveCase(riskCase);

    dbStore.addAuditEvent({
      merchant_id: merchantId,
      case_id: riskCase.id,
      payment_id: payment.id,
      event_type: 'POLICY_GUARDRAIL_EVALUATED',
      stage: 'POLICY',
      actor: 'POLICY_ENGINE',
      summary: `Deterministic Policy verdict: ${policyEval.verdict}. Allowed Action: ${policyEval.allowed_action}.`,
      details: policyEval,
    });
    stageResults.policy = policyEval;

    // 4. Stage: EXECUTE & VERIFY (if policy allows)
    if (policyEval.verdict === 'PASSED') {
      const { actionRecord, updatedCase } = await RecoveryOrchestrator.executeAction({
        riskCase,
        payment,
        actionType: policyEval.allowed_action,
        delayMinutes: aiDecision.delay_minutes,
        preferredSource: policy.preferred_execution_provider || 'simulation',
      });
      stageResults.execution = actionRecord;
      stageResults.outcome = 'VERIFIED_SUCCESS';
      return {
        success: true,
        case_id: riskCase.id,
        stage_results: stageResults,
        riskCase: updatedCase,
      };
    } else if (policyEval.verdict === 'ESCALATED_HUMAN_REVIEW') {
      riskCase.status = 'ESCALATED';
      dbStore.saveCase(riskCase);
      stageResults.outcome = 'ESCALATED_FOR_REVIEW';
      return {
        success: true,
        case_id: riskCase.id,
        stage_results: stageResults,
        riskCase: dbStore.populateCase(riskCase),
      };
    } else {
      riskCase.status = 'BLOCKED';
      dbStore.saveCase(riskCase);
      stageResults.outcome = 'POLICY_BLOCKED';
      return {
        success: true,
        case_id: riskCase.id,
        stage_results: stageResults,
        riskCase: dbStore.populateCase(riskCase),
      };
    }
  }
}
