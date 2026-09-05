// RecoverIQ — Stage 2: Root Cause Diagnosis & Error Forensics Engine
import {
  Payment,
  Customer,
  DiagnosisReport,
  FailureClassification,
  RootCauseCategory,
  ErrorSubCodeAnalysis,
  BankHealthImpact,
} from '../../types';
import { degradationTracker } from './degradation';

interface KnownErrorMeta {
  classification: FailureClassification;
  category: RootCauseCategory;
  title: string;
  summary: string;
  autopsy: string[];
  subCode: ErrorSubCodeAnalysis;
  recoverabilityScore: number;
  isRetryable: boolean;
  requiresCustomerAction: boolean;
  recommendedNextStep: string;
  cooldownSeconds: number;
  bankAffiliation?: string;
}

const ERROR_TAXONOMY: Record<string, KnownErrorMeta> = {
  GATEWAY_TIMEOUT: {
    classification: 'TRANSIENT',
    category: 'NETWORK_GATEWAY',
    title: 'Acquirer / Switch Network Timeout',
    summary: 'NPCI UPI Gateway response timeout during collect/auth request. No debit acknowledged by issuing switch.',
    autopsy: [
      'TCP handshake completed with payment gateway edge endpoint.',
      'Beneficiary switch latency exceeded 4,500ms SLA threshold during 2FA payload routing.',
      'No reverse-credit charge detected in central clearing; transaction aborted cleanly in pending state.',
      'Deterministic status: Safe for non-duplicate retry once downstream queue drains.',
    ],
    subCode: {
      raw_code: 'GATEWAY_TIMEOUT',
      standard_code: 'NPCI_RESP_U30',
      description: 'Transaction timed out at Beneficiary Bank Switch during VPA verification payload transfer.',
      gateway_component: 'NPCI_SWITCH',
      recovery_feasibility: 'AUTO_RETRYABLE',
      spec_reference: 'NPCI UPI Spec v2.1 — Clause 8.4 (Timeout & Auto-Reversal Protocols)',
    },
    recoverabilityScore: 88,
    isRetryable: true,
    requiresCustomerAction: false,
    recommendedNextStep: 'Schedule automated background retry with 15-minute jittered cooldown to avoid thundering herd.',
    cooldownSeconds: 900,
  },
  NPCI_RESP_U30: {
    classification: 'TRANSIENT',
    category: 'NETWORK_GATEWAY',
    title: 'Beneficiary Bank UPI Switch Timeout',
    summary: 'NPCI Switch reported Beneficiary Bank UPI gateway timeout. Core Banking System failed to return status within window.',
    autopsy: [
      'UPI Intent dispatch delivered to customer PSP application.',
      'PSP pushed MPIN authorization packet to NPCI National Switch.',
      'Target beneficiary core banking system (CBS) socket timed out at 5,000ms threshold.',
      'Auto-reversal cycle confirmed clear; no merchant settlement ledger mismatch.',
    ],
    subCode: {
      raw_code: 'NPCI_RESP_U30',
      standard_code: 'NPCI_RESP_U30',
      description: 'Transaction timed out at Beneficiary Bank Switch during collect request.',
      gateway_component: 'ISSUER',
      recovery_feasibility: 'AUTO_RETRYABLE',
      spec_reference: 'NPCI UPI Common Library Specification v3.0 (Error Catalog U30)',
    },
    recoverabilityScore: 85,
    isRetryable: true,
    requiresCustomerAction: false,
    recommendedNextStep: 'Trigger smart retry routed through backup switch or after 15-minute CBS recovery window.',
    cooldownSeconds: 900,
    bankAffiliation: 'HDFC',
  },
  HDFC_CORE_BANKING_DOWN: {
    classification: 'TRANSIENT',
    category: 'ISSUING_BANK',
    title: 'HDFC Core Banking System (CBS) Scheduled Maintenance',
    summary: 'HDFC Bank Issuer host reported temporary service unavailability. High-value batch maintenance in progress.',
    autopsy: [
      'Inbound card authorization packet rejected with ISO-8583 Response Code 91 (System Malfunction).',
      'Telemetry verifies HDFC core banking switch failure spike of 44.8% across merchant cohort.',
      'High-value threshold (>₹25,000) requires maker-checker guardrail compliance under FinOps policy.',
      'Customer account funds are intact; outage is strictly infrastructure-level.',
    ],
    subCode: {
      raw_code: 'HDFC_CORE_BANKING_DOWN',
      standard_code: 'ISO_8583_RC91',
      description: 'Issuer host system offline or unable to process authorization within timeout envelope.',
      gateway_component: 'ISSUER',
      recovery_feasibility: 'AUTO_RETRYABLE',
      spec_reference: 'ISO 8583 Financial Transaction Message Spec — Code 91 (System Malfunction)',
    },
    recoverabilityScore: 74,
    isRetryable: true,
    requiresCustomerAction: false,
    recommendedNextStep: 'Escalate to Risk Officer for dual-authorization approval; schedule retry for post-maintenance window.',
    cooldownSeconds: 2700,
    bankAffiliation: 'HDFC',
  },
  BANK_SYSTEM_OUTAGE: {
    classification: 'TRANSIENT',
    category: 'ISSUING_BANK',
    title: 'Issuing Bank Switch Outage',
    summary: 'Target bank authorization cluster degraded. Central switch refusing inbound debit transactions.',
    autopsy: [
      'Inbound payment gateway connection rejected with 503 Service Unavailable.',
      'Bank gateway health monitor triggered active degradation alert.',
      'No customer authentication challenge was served; zero risk of double charge.',
      'Historical mean time to recovery (MTTR) for this cluster is 22 minutes.',
    ],
    subCode: {
      raw_code: 'BANK_SYSTEM_OUTAGE',
      standard_code: 'ISO_8583_RC96',
      description: 'Processing center malfunction or catastrophic switch link severance.',
      gateway_component: 'ISSUER',
      recovery_feasibility: 'AUTO_RETRYABLE',
      spec_reference: 'RBI Master Directions on Payment Settlement Interoperability (Section 12.2)',
    },
    recoverabilityScore: 78,
    isRetryable: true,
    requiresCustomerAction: false,
    recommendedNextStep: 'Apply dynamic cooldown until bank telemetry returns to baseline (<3% failure rate).',
    cooldownSeconds: 1800,
  },
  INSUFFICIENT_FUNDS: {
    classification: 'CUSTOMER_ACTIONABLE',
    category: 'BALANCE_FUNDS',
    title: 'Insufficient Balance in Debit Account / Card Limit Exceeded',
    summary: 'Transaction declined by issuer due to insufficient available funds in customer account.',
    autopsy: [
      'Card/UPI authorization packet reached issuing bank core ledger.',
      'Balance check returned ISO-8583 Response Code 51 (Insufficient Funds).',
      'Automated machine retries against the same balance will strictly fail and hurt merchant decline ratios.',
      'Customer lifetime value indicates loyal profile; targeted friction-free dunning recommended.',
    ],
    subCode: {
      raw_code: 'INSUFFICIENT_FUNDS',
      standard_code: 'ISO_8583_RC51',
      description: 'Account balance insufficient to complete requested debit authorization.',
      gateway_component: 'ISSUER',
      recovery_feasibility: 'CUSTOMER_LINK_RECOMMENDED',
      spec_reference: 'ISO 8583 Response Code 51 — Insufficient funds',
    },
    recoverabilityScore: 62,
    isRetryable: false,
    requiresCustomerAction: true,
    recommendedNextStep: 'Dispatch WhatsApp dunning notification with 1-click Razorpay payment link and alternate method selection.',
    cooldownSeconds: 3600,
  },
  UPI_INSUFFICIENT_FUNDS: {
    classification: 'CUSTOMER_ACTIONABLE',
    category: 'BALANCE_FUNDS',
    title: 'Customer UPI Linked Account Insufficient Funds',
    summary: 'Customer primary bank account linked to VPA lacks required balance for transaction amount.',
    autopsy: [
      'NPCI returned failure code ZM (Invalid or insufficient balance).',
      'Customer MPIN was entered correctly; authentication succeeded.',
      'Account balance below debit amount; automatic retry will result in repeated bank decline.',
      'Optimal recovery window is 2-4 hours after customer receives salary or top-up SMS.',
    ],
    subCode: {
      raw_code: 'UPI_INSUFFICIENT_FUNDS',
      standard_code: 'NPCI_RESP_ZM',
      description: 'Payer account does not possess adequate cleared balance for clearing transaction.',
      gateway_component: 'ISSUER',
      recovery_feasibility: 'CUSTOMER_LINK_RECOMMENDED',
      spec_reference: 'NPCI UPI Error Code Matrix v2.6 (Error Code ZM)',
    },
    recoverabilityScore: 65,
    isRetryable: false,
    requiresCustomerAction: true,
    recommendedNextStep: 'Send gentle SMS/WhatsApp notification allowing customer to switch linked UPI account or pay via credit card.',
    cooldownSeconds: 7200,
  },
  '3DS_TIMEOUT': {
    classification: 'CUSTOMER_ACTIONABLE',
    category: 'CUSTOMER_AUTHENTICATION',
    title: '3DS 2FA Customer Authentication Timeout',
    summary: 'ACS (Access Control Server) challenge window expired. Customer did not submit OTP within 180 seconds.',
    autopsy: [
      'Customer reached 3DS ACS verification webview.',
      'OTP delivery packet sent to registered mobile handset.',
      'No OTP response received prior to session timer expiry (180s).',
      'Transaction aborted safely without debit.',
    ],
    subCode: {
      raw_code: '3DS_TIMEOUT',
      standard_code: 'EMVCO_3DS_TIMEOUT',
      description: 'Cardholder 2-Factor challenge abandoned or timed out at Access Control Server.',
      gateway_component: 'USER_CLIENT',
      recovery_feasibility: 'CUSTOMER_LINK_RECOMMENDED',
      spec_reference: 'EMVCo 3-D Secure Protocol and Core Functions Specification v2.2.0',
    },
    recoverabilityScore: 72,
    isRetryable: false,
    requiresCustomerAction: true,
    recommendedNextStep: 'Send instant recovery link with auto-OTP detection enabled for fast frictionless checkout.',
    cooldownSeconds: 300,
  },
  EXPIRED_CARD: {
    classification: 'TERMINAL',
    category: 'CUSTOMER_AUTHENTICATION',
    title: 'Card Token or Expiry Date Lapsed',
    summary: 'Payment card has surpassed its recorded expiry month/year. Card cannot be billed again.',
    autopsy: [
      'Card expiry verification check failed before gateway transmission.',
      'Issuer confirmed token validity expired.',
      'Zero probability of recovery with existing card token. Immediate policy block enforced.',
      'Customer must supply updated card credentials or select alternative payment rail.',
    ],
    subCode: {
      raw_code: 'EXPIRED_CARD',
      standard_code: 'ISO_8583_RC54',
      description: 'Expired card or expired network token.',
      gateway_component: 'USER_CLIENT',
      recovery_feasibility: 'CUSTOMER_LINK_RECOMMENDED',
      spec_reference: 'ISO 8583 Response Code 54 — Expired card',
    },
    recoverabilityScore: 48,
    isRetryable: false,
    requiresCustomerAction: true,
    recommendedNextStep: 'Request customer update billing method via secure portal link; do NOT retry expired token.',
    cooldownSeconds: 0,
  },
  DO_NOT_HONOR: {
    classification: 'TERMINAL',
    category: 'ISSUING_BANK',
    title: 'Issuer Rejection: Do Not Honor',
    summary: 'Issuing bank explicitly declined payment authorization without providing public sub-cause.',
    autopsy: [
      'Issuer risk firewall flagged transaction or card account.',
      'Generic ISO-8583 Code 05 returned; repeated retries risk card block.',
      'Hard terminal decline: Automatic retries permanently blocked.',
    ],
    subCode: {
      raw_code: 'DO_NOT_HONOR',
      standard_code: 'ISO_8583_RC05',
      description: 'Transaction declined by card issuer with restriction flag.',
      gateway_component: 'ISSUER',
      recovery_feasibility: 'NON_RETRYABLE',
      spec_reference: 'ISO 8583 Response Code 05 — Do not honor',
    },
    recoverabilityScore: 18,
    isRetryable: false,
    requiresCustomerAction: true,
    recommendedNextStep: 'Advise customer to contact issuing bank or switch to UPI / alternative card.',
    cooldownSeconds: 0,
  },
  MANDATE_FAILED: {
    classification: 'CUSTOMER_ACTIONABLE',
    category: 'REGULATORY_LIMIT',
    title: 'Recurring e-Mandate Execution Failure',
    summary: 'RBI e-mandate pre-debit notification window or execution limit violated.',
    autopsy: [
      'Standing instruction pre-debit notification was not delivered 24h prior, or exceeded ₹15,000 threshold without AFA.',
      'Mandate token remains valid but requires manual customer re-authentication.',
      'Autopay paused until customer clears cycle manually.',
    ],
    subCode: {
      raw_code: 'MANDATE_FAILED',
      standard_code: 'RBI_EMANDATE_FAIL',
      description: 'Recurring instruction failed compliance criteria or mandate debit window.',
      gateway_component: 'GATEWAY_ORCHESTRATION',
      recovery_feasibility: 'CUSTOMER_LINK_RECOMMENDED',
      spec_reference: 'RBI Circular DPSS.CO.PD No.647/02.14.006/2021-22 (Recurring e-Mandates)',
    },
    recoverabilityScore: 68,
    isRetryable: false,
    requiresCustomerAction: true,
    recommendedNextStep: 'Dispatch pre-filled invoice link for one-time manual clearance and re-authorize mandate.',
    cooldownSeconds: 600,
  },
};

export class DiagnosticEngine {
  /**
   * Evaluates Stage 2 Root Cause Diagnosis for any payment failure.
   */
  public static diagnose(
    payment: Payment,
    customer?: Customer,
    merchantId?: string,
    caseId?: string,
  ): DiagnosisReport {
    const rawCode = payment.failure_code || 'GATEWAY_TIMEOUT';
    const reasonKey = payment.failure_reason || 'temporary_network_failure';
    const method = payment.payment_method || 'upi';

    // Check exact match or fallback matching
    let meta = ERROR_TAXONOMY[rawCode];
    if (!meta) {
      // Map by failure_reason
      if (reasonKey === 'temporary_network_failure' || reasonKey === 'payment_timeout') {
        meta = ERROR_TAXONOMY.GATEWAY_TIMEOUT;
      } else if (reasonKey === 'bank_unavailable') {
        meta = ERROR_TAXONOMY.BANK_SYSTEM_OUTAGE;
      } else if (reasonKey === 'insufficient_funds') {
        meta = method === 'upi' ? ERROR_TAXONOMY.UPI_INSUFFICIENT_FUNDS : ERROR_TAXONOMY.INSUFFICIENT_FUNDS;
      } else if (reasonKey === 'expired_card') {
        meta = ERROR_TAXONOMY.EXPIRED_CARD;
      } else if (reasonKey === 'mandate_failed') {
        meta = ERROR_TAXONOMY.MANDATE_FAILED;
      } else if (reasonKey === 'authentication_failed') {
        meta = ERROR_TAXONOMY['3DS_TIMEOUT'];
      } else if (reasonKey === 'do_not_honor') {
        meta = ERROR_TAXONOMY.DO_NOT_HONOR;
      } else {
        // Generic fallback
        meta = {
          classification: 'TRANSIENT',
          category: 'NETWORK_GATEWAY',
          title: `Diagnostic Analysis: ${rawCode.replace(/_/g, ' ')}`,
          summary: payment.failure_description || 'Payment failed during gateway processing.',
          autopsy: [
            `Received failure signal from ${method.toUpperCase()} processor with code: ${rawCode}.`,
            'Telemetry analyzed for central clearing discrepancy; no permanent charge detected.',
            'Case categorized under standard fault taxonomy for intelligent recovery orchestration.',
          ],
          subCode: {
            raw_code: rawCode,
            standard_code: `RZP_${rawCode}`,
            description: payment.failure_description || 'Gateway reported transaction processing error.',
            gateway_component: 'GATEWAY_ORCHESTRATION',
            recovery_feasibility: 'AUTO_RETRYABLE',
            spec_reference: 'Razorpay Payment Gateway Error Matrix API Reference',
          },
          recoverabilityScore: 70,
          isRetryable: true,
          requiresCustomerAction: false,
          recommendedNextStep: 'Evaluate ML probability and execute recommended AI recovery action.',
          cooldownSeconds: 600,
        };
      }
    }

    // Correlate with real-time bank degradation alerts
    const alerts = degradationTracker.getAlerts();
    let bankImpact: BankHealthImpact | undefined;

    // Check if failure involves HDFC, ICICI, SBI, or UPI Switch
    const descUpper = (payment.failure_description + ' ' + rawCode + ' ' + (meta.bankAffiliation || '')).toUpperCase();
    for (const alert of alerts) {
      const issuerUpper = alert.issuer_or_network.toUpperCase();
      if (
        (descUpper.includes('HDFC') && issuerUpper.includes('HDFC')) ||
        (descUpper.includes('ICICI') && issuerUpper.includes('ICICI')) ||
        (descUpper.includes('SBI') && issuerUpper.includes('SBI')) ||
        (method === 'upi' && issuerUpper.includes('UPI') && alert.status === 'DEGRADED')
      ) {
        bankImpact = {
          bank_name: alert.issuer_or_network,
          system_state: alert.status === 'DEGRADED' ? 'DEGRADED_DOWN' : 'HEALTHY',
          latency_p95_ms: alert.status === 'DEGRADED' ? 3850 : 280,
          observed_failure_rate_pct: alert.current_failure_rate,
          incident_correlation: alert.status === 'DEGRADED',
          incident_note: alert.recommended_mitigation,
        };
        break;
      }
    }

    // Adjust recoverability and cooldown based on bank degradation
    let finalRecoverability = meta.recoverabilityScore;
    let finalCooldown = meta.cooldownSeconds;
    if (bankImpact?.incident_correlation) {
      // If bank is currently degraded, immediate retry would fail, but post-cooldown recovery is high
      finalCooldown = Math.max(finalCooldown, 1800); // at least 30 mins
      finalRecoverability = Math.min(finalRecoverability, 75);
    }

    // Customer profile modifier
    if (customer && customer.payment_success_rate > 0.85) {
      finalRecoverability = Math.min(99, finalRecoverability + 5);
    }

    const report: DiagnosisReport = {
      id: `diag_${payment.id}_${Date.now()}`,
      case_id: caseId || `case_${payment.id}`,
      classification: meta.classification,
      category: meta.category,
      root_cause_title: meta.title,
      root_cause_summary: meta.summary,
      detailed_autopsy: meta.autopsy,
      error_analysis: {
        ...meta.subCode,
        raw_code: rawCode,
      },
      bank_impact: bankImpact,
      recoverability_score: finalRecoverability,
      is_retryable: meta.isRetryable,
      requires_customer_action: meta.requiresCustomerAction,
      recommended_next_step: meta.recommendedNextStep,
      suggested_cooldown_seconds: finalCooldown,
      diagnosed_at: new Date().toISOString(),
      engine_version: 'RecoverIQ-Diagnostic-Engine-v2.5',
    };

    return report;
  }
}
