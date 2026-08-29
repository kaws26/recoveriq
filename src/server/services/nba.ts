// RecoverIQ — Next Best Action (NBA) & Expected Value Ranking Engine
import {
  NextBestActionOption,
  Payment,
  Customer,
  MLScoreResult,
  PolicyConfig,
  RevenueRiskCase,
  RecoveryActionType,
} from '../../types';
import { CustomerFatigueEngine } from './fatigue';

export class NextBestActionEngine {
  /**
   * Computes, ranks and validates Next Best Actions for any payment failure.
   * Expected Value formula: EV = P(recovery | action) * Amount - Channel Cost
   */
  public static rankActions(params: {
    payment: Payment;
    customer?: Customer;
    mlScore: MLScoreResult;
    policy: PolicyConfig;
    riskCase: RevenueRiskCase;
  }): NextBestActionOption[] {
    const { payment, customer, mlScore, policy, riskCase } = params;
    const amount = payment.amount;
    const baseP = mlScore.probability;
    const retryCount = payment.retry_count || 0;
    const fatigue = customer ? CustomerFatigueEngine.getFatigueProfile(customer.id, payment.merchant_id) : undefined;

    const options: NextBestActionOption[] = [];

    // Option 1: Smart Cooldown Retry (RETRY_AFTER_DELAY)
    const cooldownDelay = payment.failure_reason === 'bank_unavailable' ? 45 : payment.failure_reason === 'temporary_network_failure' ? 20 : 30;
    let pDelay = Math.min(0.96, baseP * 1.12);
    if (retryCount >= policy.max_retries) pDelay = 0.05;
    const costDelay = 1.5; // API gateway call cost in ₹
    const evDelay = Math.round(pDelay * amount - costDelay);
    const delayPermitted = retryCount < policy.max_retries && payment.status !== 'captured' && policy.auto_recovery_enabled;

    options.push({
      action: 'RETRY_AFTER_DELAY',
      rank: 1,
      label: `Smart Cooldown Retry (${cooldownDelay}m)`,
      description: `Wait ${cooldownDelay} minutes for bank switch recovery before retrying payment token.`,
      expected_value: Math.max(0, evDelay),
      probability: Number(pDelay.toFixed(2)),
      estimated_cost: costDelay,
      channel: 'api',
      delay_minutes: cooldownDelay,
      rationale: `Optimal for transient network/issuer timeouts. Avoids immediate failure penalties while bank clears queued traffic.`,
      is_recommended: false,
      policy_permitted: delayPermitted,
      policy_notes: !delayPermitted ? `Max retry threshold (${policy.max_retries}) reached or auto-recovery disabled.` : undefined,
    });

    // Option 2: Immediate Retry (RETRY_NOW)
    let pNow = retryCount === 0 && payment.failure_reason === 'temporary_network_failure' ? baseP * 0.92 : baseP * 0.45;
    if (retryCount >= policy.max_retries) pNow = 0.02;
    const costNow = 1.5;
    const evNow = Math.round(pNow * amount - costNow);
    const nowPermitted = retryCount < policy.max_retries && payment.status !== 'captured' && policy.auto_recovery_enabled;

    options.push({
      action: 'RETRY_NOW',
      rank: 2,
      label: 'Immediate Server Retry',
      description: 'Execute instant tokenized charge attempt without delay.',
      expected_value: Math.max(0, evNow),
      probability: Number(pNow.toFixed(2)),
      estimated_cost: costNow,
      channel: 'api',
      delay_minutes: 0,
      rationale: `Fastest resolution for micro-glitches, but higher decline risk if issuer switch is degraded.`,
      is_recommended: false,
      policy_permitted: nowPermitted,
      policy_notes: !nowPermitted ? `Retry ceiling reached or prohibited by gateway policy.` : undefined,
    });

    // Option 3: WhatsApp / SMS Smart Recovery Link (SEND_REMINDER)
    let pReminder = payment.failure_reason === 'insufficient_funds' || payment.failure_reason === 'authentication_failed' ? 0.78 : baseP * 0.82;
    if (fatigue && fatigue.fatigue_status === 'FATIGUED') pReminder *= 0.35;
    const costReminder = 0.85; // WhatsApp template message cost
    const evReminder = Math.round(pReminder * amount - costReminder);
    const reminderPermitted = (!fatigue || fatigue.can_send_reminder) && policy.auto_recovery_enabled;

    options.push({
      action: 'SEND_REMINDER',
      rank: 3,
      label: 'WhatsApp Recovery Prompt',
      description: 'Send personalized 1-click Razorpay payment link via WhatsApp with friction-free UPI intent.',
      expected_value: Math.max(0, evReminder),
      probability: Number(pReminder.toFixed(2)),
      estimated_cost: costReminder,
      channel: 'whatsapp',
      delay_minutes: 15,
      rationale: `Direct customer engagement allows buyer to switch to alternate UPI app or top up account balance.`,
      is_recommended: false,
      policy_permitted: reminderPermitted,
      policy_notes: !reminderPermitted ? (fatigue?.quiet_hours_active ? 'Blocked during merchant quiet hours.' : 'Customer fatigue budget exhausted.') : undefined,
    });

    // Option 4: Universal Payment Link (CREATE_PAYMENT_LINK)
    let pLink = payment.failure_reason === 'expired_card' || payment.failure_reason === 'limit_exceeded' ? 0.72 : baseP * 0.75;
    const costLink = 0.5;
    const evLink = Math.round(pLink * amount - costLink);
    const linkPermitted = true;

    options.push({
      action: 'CREATE_PAYMENT_LINK',
      rank: 4,
      label: 'Hosted Recovery Checkout Link',
      description: 'Generate multi-method checkout session allowing card/netbanking/wallet replacement.',
      expected_value: Math.max(0, evLink),
      probability: Number(pLink.toFixed(2)),
      estimated_cost: costLink,
      channel: 'email',
      delay_minutes: 0,
      rationale: `Essential when original card or instrument is expired, revoked, or over limit.`,
      is_recommended: false,
      policy_permitted: linkPermitted,
    });

    // Option 5: VIP Merchant Specialist Escalation (ESCALATE)
    const isHighValue = amount >= policy.high_value_review_threshold || amount > policy.max_auto_recovery_amount;
    let pEscalate = isHighValue ? 0.88 : 0.65;
    const costEscalate = 45.0; // Manual agent time cost
    const evEscalate = Math.round(pEscalate * amount - costEscalate);

    options.push({
      action: 'ESCALATE',
      rank: 5,
      label: 'Specialist VIP Review',
      description: 'Route to merchant revenue operations team for white-glove manual assistance.',
      expected_value: Math.max(0, evEscalate),
      probability: Number(pEscalate.toFixed(2)),
      estimated_cost: costEscalate,
      channel: 'manual',
      delay_minutes: 0,
      rationale: `Recommended for high-ticket transactions (≥ ₹${policy.high_value_review_threshold.toLocaleString('en-IN')}) to preserve key account relationship.`,
      is_recommended: false,
      policy_permitted: true,
    });

    // Option 6: Stop Recovery (STOP)
    options.push({
      action: 'STOP',
      rank: 6,
      label: 'Halt & Mark Terminal',
      description: 'Cease further automated recovery interventions to prevent fraud or chargebacks.',
      expected_value: 0,
      probability: 0.0,
      estimated_cost: 0.0,
      channel: 'manual',
      delay_minutes: 0,
      rationale: `Applied when hard decline occurs (e.g. stolen card) or maximum policy retry window is expired.`,
      is_recommended: false,
      policy_permitted: true,
    });

    // Sort by permitted first, then Expected Value descending
    options.sort((a, b) => {
      if (a.policy_permitted !== b.policy_permitted) {
        return a.policy_permitted ? -1 : 1;
      }
      return b.expected_value - a.expected_value;
    });

    // Mark rank and recommendation
    options.forEach((opt, idx) => {
      opt.rank = idx + 1;
      opt.is_recommended = idx === 0 && opt.policy_permitted;
    });

    return options;
  }
}
