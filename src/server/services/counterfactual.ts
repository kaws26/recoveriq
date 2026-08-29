// RecoverIQ — Counterfactual Scenario Engine
import { CounterfactualScenario, RevenueRiskCase } from '../../types';

export class CounterfactualService {
  /**
   * Generates counterfactual "what-if" scenarios for a specific recovery case.
   * Compares the executed or recommended action against alternate strategies.
   */
  public static generateScenarios(riskCase: RevenueRiskCase): CounterfactualScenario[] {
    const amount = riskCase.at_risk_amount;
    const baseP = riskCase.ml_score?.probability || 0.75;
    const chosenAction = riskCase.ai_decision?.action || 'RETRY_AFTER_DELAY';

    const chosenEV = Math.round(baseP * amount);

    const scenarios: CounterfactualScenario[] = [
      {
        id: 'cf_1',
        strategy_name: 'Immediate Server Retry (0m)',
        action: 'RETRY_NOW',
        delay_minutes: 0,
        channel: 'api',
        projected_probability: Number(Math.max(0.1, baseP * 0.55).toFixed(2)),
        projected_expected_value: Math.round(Math.max(0.1, baseP * 0.55) * amount - 1.5),
        projected_cost: 1.5,
        delta_vs_chosen_strategy: Math.round(Math.max(0.1, baseP * 0.55) * amount - chosenEV),
        risk_profile: 'HIGH',
        rationale: 'Retrying immediately during issuer downtime would result in a secondary decline, burning 1 retry attempt.',
      },
      {
        id: 'cf_2',
        strategy_name: 'Smart Cooldown Retry (30m delay)',
        action: 'RETRY_AFTER_DELAY',
        delay_minutes: 30,
        channel: 'api',
        projected_probability: Number(Math.min(0.96, baseP * 1.15).toFixed(2)),
        projected_expected_value: Math.round(Math.min(0.96, baseP * 1.15) * amount - 1.5),
        projected_cost: 1.5,
        delta_vs_chosen_strategy: Math.round(Math.min(0.96, baseP * 1.15) * amount - chosenEV),
        risk_profile: 'LOW',
        rationale: 'Allows issuer bank switches to normalize queue backlog, maximizing probability of success.',
      },
      {
        id: 'cf_3',
        strategy_name: 'WhatsApp 1-Click Recovery Link',
        action: 'SEND_REMINDER',
        delay_minutes: 10,
        channel: 'whatsapp',
        projected_probability: Number(Math.min(0.92, baseP * 1.05).toFixed(2)),
        projected_expected_value: Math.round(Math.min(0.92, baseP * 1.05) * amount - 0.85),
        projected_cost: 0.85,
        delta_vs_chosen_strategy: Math.round(Math.min(0.92, baseP * 1.05) * amount - chosenEV),
        risk_profile: 'LOW',
        rationale: 'Enables customer to choose an alternate UPI app or card, bypassing the failing gateway rail.',
      },
      {
        id: 'cf_4',
        strategy_name: 'VIP Human Specialist Review',
        action: 'ESCALATE',
        delay_minutes: 0,
        channel: 'manual',
        projected_probability: 0.88,
        projected_expected_value: Math.round(0.88 * amount - 45),
        projected_cost: 45.0,
        delta_vs_chosen_strategy: Math.round(0.88 * amount - chosenEV),
        risk_profile: 'LOW',
        rationale: 'Direct concierge outreach guarantees personal touch, but incurs highest operational cost.',
      },
    ];

    return scenarios;
  }
}
