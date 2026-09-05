// RecoverIQ — Core Domain Types and Schemas

export type FailureReason =
  | 'temporary_network_failure'
  | 'insufficient_funds'
  | 'bank_unavailable'
  | 'expired_card'
  | 'mandate_failed'
  | 'authentication_failed'
  | 'payment_timeout'
  | 'checkout_abandoned'
  | 'do_not_honor'
  | 'limit_exceeded';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi';

export type CaseStatus =
  | 'PENDING'
  | 'DIAGNOSED'
  | 'SCORED'
  | 'DECIDED'
  | 'SCHEDULED'
  | 'EXECUTING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'BLOCKED'
  | 'ESCALATED'
  | 'STOPPED'
  | 'UNKNOWN';

export type RecoveryActionType =
  | 'RETRY_NOW'
  | 'RETRY_AFTER_DELAY'
  | 'SEND_REMINDER'
  | 'CREATE_PAYMENT_LINK'
  | 'ESCALATE'
  | 'STOP';

export type ExecutionSource = 'simulation' | 'razorpay_test' | 'manual';

export interface Merchant {
  id: string;
  name: string;
  email: string;
  currency: string;
  razorpay_configured: boolean;
  nvidia_configured: boolean;
  demo_mode: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  merchant_id: string;
  name: string;
  email: string;
  phone: string;
  lifetime_value: number;
  payment_success_rate: number;
  recovery_rate: number;
  total_transactions: number;
  failed_transactions: number;
  recovered_transactions: number;
  created_at: string;
}

export interface Payment {
  id: string;
  merchant_id: string;
  customer_id: string;
  customer?: Customer;
  amount: number;
  currency: string;
  status: 'failed' | 'captured' | 'refunded' | 'pending';
  payment_method: PaymentMethod;
  failure_reason: FailureReason;
  failure_code: string;
  failure_description: string;
  retry_count: number;
  subscription_flag: boolean;
  mandate_flag: boolean;
  checkout_abandoned: boolean;
  external_reference?: string;
  occurred_at: string;
  created_at: string;
}

export interface MLFeatures {
  amount: number;
  failure_reason: FailureReason;
  retry_count: number;
  customer_payment_success_rate: number;
  customer_recovery_rate: number;
  historical_retry_success_rate: number;
  time_since_failure: number; // in minutes
  payment_method: PaymentMethod;
  subscription_flag: boolean;
  mandate_flag: boolean;
  checkout_abandoned: boolean;
  time_of_day: number; // 0-23
  customer_lifetime_value: number;
}

export interface MLScoreResult {
  probability: number; // 0.0 to 1.0
  confidence_interval: [number, number];
  risk_band: 'HIGH_PROBABILITY' | 'MODERATE' | 'LOW_PROBABILITY' | 'CRITICAL_RISK';
  feature_importances: Record<string, number>;
  model_version: string;
  calculated_at: string;
}

export interface StrategyOption {
  action: RecoveryActionType;
  label: string;
  description: string;
  probability: number;
  expected_value: number;
  recommended_delay_minutes: number;
  channel?: 'whatsapp' | 'sms' | 'email' | 'api';
  is_selected: boolean;
}

export interface AIDecision {
  id: string;
  case_id: string;
  merchant_id: string;
  action: RecoveryActionType;
  delay_minutes: number;
  reason_code: string;
  explanation: string;
  confidence: number;
  expected_recovery_value: number;
  requires_human_review: boolean;
  ai_provider: string; // "nvidia/nemotron-3-super-120b-a12b" | "gemini-2.5-flash" | "Deterministic Fallback"
  decision_source: 'NVIDIA_NEMOTRON' | 'GEMINI_FALLBACK' | 'DETERMINISTIC_FALLBACK';
  strategy_comparison: StrategyOption[];
  raw_token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  created_at: string;
}

export interface PolicyRuleEvaluation {
  rule_id: string;
  name: string;
  description: string;
  passed: boolean;
  severity: 'BLOCK' | 'ESCALATE' | 'WARN' | 'INFO';
  reason?: string;
}

export interface PolicyEvaluation {
  id: string;
  case_id: string;
  verdict: 'PASSED' | 'BLOCKED' | 'ESCALATED_HUMAN_REVIEW';
  evaluated_action: RecoveryActionType;
  allowed_action: RecoveryActionType;
  rules_checked: PolicyRuleEvaluation[];
  reasons: string[];
  evaluated_at: string;
}

export interface PolicyConfig {
  merchant_id: string;
  max_retries: number;
  max_recovery_window_hours: number;
  max_auto_recovery_amount: number;
  high_value_review_threshold: number;
  quiet_hours_start: number; // 22 (10 PM)
  quiet_hours_end: number;   // 8 (8 AM)
  auto_recovery_enabled: boolean;
  preferred_execution_provider: ExecutionSource;
  updated_at: string;
}

export interface RecoveryActionRecord {
  id: string;
  case_id: string;
  merchant_id: string;
  action_type: RecoveryActionType;
  status: CaseStatus;
  execution_source: ExecutionSource;
  idempotency_key: string;
  scheduled_at?: string;
  executed_at?: string;
  verified_at?: string;
  external_transaction_id?: string;
  error_message?: string;
  recovered_amount?: number;
  payload?: Record<string, any>;
  created_at: string;
}

// --- STAGE 2: ROOT CAUSE DIAGNOSIS & ERROR FORENSICS ---
export type FailureClassification = 'TRANSIENT' | 'CUSTOMER_ACTIONABLE' | 'TERMINAL';

export type RootCauseCategory =
  | 'NETWORK_GATEWAY'
  | 'ISSUING_BANK'
  | 'CUSTOMER_AUTHENTICATION'
  | 'BALANCE_FUNDS'
  | 'REGULATORY_LIMIT'
  | 'INTEGRATION_ERROR';

export interface ErrorSubCodeAnalysis {
  raw_code: string;
  standard_code: string;
  description: string;
  gateway_component: 'ACQUIRER' | 'ISSUER' | 'NPCI_SWITCH' | 'GATEWAY_ORCHESTRATION' | 'USER_CLIENT';
  recovery_feasibility: 'AUTO_RETRYABLE' | 'CUSTOMER_LINK_RECOMMENDED' | 'NON_RETRYABLE';
  spec_reference?: string;
}

export interface BankHealthImpact {
  bank_name: string;
  system_state: 'HEALTHY' | 'ELEVATED_LATENCY' | 'DEGRADED_DOWN';
  latency_p95_ms: number;
  observed_failure_rate_pct: number;
  incident_correlation: boolean;
  incident_note?: string;
}

export interface DiagnosisReport {
  id: string;
  case_id: string;
  classification: FailureClassification;
  category: RootCauseCategory;
  root_cause_title: string;
  root_cause_summary: string;
  detailed_autopsy: string[];
  error_analysis: ErrorSubCodeAnalysis;
  bank_impact?: BankHealthImpact;
  recoverability_score: number; // 0 to 100
  is_retryable: boolean;
  requires_customer_action: boolean;
  recommended_next_step: string;
  suggested_cooldown_seconds: number;
  diagnosed_at: string;
  engine_version: string;
}

export interface RevenueRiskCase {
  id: string;
  merchant_id: string;
  payment_id: string;
  payment?: Payment;
  customer?: Customer;
  status: CaseStatus;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  at_risk_amount: number;
  recovered_amount: number;
  diagnosis?: DiagnosisReport;
  ml_score?: MLScoreResult;
  ai_decision?: AIDecision;
  policy_evaluation?: PolicyEvaluation;
  latest_action?: RecoveryActionRecord;
  next_best_actions?: NextBestActionOption[];
  fatigue_profile?: CustomerFatigueProfile;
  execution_source: ExecutionSource;
  recovery_attempts: number;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  merchant_id: string;
  case_id?: string;
  payment_id?: string;
  event_type:
    | 'PAYMENT_FAILED_DETECTED'
    | 'CASE_CREATED'
    | 'DIAGNOSIS_COMPLETED'
    | 'ML_PROBABILITY_SCORED'
    | 'AI_DECISION_GENERATED'
    | 'POLICY_GUARDRAIL_EVALUATED'
    | 'RECOVERY_ACTION_SCHEDULED'
    | 'RECOVERY_ACTION_EXECUTING'
    | 'RECOVERY_PROVIDER_RESPONSE'
    | 'OUTCOME_VERIFIED'
    | 'REVENUE_RECOVERED_RECORDED'
    | 'CASE_ESCALATED'
    | 'CASE_BLOCKED'
    | 'POLICY_UPDATED'
    | 'MANUAL_OVERRIDE';
  stage:
    | 'DETECT'
    | 'DIAGNOSE'
    | 'SCORE'
    | 'DECIDE'
    | 'POLICY'
    | 'EXECUTE'
    | 'VERIFY'
    | 'MEASURE'
    | 'AUDIT';
  actor:
    | 'SYSTEM_INGEST'
    | 'DIAGNOSTIC_ENGINE'
    | 'ML_ENGINE'
    | 'AI_AGENT'
    | 'POLICY_ENGINE'
    | 'EXECUTION_PROVIDER'
    | 'MERCHANT_ADMIN';
  summary: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface NormalizedIngestEvent {
  event_id: string;
  event_type: 'payment.failed' | 'payment.captured' | 'payment.authorized';
  payment_id: string;
  customer_id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  failure_reason: FailureReason;
  failure_code?: string;
  failure_description?: string;
  payment_method?: PaymentMethod;
  occurred_at: string;
  source: 'simulation' | 'razorpay_polling' | 'razorpay_webhook';
}

export interface DashboardSummary {
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate: number; // percentage 0-100
  payments_recovered_count: number;
  total_failed_payments: number;
  active_recovery_actions: number;
  avg_time_to_recovery_minutes: number;
  prevented_revenue_leakage: number;
  period_change: {
    revenue_at_risk: number;
    revenue_recovered: number;
    recovery_rate: number;
  };
}

export interface TrendDataPoint {
  date: string;
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate: number;
  failed_count: number;
  recovered_count: number;
}

export interface MerchantConnection {
  id: string;
  merchant_id: string;
  provider: 'razorpay';
  environment: 'test' | 'live';
  status: 'connected' | 'disconnected' | 'error';
  last_verified_at?: string;
  key_id_masked?: string;
  error_message?: string;
}

export interface CompanyRegistrationPayload {
  company_name: string;
  business_email: string;
  password?: string;
  country: string;
  currency: string;
}

export interface CreatePaymentPayload {
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  description: string;
}

export interface CustomerCheckoutSession {
  payment_id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  description: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: 'pending' | 'failed' | 'captured';
  razorpay_order_id?: string;
  razorpay_key_id?: string;
  failure_reason?: string;
  failure_code?: string;
  failure_description?: string;
  created_at: string;
}

export interface FailureReasonStat {
  reason: FailureReason;
  label: string;
  count: number;
  total_amount: number;
  recovered_amount: number;
  recovery_rate: number;
}

export interface InterventionStat {
  action: RecoveryActionType;
  label: string;
  attempted: number;
  succeeded: number;
  failed: number;
  blocked: number;
  escalated: number;
  success_rate: number;
  recovered_value: number;
}

// --- RECOVERY STATE MACHINE & JOURNEY ---
export type RecoveryStageKey =
  | 'INGESTION'
  | 'DIAGNOSIS'
  | 'ML_SCORING'
  | 'AI_DECISION'
  | 'POLICY_EVAL'
  | 'ACTION_EXECUTION'
  | 'VERIFICATION'
  | 'OUTCOME_ACCOUNTING'
  | 'AUDIT_TRAIL';

export interface RecoveryJourneyStage {
  stage: RecoveryStageKey;
  label: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'BLOCKED' | 'FAILED' | 'SKIPPED';
  timestamp?: string;
  actor: string;
  details: Record<string, any>;
  proof?: string;
}

export interface NextBestActionOption {
  action: RecoveryActionType;
  rank: number;
  label: string;
  description: string;
  expected_value: number;
  probability: number;
  estimated_cost: number;
  channel?: 'whatsapp' | 'sms' | 'email' | 'api' | 'manual';
  delay_minutes: number;
  rationale: string;
  is_recommended: boolean;
  policy_permitted: boolean;
  policy_notes?: string;
}

export interface CustomerFatigueProfile {
  customer_id: string;
  messages_last_24h: number;
  messages_last_7d: number;
  max_allowed_24h: number;
  fatigue_status: 'HEALTHY' | 'MODERATE' | 'FATIGUED';
  last_contacted_at?: string;
  quiet_hours_active: boolean;
  can_send_reminder: boolean;
}

// --- RECOVERY LIFT LAB & BENCHMARKING ---
export interface FailureReasonLift {
  failure_reason: FailureReason;
  label: string;
  baseline_rate: number;
  recoveriq_rate: number;
  lift_pct: number;
  at_risk_amount: number;
  recovered_lift_amount: number;
}

export interface PaymentMethodLift {
  method: PaymentMethod;
  label: string;
  baseline_rate: number;
  recoveriq_rate: number;
  lift_pct: number;
}

export interface RecoveryLiftMetrics {
  baseline_recovery_rate: number;
  recoveriq_recovery_rate: number;
  net_lift_percentage: number;
  net_lift_revenue: number;
  total_revenue_at_risk: number;
  total_recoveriq_recovered: number;
  total_baseline_recovered: number;
  avg_retries_per_recovery_baseline: number;
  avg_retries_per_recovery_recoveriq: number;
  retry_efficiency_improvement: number;
  avoided_failed_retry_fees: number;
  lift_by_failure_reason: FailureReasonLift[];
  lift_by_payment_method: PaymentMethodLift[];
  monthly_savings_projection: number;
}

// --- POLICY SIMULATOR & WHAT-IF ENGINE ---
export interface PolicySimulationInput {
  max_retries: number;
  max_recovery_window_hours: number;
  max_auto_recovery_amount: number;
  high_value_review_threshold: number;
  quiet_hours_start: number;
  quiet_hours_end: number;
  auto_recovery_enabled: boolean;
  enable_auto_cooldown: boolean;
  preferred_channels: Array<'api' | 'whatsapp' | 'sms' | 'payment_link'>;
}

export interface PolicySimulationResult {
  current_policy: PolicyConfig;
  simulated_config: PolicySimulationInput;
  projected_recovery_rate: number;
  current_recovery_rate: number;
  recovery_rate_delta: number;
  projected_recovered_revenue: number;
  current_recovered_revenue: number;
  revenue_delta: number;
  projected_cases_auto_resolved: number;
  projected_cases_human_review: number;
  customer_fatigue_rate: number;
  blocked_actions_count: number;
  estimated_gateway_cost_savings: number;
  risk_score: 'LOW_RISK' | 'BALANCED' | 'AGGRESSIVE';
  recommendations: string[];
}

// --- PAYMENT DEGRADATION & OUTAGE INTELLIGENCE ---
export interface PaymentDegradationAlert {
  id: string;
  issuer_or_network: string;
  payment_method: PaymentMethod;
  current_failure_rate: number;
  baseline_failure_rate: number;
  failure_spike_percentage: number;
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  detected_at: string;
  affected_payments_count: number;
  affected_amount: number;
  primary_error_code: string;
  recommended_mitigation: string;
  mitigation_action: 'AUTO_COOLDOWN' | 'ROUTE_FALLBACK_LINK' | 'SWITCH_GATEWAY';
  mitigation_active: boolean;
}

// --- UNRECOVERED REVENUE AUTOPSY ---
export interface UnrecoveredRootCauseCategory {
  category: string;
  label: string;
  count: number;
  amount: number;
  percentage_of_unrecovered: number;
  description: string;
  recoverable_potential: boolean;
  playbook_action: string;
}

export interface UnrecoveredRevenueAnalysis {
  total_unrecovered_amount: number;
  total_unrecovered_count: number;
  unrecovered_rate: number;
  hard_declines_amount: number;
  soft_failures_unrecovered_amount: number;
  preventable_leakage_amount: number;
  categories: UnrecoveredRootCauseCategory[];
  preventive_playbook: Array<{
    title: string;
    impact: string;
    action: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

// --- COUNTERFACTUAL WHAT-IF SCENARIOS ---
export interface CounterfactualScenario {
  id: string;
  strategy_name: string;
  action: RecoveryActionType;
  delay_minutes: number;
  channel: string;
  projected_probability: number;
  projected_expected_value: number;
  projected_cost: number;
  delta_vs_chosen_strategy: number;
  risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
  rationale: string;
}

// --- ENTERPRISE GOVERNANCE & ROLES ---
export type EnterpriseRole =
  | 'MERCHANT_ADMIN'
  | 'RISK_OFFICER'
  | 'PAYMENT_OPS'
  | 'SUPER_ADMIN'
  | 'AUDITOR'
  | 'FINANCE_AUDITOR';

export interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: EnterpriseRole;
  department?: string;
  permissions?: string[];
  avatar_url?: string;
  last_login?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  merchant_id?: string;
  merchant_name?: string;
}

export interface MakerCheckerRequest {
  id: string;
  merchant_id: string;
  case_id: string;
  payment_id: string;
  requested_by: {
    user_id: string;
    name: string;
    role: EnterpriseRole;
  };
  action_type: RecoveryActionType | 'WRITE_OFF' | 'MANUAL_REFUND' | 'POLICY_OVERRIDE';
  amount: number;
  currency: string;
  reason: string;
  justification_notes: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  created_at: string;
  reviewed_by?: {
    user_id: string;
    name: string;
    role: EnterpriseRole;
  };
  reviewed_at?: string;
  review_notes?: string;
}

// --- COMPANY TEST WORKFLOWS & SANDBOX TESTING ---
export type TestScenarioId =
  | 'SCENARIO_UPI_AUTOPAY'
  | 'SCENARIO_OUTAGE_CASCADE'
  | 'SCENARIO_MAKER_CHECKER'
  | 'SCENARIO_CARD_UPDATER'
  | 'SCENARIO_MULTI_CHANNEL_DUNNING'
  | 'SCENARIO_WEBHOOK_REPLAY';

export interface TestExecutionStep {
  step_number: number;
  stage_name: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  duration_ms?: number;
  input_payload?: any;
  output_result?: any;
  timestamp?: string;
}

export interface CompanyTestScenario {
  id: TestScenarioId;
  name: string;
  badge: string;
  category: 'UPI_AUTOPAY' | 'RESILIENCE' | 'ENTERPRISE_GOVERNANCE' | 'CARD_LIFECYCLE' | 'DUNNING_EXPERIENCE' | 'WEBHOOK_PIPELINE';
  description: string;
  business_impact: string;
  expected_outcome: string;
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  steps: TestExecutionStep[];
  metrics_summary?: {
    recovered_revenue?: number;
    latency_ms?: number;
    recovery_rate?: number;
    audit_events_count?: number;
    mitigation_applied?: string;
  };
  last_executed_at?: string;
}

// --- WEBHOOK SIMULATOR & GATEWAY PAYLOADS ---
export type GatewayProvider = 'razorpay' | 'stripe' | 'payu' | 'cashfree' | 'adyen' | 'billdesk' | 'npci_upi';

export interface WebhookTestTemplate {
  gateway: GatewayProvider;
  event_type: string;
  event_name: string;
  description: string;
  sample_payload: Record<string, any>;
  signature_header_name: string;
  sample_signature: string;
}

export interface WebhookDispatchResult {
  success: boolean;
  gateway: GatewayProvider;
  event_type: string;
  http_status: number;
  response_body: any;
  latency_ms: number;
  created_case_id?: string;
  audit_logged: boolean;
  signature_verified: boolean;
}

// --- GATEWAY ROUTING & SWITCH MATRIX ---
export interface GatewayRouteHealth {
  id: string;
  name: string;
  provider: GatewayProvider;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  success_rate: number;
  p95_latency_ms: number;
  routing_weight_pct: number;
  supported_methods: PaymentMethod[];
  circuit_breaker_active: boolean;
  last_downtime?: string;
  primary_currency: string;
  failover_target_provider?: GatewayProvider;
  failure_count_24h?: number;
}

