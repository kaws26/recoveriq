// RecoverIQ — Deterministic Policy Guardrail Engine
// Enforces hard financial limits, retry bounds, quiet hours, and human-in-the-loop triggers

import {
  PolicyConfig,
  PolicyEvaluation,
  PolicyRuleEvaluation,
  Payment,
  RevenueRiskCase,
  RecoveryActionType,
} from '../../types';

export class PolicyEngine {
  /**
   * Deterministically evaluates the proposed recovery action against merchant policy rules.
   * Returns a binding verdict: PASSED, BLOCKED, or ESCALATED_HUMAN_REVIEW.
   */
  public static evaluate(
    policy: PolicyConfig,
    riskCase: RevenueRiskCase,
    payment: Payment,
    proposedAction: RecoveryActionType,
  ): PolicyEvaluation {
    const rulesChecked: PolicyRuleEvaluation[] = [];
    const reasons: string[] = [];

    // Rule 1: Payment Already Successful / Captured Guard
    const isAlreadySuccessful = payment.status === 'captured';
    rulesChecked.push({
      rule_id: 'POL-001',
      name: 'Double-Charge Protection',
      description: 'Ensure payment is not already in captured or settled status.',
      passed: !isAlreadySuccessful,
      severity: 'BLOCK',
      reason: isAlreadySuccessful ? 'Payment is already marked as captured. Attempting retry would double-charge customer.' : undefined,
    });
    if (isAlreadySuccessful) {
      reasons.push('Double-charge protection active: Payment has already succeeded.');
    }

    // Rule 2: Maximum Retry Limit Guard
    const retryCount = payment.retry_count || 0;
    const isUnderMaxRetries = retryCount < policy.max_retries;
    rulesChecked.push({
      rule_id: 'POL-002',
      name: 'Max Retries Enforcement',
      description: `Prevent retry attempts when count (${retryCount}) exceeds merchant limit (${policy.max_retries}).`,
      passed: isUnderMaxRetries || (proposedAction !== 'RETRY_NOW' && proposedAction !== 'RETRY_AFTER_DELAY'),
      severity: 'BLOCK',
      reason: !isUnderMaxRetries ? `Retry attempt count (${retryCount}) has reached ceiling (${policy.max_retries}).` : undefined,
    });
    if (!isUnderMaxRetries && (proposedAction === 'RETRY_NOW' || proposedAction === 'RETRY_AFTER_DELAY')) {
      reasons.push(`Retry ceiling reached: Max retries (${policy.max_retries}) already attempted.`);
    }

    // Rule 3: Recovery Window Expiration Guard
    const occurredTime = new Date(payment.occurred_at).getTime();
    const hoursSinceFailure = (Date.now() - occurredTime) / 3600000;
    const isWithinWindow = hoursSinceFailure <= policy.max_recovery_window_hours;
    rulesChecked.push({
      rule_id: 'POL-003',
      name: 'Recovery Window Validation',
      description: `Ensure transaction occurred within allowable recovery window (${policy.max_recovery_window_hours} hours).`,
      passed: isWithinWindow,
      severity: 'BLOCK',
      reason: !isWithinWindow ? `Transaction age (${hoursSinceFailure.toFixed(1)}h) exceeds allowable recovery window (${policy.max_recovery_window_hours}h).` : undefined,
    });
    if (!isWithinWindow) {
      reasons.push(`Recovery window expired (${hoursSinceFailure.toFixed(1)}h > ${policy.max_recovery_window_hours}h).`);
    }

    // Rule 4: Auto-Recovery Amount Ceiling Guard
    const exceedsAutoCap = payment.amount > policy.max_auto_recovery_amount;
    rulesChecked.push({
      rule_id: 'POL-004',
      name: 'Auto-Recovery Ceiling Guard',
      description: `Amounts exceeding ₹${policy.max_auto_recovery_amount.toLocaleString('en-IN')} must be escalated for human review.`,
      passed: !exceedsAutoCap,
      severity: 'ESCALATE',
      reason: exceedsAutoCap ? `Transaction amount (₹${payment.amount.toLocaleString('en-IN')}) exceeds auto-recovery cap (₹${policy.max_auto_recovery_amount.toLocaleString('en-IN')}).` : undefined,
    });
    if (exceedsAutoCap) {
      reasons.push(`High-ticket transaction (₹${payment.amount.toLocaleString('en-IN')}) exceeds auto-recovery ceiling.`);
    }

    // Rule 5: High-Value Review Threshold
    const requiresHighValueReview = payment.amount >= policy.high_value_review_threshold && payment.amount <= policy.max_auto_recovery_amount;
    rulesChecked.push({
      rule_id: 'POL-005',
      name: 'High-Value Review Flag',
      description: `Amounts ≥ ₹${policy.high_value_review_threshold.toLocaleString('en-IN')} flagged for operational visibility.`,
      passed: !requiresHighValueReview || proposedAction === 'ESCALATE',
      severity: 'WARN',
      reason: requiresHighValueReview ? `Transaction amount ≥ ₹${policy.high_value_review_threshold.toLocaleString('en-IN')} threshold.` : undefined,
    });

    // Rule 6: Merchant Automation Enabled Check
    rulesChecked.push({
      rule_id: 'POL-006',
      name: 'Merchant Automation State',
      description: 'Verifies that merchant account has automated recovery turned ON.',
      passed: policy.auto_recovery_enabled,
      severity: 'BLOCK',
      reason: !policy.auto_recovery_enabled ? 'Merchant automated recovery is paused in settings.' : undefined,
    });
    if (!policy.auto_recovery_enabled) {
      reasons.push('Automated recovery is globally disabled by merchant admin.');
    }

    // Rule 7: Quiet Hours Notification Check (if reminder action is requested)
    const currentHour = new Date().getHours();
    const isQuietHours =
      policy.quiet_hours_start > policy.quiet_hours_end
        ? currentHour >= policy.quiet_hours_start || currentHour < policy.quiet_hours_end
        : currentHour >= policy.quiet_hours_start && currentHour < policy.quiet_hours_end;

    if (proposedAction === 'SEND_REMINDER' && isQuietHours) {
      rulesChecked.push({
        rule_id: 'POL-007',
        name: 'Quiet Hours Compliance',
        description: `No outbound SMS/WhatsApp messages between ${policy.quiet_hours_start}:00 and 0${policy.quiet_hours_end}:00 IST.`,
        passed: false,
        severity: 'WARN',
        reason: 'Current time falls within merchant quiet hours. Communication will be queued for 08:00 AM IST.',
      });
      reasons.push('Quiet hours active: Outbound communication queued for 08:00 AM IST.');
    }

    // --- DETERMINE VERDICT ---
    const hasBlock = rulesChecked.some((r) => !r.passed && r.severity === 'BLOCK');
    const hasEscalate = rulesChecked.some((r) => !r.passed && r.severity === 'ESCALATE');

    let verdict: PolicyEvaluation['verdict'] = 'PASSED';
    let allowedAction: RecoveryActionType = proposedAction;

    if (hasBlock) {
      verdict = 'BLOCKED';
      allowedAction = 'STOP';
    } else if (hasEscalate) {
      verdict = 'ESCALATED_HUMAN_REVIEW';
      allowedAction = 'ESCALATE';
    }

    return {
      id: `poleval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      case_id: riskCase.id,
      verdict,
      evaluated_action: proposedAction,
      allowed_action: allowedAction,
      rules_checked: rulesChecked,
      reasons: reasons.length > 0 ? reasons : ['All deterministic policy guardrails passed successfully.'],
      evaluated_at: new Date().toISOString(),
    };
  }
}
