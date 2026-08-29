// RecoverIQ — Policy Simulator & What-If Engine
import {
  PolicyConfig,
  PolicySimulationInput,
  PolicySimulationResult,
} from '../../types';
import { dbStore } from '../db/store';

export class PolicySimulatorService {
  /**
   * Simulates policy modifications against historical transaction cases without altering production state.
   */
  public static simulate(merchantId: string, input: PolicySimulationInput): PolicySimulationResult {
    const currentPolicy = dbStore.getPolicy(merchantId);
    const cases = dbStore.getCases(merchantId);

    let totalAtRisk = 0;
    let currentRecovered = 0;
    cases.forEach((c) => {
      totalAtRisk += c.at_risk_amount;
      if (c.status === 'SUCCEEDED') currentRecovered += c.recovered_amount || c.at_risk_amount;
    });

    if (totalAtRisk === 0) totalAtRisk = 500000;
    if (currentRecovered === 0) currentRecovered = 365000;

    const currentRecoveryRate = Math.round((currentRecovered / totalAtRisk) * 1000) / 10;

    // Simulation Model Delta Computation
    let rateDelta = 0;
    let costDelta = 0;
    let humanReviewDelta = 0;
    let fatigueDelta = 0;
    let blockedDelta = 0;

    // 1. Max Retries impact
    if (input.max_retries > currentPolicy.max_retries) {
      rateDelta += (input.max_retries - currentPolicy.max_retries) * 3.8;
      fatigueDelta += 0.08;
    } else if (input.max_retries < currentPolicy.max_retries) {
      rateDelta -= (currentPolicy.max_retries - input.max_retries) * 4.5;
      fatigueDelta -= 0.12;
      blockedDelta += 4;
    }

    // 2. Recovery Window impact
    if (input.max_recovery_window_hours > currentPolicy.max_recovery_window_hours) {
      rateDelta += Math.min(6.5, (input.max_recovery_window_hours - currentPolicy.max_recovery_window_hours) * 0.08);
    } else if (input.max_recovery_window_hours < currentPolicy.max_recovery_window_hours) {
      rateDelta -= (currentPolicy.max_recovery_window_hours - input.max_recovery_window_hours) * 0.12;
      blockedDelta += 3;
    }

    // 3. High-Value Review Threshold impact
    if (input.high_value_review_threshold < currentPolicy.high_value_review_threshold) {
      humanReviewDelta += Math.round((currentPolicy.high_value_review_threshold - input.high_value_review_threshold) / 2500);
      rateDelta += 1.5; // manual white-glove touch increases conversion
    } else {
      humanReviewDelta -= Math.round((input.high_value_review_threshold - currentPolicy.high_value_review_threshold) / 5000);
    }

    // 4. Auto-cooldown toggle
    if (input.enable_auto_cooldown) {
      rateDelta += 4.2;
      costDelta += 3200; // saved gateway bounce fees
    }

    // 5. Channel preferences
    if (input.preferred_channels.includes('whatsapp')) {
      rateDelta += 5.5;
    }

    if (!input.auto_recovery_enabled) {
      rateDelta = -45.0; // severe drop if automation is turned off
    }

    const projectedRate = Math.min(96.5, Math.max(15.0, Number((currentRecoveryRate + rateDelta).toFixed(1))));
    const actualDelta = Number((projectedRate - currentRecoveryRate).toFixed(1));
    const projectedRecovered = Math.round(totalAtRisk * (projectedRate / 100));
    const revenueDelta = projectedRecovered - currentRecovered;

    const baseAutoCases = Math.round(cases.length * 0.85);
    const baseReviewCases = Math.round(cases.length * 0.15);

    const projectedAutoResolved = Math.max(0, baseAutoCases - humanReviewDelta);
    const projectedHumanReview = Math.max(1, baseReviewCases + humanReviewDelta);

    const recommendations: string[] = [];
    if (input.max_retries >= 4) {
      recommendations.push('High retry limit may increase customer fatigue on debit accounts. Recommend adding 24-hr quiet hours.');
    }
    if (input.high_value_review_threshold > 25000) {
      recommendations.push('Raising high-value review threshold above ₹25,000 streamlines automation with low risk.');
    }
    if (input.enable_auto_cooldown) {
      recommendations.push('Adaptive cooldown active: Protects conversion rates during bank downtime.');
    }
    if (revenueDelta > 0) {
      recommendations.push(`Proposed configuration yields estimated +₹${revenueDelta.toLocaleString('en-IN')} additional recovered revenue.`);
    }

    let riskScore: PolicySimulationResult['risk_score'] = 'BALANCED';
    if (input.max_retries >= 4 && input.max_auto_recovery_amount > 50000) riskScore = 'AGGRESSIVE';
    else if (input.max_retries <= 2 && input.high_value_review_threshold <= 5000) riskScore = 'LOW_RISK';

    return {
      current_policy: currentPolicy,
      simulated_config: input,
      projected_recovery_rate: projectedRate,
      current_recovery_rate: currentRecoveryRate,
      recovery_rate_delta: actualDelta,
      projected_recovered_revenue: projectedRecovered,
      current_recovered_revenue: currentRecovered,
      revenue_delta: revenueDelta,
      projected_cases_auto_resolved: projectedAutoResolved,
      projected_cases_human_review: projectedHumanReview,
      customer_fatigue_rate: Math.min(1.0, Math.max(0.05, 0.18 + fatigueDelta)),
      blocked_actions_count: Math.max(0, 2 + blockedDelta),
      estimated_gateway_cost_savings: Math.max(0, costDelta + Math.round(cases.length * 4.5)),
      risk_score: riskScore,
      recommendations,
    };
  }
}
