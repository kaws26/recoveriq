// RecoverIQ — Payment Degradation & Outage Intelligence Engine
import { PaymentDegradationAlert } from '../../types';

class PaymentDegradationTracker {
  private alerts: Map<string, PaymentDegradationAlert> = new Map();

  constructor() {
    this.seedInitialAlerts();
  }

  private seedInitialAlerts() {
    const now = new Date();

    const initialAlerts: PaymentDegradationAlert[] = [
      {
        id: 'deg_hdfc_upi',
        issuer_or_network: 'HDFC Bank UPI Switch',
        payment_method: 'upi',
        current_failure_rate: 44.8,
        baseline_failure_rate: 3.2,
        failure_spike_percentage: 1300,
        status: 'DEGRADED',
        detected_at: new Date(now.getTime() - 14 * 60000).toISOString(),
        affected_payments_count: 18,
        affected_amount: 84500,
        primary_error_code: 'NPCI_RESP_U30',
        recommended_mitigation: 'Enable 45-min adaptive cooldown. Do NOT execute immediate retries against HDFC handles.',
        mitigation_action: 'AUTO_COOLDOWN',
        mitigation_active: true,
      },
      {
        id: 'deg_icici_nb',
        issuer_or_network: 'ICICI Netbanking Gateway',
        payment_method: 'netbanking',
        current_failure_rate: 32.1,
        baseline_failure_rate: 2.8,
        failure_spike_percentage: 1046,
        status: 'DEGRADED',
        detected_at: new Date(now.getTime() - 32 * 60000).toISOString(),
        affected_payments_count: 7,
        affected_amount: 42000,
        primary_error_code: 'BANK_SESSION_TIMEOUT',
        recommended_mitigation: 'Suggest fallback WhatsApp payment link with card or UPI alternative.',
        mitigation_action: 'ROUTE_FALLBACK_LINK',
        mitigation_active: false,
      },
      {
        id: 'deg_sbi_card',
        issuer_or_network: 'SBI Card 3DS ACS Server',
        payment_method: 'card',
        current_failure_rate: 5.4,
        baseline_failure_rate: 4.8,
        failure_spike_percentage: 12.5,
        status: 'HEALTHY',
        detected_at: new Date(now.getTime() - 60 * 60000).toISOString(),
        affected_payments_count: 2,
        affected_amount: 14000,
        primary_error_code: 'NONE',
        recommended_mitigation: 'Operating within normal tolerances. Standard recovery rules active.',
        mitigation_action: 'AUTO_COOLDOWN',
        mitigation_active: false,
      },
    ];

    initialAlerts.forEach((a) => this.alerts.set(a.id, a));
  }

  public getAlerts(): PaymentDegradationAlert[] {
    return Array.from(this.alerts.values());
  }

  public toggleMitigation(alertId: string, active?: boolean): PaymentDegradationAlert {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Degradation alert ${alertId} not found.`);
    }
    alert.mitigation_active = active !== undefined ? active : !alert.mitigation_active;
    return alert;
  }
}

export const degradationTracker = new PaymentDegradationTracker();
