import {
  DashboardSummary,
  TrendDataPoint,
  RevenueRiskCase,
  Payment,
  Customer,
  AIDecision,
  AuditEvent,
  PolicyConfig,
  FailureReasonStat,
  InterventionStat,
  FailureReason,
  PaymentMethod,
  RecoveryActionType,
  ExecutionSource,
  RecoveryLiftMetrics,
  PaymentDegradationAlert,
  PolicySimulationInput,
  PolicySimulationResult,
  UnrecoveredRevenueAnalysis,
  CounterfactualScenario,
  CustomerFatigueProfile,
} from '../types';

const API_BASE = '/api';


export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to load dashboard summary');
  return res.json();
}

export async function fetchDashboardTrends(): Promise<TrendDataPoint[]> {
  const res = await fetch(`${API_BASE}/dashboard/trends`);
  if (!res.ok) throw new Error('Failed to load trends');
  return res.json();
}

export async function fetchCases(filter?: { status?: string; search?: string }): Promise<RevenueRiskCase[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== 'ALL') params.append('status', filter.status);
  if (filter?.search) params.append('search', filter.search);
  const res = await fetch(`${API_BASE}/revenue-at-risk?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load recovery cases');
  return res.json();
}

export async function fetchCaseById(caseId: string): Promise<RevenueRiskCase> {
  const res = await fetch(`${API_BASE}/recovery/${caseId}`);
  if (!res.ok) throw new Error('Failed to load case details');
  return res.json();
}

export async function analyzeCase(caseId: string): Promise<RevenueRiskCase> {
  const res = await fetch(`${API_BASE}/recovery/${caseId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Case analysis failed');
  }
  return res.json();
}

export async function executeRecovery(params: {
  caseId: string;
  action?: RecoveryActionType;
  delayMinutes?: number;
  executionSource?: ExecutionSource;
}): Promise<{ action: any; case: RevenueRiskCase }> {
  const res = await fetch(`${API_BASE}/recovery/${params.caseId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: params.action,
      delay_minutes: params.delayMinutes,
      execution_source: params.executionSource,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Recovery execution failed');
  }
  return res.json();
}

export async function stopRecovery(caseId: string, reason?: string): Promise<RevenueRiskCase> {
  const res = await fetch(`${API_BASE}/recovery/${caseId}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to stop recovery');
  return res.json();
}

export async function escalateCase(caseId: string, notes?: string): Promise<RevenueRiskCase> {
  const res = await fetch(`${API_BASE}/recovery/${caseId}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error('Failed to escalate case');
  return res.json();
}

export async function fetchPayments(): Promise<Payment[]> {
  const res = await fetch(`${API_BASE}/payments`);
  if (!res.ok) throw new Error('Failed to load payments');
  return res.json();
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE}/customers`);
  if (!res.ok) throw new Error('Failed to load customers');
  return res.json();
}

export async function fetchAIDecisions(): Promise<AIDecision[]> {
  const res = await fetch(`${API_BASE}/ai/decisions`);
  if (!res.ok) throw new Error('Failed to load AI decisions');
  return res.json();
}

export async function fetchAuditTrail(caseId?: string): Promise<AuditEvent[]> {
  const url = caseId ? `${API_BASE}/audit?case_id=${caseId}` : `${API_BASE}/audit`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load audit trail');
  return res.json();
}

export async function fetchPolicyConfig(): Promise<PolicyConfig> {
  const res = await fetch(`${API_BASE}/settings/policies`);
  if (!res.ok) throw new Error('Failed to load policy configuration');
  return res.json();
}

export async function updatePolicyConfig(updates: Partial<PolicyConfig>): Promise<PolicyConfig> {
  const res = await fetch(`${API_BASE}/settings/policies`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update policy');
  return res.json();
}

export async function fetchFailureReasons(): Promise<FailureReasonStat[]> {
  const res = await fetch(`${API_BASE}/analytics/failure-reasons`);
  if (!res.ok) throw new Error('Failed to load failure reason statistics');
  return res.json();
}

export async function fetchInterventions(): Promise<InterventionStat[]> {
  const res = await fetch(`${API_BASE}/analytics/interventions`);
  if (!res.ok) throw new Error('Failed to load intervention metrics');
  return res.json();
}

export async function runDemoScenario(scenario: 'golden_path' | 'high_value' | 'max_retry' | 'reminder'): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Demo scenario execution failed');
  }
  return res.json();
}

export async function seedDemoData(): Promise<void> {
  const res = await fetch(`${API_BASE}/demo/seed`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to seed demo data');
}

export async function ingestPaymentEvent(params: {
  amount: number;
  failure_reason: FailureReason;
  failure_code?: string;
  failure_description?: string;
  payment_method?: PaymentMethod;
  customer_name?: string;
  customer_email?: string;
  source?: 'simulation' | 'razorpay_polling' | 'razorpay_webhook';
}): Promise<{ success: boolean; case: RevenueRiskCase }> {
  const res = await fetch(`${API_BASE}/events/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to ingest payment event');
  return res.json();
}

// Razorpay Integration APIs
export async function connectRazorpay(key_id: string, key_secret: string) {
  const res = await fetch(`${API_BASE}/integrations/razorpay/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key_id, key_secret }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to connect Razorpay Test Mode');
  }
  return res.json();
}

export async function fetchRazorpayStatus() {
  const res = await fetch(`${API_BASE}/integrations/razorpay/status`);
  if (!res.ok) throw new Error('Failed to fetch Razorpay status');
  return res.json();
}

export async function disconnectRazorpay() {
  const res = await fetch(`${API_BASE}/integrations/razorpay/disconnect`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to disconnect Razorpay');
  return res.json();
}

// Company Registration Onboarding
export async function registerCompany(payload: {
  company_name: string;
  business_email: string;
  currency?: string;
  country?: string;
  password?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Registration failed');
  }
  return res.json();
}

// Payment Order Creation
export async function createPayment(payload: {
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  description: string;
}) {
  const res = await fetch(`${API_BASE}/payments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create payment');
  }
  return res.json();
}

// Customer Checkout APIs (Isolated, Public Safe)
export async function fetchCheckoutSession(paymentId: string) {
  const res = await fetch(`${API_BASE}/checkout/${paymentId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Checkout session not found');
  }
  return res.json();
}

export async function completeCheckoutPayment(paymentId: string, data: {
  status: 'captured' | 'failed';
  failure_reason?: FailureReason;
  failure_code?: string;
  failure_description?: string;
  payment_method?: PaymentMethod;
  provider_payment_id?: string;
}) {
  const res = await fetch(`${API_BASE}/checkout/${paymentId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to process checkout completion');
  }
  return res.json();
}

// Recovery Lift Lab Benchmark API
export async function fetchRecoveryLift(): Promise<RecoveryLiftMetrics> {
  const res = await fetch(`${API_BASE}/analytics/lift`);
  if (!res.ok) throw new Error('Failed to load recovery lift metrics');
  return res.json();
}

// Payment Degradation & Outage Radar APIs
export async function fetchDegradationAlerts(): Promise<PaymentDegradationAlert[]> {
  const res = await fetch(`${API_BASE}/degradation/alerts`);
  if (!res.ok) throw new Error('Failed to load degradation alerts');
  return res.json();
}

export async function toggleDegradationMitigation(alertId: string, active?: boolean): Promise<{ success: boolean; alert: PaymentDegradationAlert; message: string }> {
  const res = await fetch(`${API_BASE}/degradation/mitigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_id: alertId, active }),
  });
  if (!res.ok) throw new Error('Failed to update mitigation');
  return res.json();
}

// Policy Simulator & Natural Language Assistant APIs
export async function simulatePolicy(input: Partial<PolicySimulationInput>): Promise<PolicySimulationResult> {
  const res = await fetch(`${API_BASE}/policy/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Policy simulation failed');
  return res.json();
}

export async function parseNaturalPolicy(prompt: string): Promise<any> {
  const res = await fetch(`${API_BASE}/policy/natural-parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error('Failed to interpret natural policy prompt');
  return res.json();
}

// Unrecovered Revenue Autopsy API
export async function fetchUnrecoveredAnalysis(): Promise<UnrecoveredRevenueAnalysis> {
  const res = await fetch(`${API_BASE}/analytics/unrecovered`);
  if (!res.ok) throw new Error('Failed to load unrecovered revenue analysis');
  return res.json();
}

// Case Counterfactual What-If API
export async function fetchCaseCounterfactuals(caseId: string): Promise<{ case_id: string; amount: number; scenarios: CounterfactualScenario[] }> {
  const res = await fetch(`${API_BASE}/recovery/${caseId}/counterfactual`);
  if (!res.ok) throw new Error('Failed to load counterfactual scenarios');
  return res.json();
}

// Customer Fatigue Profile API
export async function fetchCustomerFatigue(customerId: string): Promise<CustomerFatigueProfile> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/fatigue`);
  if (!res.ok) throw new Error('Failed to load customer fatigue profile');
  return res.json();
}


