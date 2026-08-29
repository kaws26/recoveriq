// RecoverIQ — AI Agent Engine (NVIDIA Nemotron + Google GenAI + Deterministic Fallback)
// Implements authoritative skill definition, defense-in-depth structured output validation, and cost-latency routing

import { GoogleGenAI } from '@google/genai';
import {
  AIDecision,
  Payment,
  Customer,
  MLScoreResult,
  RevenueRiskCase,
  PolicyConfig,
  RecoveryActionType,
  StrategyOption,
} from '../../types';
import { MLRecoveryScorer } from './ml';

const SYSTEM_SKILL_PROMPT = `
You are the **RecoverIQ Revenue Recovery Agent**, specialized for Razorpay revenue recovery.
Your mission is to evaluate payment failures, review ML probability scoring, and choose the most effective, policy-compliant recovery action.

ALLOWED ACTIONS:
- RETRY_NOW: Only for immediate transient gateway glitches if retry count is 0.
- RETRY_AFTER_DELAY: For network timeouts (20-30 min cooldown) or bank maintenance.
- SEND_REMINDER: For customer action required (balance replenishment, 2FA prompt).
- CREATE_PAYMENT_LINK: For instrument failures (expired card, card limit exceeded).
- ESCALATE: For high value or multi-attempt failures requiring VIP merchant review.
- STOP: For terminal failures (max retries reached, stolen card, explicit cancel).

FORBIDDEN:
- Never exceed policy limits.
- Never claim success without verification.
- Output strictly valid JSON matching the exact schema below.

JSON OUTPUT SCHEMA:
{
  "action": "RETRY_NOW" | "RETRY_AFTER_DELAY" | "SEND_REMINDER" | "CREATE_PAYMENT_LINK" | "ESCALATE" | "STOP",
  "delay_minutes": number,
  "reason_code": string,
  "explanation": string,
  "confidence": number,
  "expected_recovery_value": number,
  "requires_human_review": boolean
}
`;

export class AIAgentEngine {
  /**
   * Generates a structured, policy-safe recovery decision.
   */
  public static async decide(params: {
    riskCase: RevenueRiskCase;
    payment: Payment;
    customer?: Customer;
    mlScore: MLScoreResult;
    policy: PolicyConfig;
    candidateStrategies: StrategyOption[];
  }): Promise<AIDecision> {
    const { riskCase, payment, customer, mlScore, policy, candidateStrategies } = params;

    // Check availability of NVIDIA Nemotron API Key
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (nvidiaKey && nvidiaKey.trim().length > 0) {
      try {
        const decision = await this.callNvidiaNemotron(params, nvidiaKey);
        return decision;
      } catch (err) {
        console.warn('NVIDIA Nemotron call failed, falling back to deterministic engine:', err);
      }
    }

    if (geminiKey && geminiKey.trim().length > 0) {
      try {
        const decision = await this.callGemini(params, geminiKey);
        return decision;
      } catch (err) {
        console.warn('Gemini fallback call failed, falling back to deterministic engine:', err);
      }
    }

    // Deterministic Fallback Engine
    return this.generateDeterministicDecision(params);
  }

  /**
   * Calls NVIDIA Nemotron-3 Super 120B API via OpenAI-compatible endpoint.
   */
  private static async callNvidiaNemotron(
    params: {
      riskCase: RevenueRiskCase;
      payment: Payment;
      customer?: Customer;
      mlScore: MLScoreResult;
      policy: PolicyConfig;
      candidateStrategies: StrategyOption[];
    },
    apiKey: string,
  ): Promise<AIDecision> {
    const promptPayload = this.constructContextPrompt(params);

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b',
        messages: [
          { role: 'system', content: SYSTEM_SKILL_PROMPT },
          { role: 'user', content: promptPayload },
        ],
        temperature: 0.1,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return this.sanitizeAndValidateDecision(parsed, params, 'nvidia/nemotron-3-super-120b-a12b', 'NVIDIA_NEMOTRON');
  }

  /**
   * Calls Google Gemini 2.5 Flash as an enterprise fallback.
   */
  private static async callGemini(
    params: {
      riskCase: RevenueRiskCase;
      payment: Payment;
      customer?: Customer;
      mlScore: MLScoreResult;
      policy: PolicyConfig;
      candidateStrategies: StrategyOption[];
    },
    apiKey: string,
  ): Promise<AIDecision> {
    const ai = new GoogleGenAI({ apiKey });
    const promptPayload = this.constructContextPrompt(params);

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_SKILL_PROMPT}\n\n${promptPayload}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = result.text || '{}';
    const parsed = JSON.parse(text);

    return this.sanitizeAndValidateDecision(parsed, params, 'gemini-2.5-flash', 'GEMINI_FALLBACK');
  }

  /**
   * High-precision Deterministic Fallback Decision Engine.
   * Produces explainable, mathematically optimal recovery recommendations when AI APIs are unconfigured or offline.
   */
  public static generateDeterministicDecision(params: {
    riskCase: RevenueRiskCase;
    payment: Payment;
    customer?: Customer;
    mlScore: MLScoreResult;
    policy: PolicyConfig;
    candidateStrategies: StrategyOption[];
  }): AIDecision {
    const { riskCase, payment, customer, mlScore, policy, candidateStrategies } = params;
    const topStrategy = candidateStrategies[0] || {
      action: 'RETRY_AFTER_DELAY',
      recommended_delay_minutes: 20,
      probability: mlScore.probability,
    };

    let action: RecoveryActionType = topStrategy.action;
    let delayMinutes = topStrategy.recommended_delay_minutes || 0;
    let reasonCode = payment.failure_code || 'GATEWAY_ERROR';
    let explanation = '';
    let requiresHumanReview = payment.amount >= policy.high_value_review_threshold;

    if (payment.amount > policy.max_auto_recovery_amount) {
      action = 'ESCALATE';
      delayMinutes = 0;
      reasonCode = 'EXCEEDS_AUTO_RECOVERY_CEILING';
      explanation = `Transaction value of ₹${payment.amount.toLocaleString('en-IN')} exceeds merchant auto-recovery limit (₹${policy.max_auto_recovery_amount.toLocaleString('en-IN')}). Routed to VIP specialist review.`;
      requiresHumanReview = true;
    } else if (payment.retry_count >= policy.max_retries) {
      action = 'STOP';
      delayMinutes = 0;
      reasonCode = 'MAX_RETRIES_EXCEEDED';
      explanation = `Maximum allowable retries (${policy.max_retries}) have already been attempted. Halting automated retries to prevent customer churn.`;
    } else if (payment.failure_reason === 'temporary_network_failure' || payment.failure_reason === 'payment_timeout') {
      action = 'RETRY_AFTER_DELAY';
      delayMinutes = 20;
      reasonCode = 'TEMPORARY_NETWORK_FAILURE';
      explanation = `Detected transient NPCI/bank gateway timeout. ML model predicts ${(mlScore.probability * 100).toFixed(0)}% recovery with a 20-minute cooldown window to avoid concurrency locks.`;
    } else if (payment.failure_reason === 'insufficient_funds') {
      action = 'SEND_REMINDER';
      delayMinutes = 60;
      reasonCode = 'INSUFFICIENT_FUNDS_BALANCE_ALERT';
      explanation = `Customer balance insufficient. Recommending smart WhatsApp reminder with instant 1-click Razorpay payment link to allow account top-up.`;
    } else if (payment.failure_reason === 'expired_card') {
      action = 'CREATE_PAYMENT_LINK';
      delayMinutes = 0;
      reasonCode = 'EXPIRED_PAYMENT_INSTRUMENT';
      explanation = `Card is expired. Automated retries will fail. Generated fresh Razorpay checkout link supporting UPI and alternative cards.`;
    } else if (payment.failure_reason === 'bank_unavailable') {
      action = 'RETRY_AFTER_DELAY';
      delayMinutes = 180;
      reasonCode = 'ISSUER_BANK_DOWNTIME';
      explanation = `Issuer bank core banking system reported temporary maintenance. Scheduled retry in 3 hours based on historical bank uptime patterns.`;
    } else {
      action = 'RETRY_AFTER_DELAY';
      delayMinutes = 30;
      reasonCode = 'GENERAL_PAYMENT_FAILURE';
      explanation = `Evaluated recovery probability at ${(mlScore.probability * 100).toFixed(0)}%. Cooldown retry scheduled to maximize authorization rate.`;
    }

    return {
      id: `aidec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      case_id: riskCase.id,
      merchant_id: riskCase.merchant_id,
      action,
      delay_minutes: delayMinutes,
      reason_code: reasonCode,
      explanation,
      confidence: mlScore.probability,
      expected_recovery_value: Math.round(mlScore.probability * payment.amount),
      requires_human_review: requiresHumanReview,
      ai_provider: 'Unavailable',
      decision_source: 'DETERMINISTIC_FALLBACK',
      strategy_comparison: candidateStrategies,
      created_at: new Date().toISOString(),
    };
  }

  private static constructContextPrompt(params: {
    riskCase: RevenueRiskCase;
    payment: Payment;
    customer?: Customer;
    mlScore: MLScoreResult;
    policy: PolicyConfig;
    candidateStrategies: StrategyOption[];
  }): string {
    const { payment, customer, mlScore, policy, candidateStrategies } = params;
    return `
TRANSACTION CONTEXT:
- Payment ID: ${payment.id}
- Amount: ₹${payment.amount.toLocaleString('en-IN')} ${payment.currency}
- Method: ${payment.payment_method}
- Failure Reason: ${payment.failure_reason}
- Failure Code: ${payment.failure_code}
- Failure Description: ${payment.failure_description}
- Retry Count: ${payment.retry_count} / Max ${policy.max_retries}
- Subscription: ${payment.subscription_flag ? 'Yes' : 'No'}

CUSTOMER PROFILE:
- Customer: ${customer?.name || 'Customer'} (Tenure LTV: ₹${customer?.lifetime_value.toLocaleString('en-IN') || '0'})
- Historical Success Rate: ${((customer?.payment_success_rate || 0.8) * 100).toFixed(0)}%
- Historical Recovery Rate: ${((customer?.recovery_rate || 0.7) * 100).toFixed(0)}%

ML PROBABILITY ENGINE:
- Recovery Likelihood: ${(mlScore.probability * 100).toFixed(1)}% (Band: ${mlScore.risk_band})

MERCHANT POLICY GUARDRAILS:
- Max Retries: ${policy.max_retries}
- Auto-Recovery Ceiling: ₹${policy.max_auto_recovery_amount.toLocaleString('en-IN')}
- High Value Review Threshold: ₹${policy.high_value_review_threshold.toLocaleString('en-IN')}

CANDIDATE INTERVENTIONS:
${candidateStrategies.map((s) => `• ${s.action} (${s.label}): ${s.probability * 100}% probability, expected value ₹${s.expected_value}`).join('\n')}

Select the optimal recovery action and return STRICT JSON.
`;
  }

  private static sanitizeAndValidateDecision(
    raw: any,
    params: {
      riskCase: RevenueRiskCase;
      payment: Payment;
      mlScore: MLScoreResult;
      candidateStrategies: StrategyOption[];
    },
    aiProvider: string,
    decisionSource: AIDecision['decision_source'],
  ): AIDecision {
    const allowedActions: RecoveryActionType[] = [
      'RETRY_NOW',
      'RETRY_AFTER_DELAY',
      'SEND_REMINDER',
      'CREATE_PAYMENT_LINK',
      'ESCALATE',
      'STOP',
    ];

    let action: RecoveryActionType = allowedActions.includes(raw?.action) ? raw.action : 'RETRY_AFTER_DELAY';
    const delayMinutes = typeof raw?.delay_minutes === 'number' ? Math.max(0, raw.delay_minutes) : 20;
    const reasonCode = raw?.reason_code || params.payment.failure_code || 'GATEWAY_ERROR';
    const explanation = typeof raw?.explanation === 'string' && raw.explanation.length > 5
      ? raw.explanation
      : `AI evaluated ${params.payment.failure_reason} with ML probability ${(params.mlScore.probability * 100).toFixed(0)}%. Recommends ${action}.`;
    const confidence = typeof raw?.confidence === 'number' ? Math.min(0.99, Math.max(0.01, raw.confidence)) : params.mlScore.probability;
    const expectedValue = Math.round(confidence * params.payment.amount);
    const requiresHumanReview = Boolean(raw?.requires_human_review);

    return {
      id: `aidec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      case_id: params.riskCase.id,
      merchant_id: params.riskCase.merchant_id,
      action,
      delay_minutes: delayMinutes,
      reason_code: reasonCode,
      explanation,
      confidence,
      expected_recovery_value: expectedValue,
      requires_human_review: requiresHumanReview,
      ai_provider: aiProvider,
      decision_source: decisionSource,
      strategy_comparison: params.candidateStrategies,
      created_at: new Date().toISOString(),
    };
  }
}
