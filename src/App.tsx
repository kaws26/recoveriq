import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Overview } from './components/Overview';
import { PaymentsView } from './components/PaymentsView';
import { RecoveryWorkspace } from './components/RecoveryWorkspace';
import { CustomersView } from './components/CustomersView';
import { InsightsView } from './components/InsightsView';
import { ReportsView } from './components/ReportsView';
import { ActivityView } from './components/ActivityView';
import { SettingsView } from './components/SettingsView';
import { PaymentDetailDrawer } from './components/PaymentDetailDrawer';
import { RecordFailureModal } from './components/RecordFailureModal';
import { HelpModal } from './components/HelpModal';
import { CustomerCheckoutView } from './components/CustomerCheckoutView';
import { MerchantOnboardingModal } from './components/MerchantOnboardingModal';
import { CreatePaymentModal } from './components/CreatePaymentModal';
import { RecoveryLiftLabView } from './components/RecoveryLiftLabView';
import { PolicySimulatorView } from './components/PolicySimulatorView';
import { PaymentDegradationRadar } from './components/PaymentDegradationRadar';
import { UnrecoveredAutopsyView } from './components/UnrecoveredAutopsyView';
import { EnterpriseTestWorkflowsView } from './components/EnterpriseTestWorkflowsView';
import { MakerCheckerApprovalsView } from './components/MakerCheckerApprovalsView';
import { GatewayRoutingMatrixView } from './components/GatewayRoutingMatrixView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AuthModal } from './components/AuthModal';
import { ROLE_DEFINITIONS } from './components/UserProfileMenu';


import {
  DashboardSummary,
  TrendDataPoint,
  RevenueRiskCase,
  Payment,
  Customer,
  AuditEvent,
  PolicyConfig,
  FailureReasonStat,
  InterventionStat,
  RecoveryActionType,
  FailureReason,
  PaymentMethod,
  EnterpriseRole,
  EnterpriseUser,
} from './types';
import * as api from './lib/api';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, Info, Sparkles, ExternalLink } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Backend state
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [cases, setCases] = useState<RevenueRiskCase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [policy, setPolicy] = useState<PolicyConfig | null>(null);
  const [failureReasons, setFailureReasons] = useState<FailureReasonStat[]>([]);
  const [interventions, setInterventions] = useState<InterventionStat[]>([]);

  // Modals, Drawers & Checkout Routing
  const [selectedCase, setSelectedCase] = useState<RevenueRiskCase | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);
  const [activeCheckoutPaymentId, setActiveCheckoutPaymentId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Enterprise Role & Governance State
  const [currentRole, setCurrentRole] = useState<EnterpriseRole>('MERCHANT_ADMIN');
  const [currentUser, setCurrentUser] = useState<EnterpriseUser>({
    id: 'usr_admin_01',
    name: 'Kawaljeet Singh',
    email: 'finance@apexdigital.in',
    role: 'MERCHANT_ADMIN',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(1);

  // Load authenticated session on mount
  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        if (res.user) {
          setCurrentUser(res.user);
          setCurrentRole(res.user.role);
        }
      })
      .catch((err) => {
        console.debug('Session check (using demo user profile):', err);
      });
  }, []);

  // Synchronized Role Switching (updates local state, role metadata, and backend token session)
  const handleRoleChange = async (role: EnterpriseRole) => {
    setCurrentRole(role);
    const meta = ROLE_DEFINITIONS[role];
    if (meta) {
      setCurrentUser((prev) => ({
        ...prev,
        name: meta.name,
        email: meta.email,
        role,
      }));
    }

    try {
      const res = await api.switchRole(role);
      if (res.user) {
        setCurrentUser(res.user);
      }
      showToast(`Switched active role to ${meta?.title || role}`, 'info');
    } catch (err: any) {
      showToast(`Switched active role to ${meta?.title || role}`, 'info');
    }
  };

  // Sign out / Switch account handler
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    showToast('Signed out of session. Choose an account or role to continue.', 'info');
    setIsAuthModalOpen(true);
  };

  // Global Command Palette (Cmd+K / Ctrl+K) Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // URL Path Detection for direct checkout links e.g. /pay/:paymentId
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/pay/')) {
      const pId = path.split('/pay/')[1];
      if (pId) {
        setActiveCheckoutPaymentId(pId);
      }
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const payParam = urlParams.get('pay');
      if (payParam) {
        setActiveCheckoutPaymentId(payParam);
      }
    }
  }, []);

  // Fetch all domain data from server
  const loadAllData = useCallback(async () => {
    try {
      const [
        sumData,
        trendData,
        casesData,
        paymentsData,
        custData,
        auditData,
        polData,
        reasonsData,
        intervData,
      ] = await Promise.all([
        api.fetchDashboardSummary(),
        api.fetchDashboardTrends(),
        api.fetchCases(),
        api.fetchPayments(),
        api.fetchCustomers(),
        api.fetchAuditTrail(),
        api.fetchPolicyConfig(),
        api.fetchFailureReasons(),
        api.fetchInterventions(),
      ]);

      setSummary(sumData);
      setTrends(trendData);
      setCases(casesData);
      setPayments(paymentsData);
      setCustomers(custData);
      setAuditEvents(auditData);
      setPolicy(polData);
      setFailureReasons(reasonsData);
      setInterventions(intervData);

      // Fetch pending maker-checker approvals
      try {
        const mcRequests = await api.fetchMakerCheckerRequests();
        const pending = mcRequests.filter((r) => r.status === 'PENDING_APPROVAL').length;
        setPendingApprovalsCount(pending);
      } catch (err) {
        // non-blocking
      }

      // Keep selected case synced if drawer is open
      setSelectedCase((prev) => {
        if (!prev) return null;
        return casesData.find((c) => c.id === prev.id) || null;
      });
    } catch (err: any) {
      console.error('Data load error:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Server-Sent Events (SSE) for Real-Time Event Sync
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events/stream');

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'payment.failed') {
            showToast(`Real-time Alert: Payment ${data.data?.payment?.id} failed & ingested.`, 'info');
            loadAllData();
          } else if (data.type === 'recovery.outcome_verified') {
            showToast(`Recovery Verified: ₹${data.data?.recovered_amount || ''} captured!`, 'success');
            loadAllData();
          } else if (data.type === 'payment.created') {
            loadAllData();
          }
        } catch (err) {
          // heartbeat or ping
        }
      };

      eventSource.onerror = () => {
        // SSE reconnection handled automatically by browser EventSource
      };
    } catch (err) {
      console.error('SSE initialization error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [loadAllData]);

  // Recovery Execution
  const handleExecuteRecovery = async (params: {
    caseId: string;
    action?: RecoveryActionType;
    delayMinutes?: number;
  }) => {
    try {
      const res = await api.executeRecovery(params);
      showToast(`Payment recovery executed: ₹${res.case.recovered_amount || res.case.at_risk_amount} captured!`, 'success');
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Recovery failed', 'error');
      throw err;
    }
  };

  const handleEscalateCase = async (caseId: string, notes?: string) => {
    try {
      await api.escalateCase(caseId, notes);
      showToast('Payment escalated to merchant specialist queue', 'info');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Escalation failed', 'error');
      throw err;
    }
  };

  const handleStopRecovery = async (caseId: string, reason?: string) => {
    try {
      await api.stopRecovery(caseId, reason);
      showToast('Payment recovery halted', 'info');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Stop failed', 'error');
      throw err;
    }
  };

  const handleIngestEvent = async (data: {
    amount: number;
    failure_reason: FailureReason;
    failure_code?: string;
    failure_description?: string;
    payment_method?: PaymentMethod;
    customer_name?: string;
    customer_email?: string;
  }) => {
    try {
      const res = await api.ingestPaymentEvent(data);
      showToast(`Payment event ingested: ${res.case.payment_id}`, 'success');
      await loadAllData();
      setSelectedCase(res.case);
      setCurrentTab('recovery');
    } catch (err: any) {
      showToast(err.message || 'Ingestion failed', 'error');
      throw err;
    }
  };

  const handleSavePolicy = async (updates: Partial<PolicyConfig>) => {
    try {
      const updated = await api.updatePolicyConfig(updates);
      setPolicy(updated);
      showToast('Recovery policy settings saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
      throw err;
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await api.seedDemoData();
      showToast('Ledger and recovery records reseeded', 'success');
      await loadAllData();
    } catch (err: any) {
      showToast('Reset failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const needsActionCount = cases.filter((c) =>
    ['PENDING', 'SCORED', 'DECIDED', 'ESCALATED'].includes(c.status)
  ).length;

  // If customer checkout is open
  if (activeCheckoutPaymentId) {
    return (
      <CustomerCheckoutView
        paymentId={activeCheckoutPaymentId}
        onClose={() => {
          setActiveCheckoutPaymentId(null);
          // clean URL without reloading
          window.history.pushState({}, '', '/');
          loadAllData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Inter'] flex antialiased transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 shadow-xl text-xs font-semibold text-white border border-slate-800">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Modern Fintech Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenRecordModal={() => setIsRecordModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onOpenCreatePayment={() => setIsCreatePaymentOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        needsActionCount={needsActionCount}
        pendingApprovalsCount={pendingApprovalsCount}
        currentRole={currentRole}
        onSelectRole={handleRoleChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Top Bar with Spotlight Search */}
        <TopBar
          payments={payments}
          customers={customers}
          cases={cases}
          auditEvents={auditEvents}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onResetData={handleResetData}
          isResetting={isResetting}
          onOpenRecordModal={() => setIsRecordModalOpen(true)}
          onSelectTab={setCurrentTab}
          onSelectCase={setSelectedCase}
        />

        {/* Content Views */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <Overview
              summary={summary}
              trends={trends}
              failureReasons={failureReasons}
              recentCases={cases}
              onSelectCase={setSelectedCase}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsView
              payments={payments}
              cases={cases}
              onSelectPaymentCase={setSelectedCase}
            />
          )}

          {currentTab === 'recovery' && (
            <RecoveryWorkspace
              cases={cases}
              onSelectCase={setSelectedCase}
            />
          )}

          {currentTab === 'test_workflows' && (
            <EnterpriseTestWorkflowsView
              onRefreshData={loadAllData}
              onOpenCaseDetail={(caseId) => {
                const c = cases.find((x) => x.id === caseId);
                if (c) setSelectedCase(c);
              }}
            />
          )}

          {currentTab === 'maker_checker' && (
            <MakerCheckerApprovalsView
              currentRole={currentRole}
              onOpenCaseDetail={(caseId) => {
                const c = cases.find((x) => x.id === caseId);
                if (c) setSelectedCase(c);
              }}
            />
          )}

          {currentTab === 'gateways' && (
            <GatewayRoutingMatrixView onRefreshData={loadAllData} />
          )}

          {currentTab === 'lift_lab' && (
            <RecoveryLiftLabView />
          )}

          {currentTab === 'simulator' && (
            <PolicySimulatorView />
          )}

          {currentTab === 'degradation' && (
            <PaymentDegradationRadar />
          )}

          {currentTab === 'autopsy' && (
            <UnrecoveredAutopsyView />
          )}


          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              payments={payments}
              cases={cases}
              onSelectCase={setSelectedCase}
            />
          )}

          {currentTab === 'insights' && (
            <InsightsView
              failureReasons={failureReasons}
              interventions={interventions}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              summary={summary}
              payments={payments}
              cases={cases}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityView events={auditEvents} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              policy={policy}
              onSavePolicy={handleSavePolicy}
            />
          )}
        </main>
      </div>

      {/* Payment Operations Drawer */}
      <PaymentDetailDrawer
        riskCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onExecuteRecovery={handleExecuteRecovery}
        onEscalateCase={handleEscalateCase}
        onStopRecovery={handleStopRecovery}
        onCaseUpdated={(updatedCase) => {
          setSelectedCase(updatedCase);
          setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
        }}
      />

      {/* Ingest Failed Payment Modal */}
      <RecordFailureModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onIngest={handleIngestEvent}
      />

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={isCreatePaymentOpen}
        onClose={() => setIsCreatePaymentOpen(false)}
        onPaymentCreated={(id) => {
          loadAllData();
        }}
        onOpenCheckout={(id) => {
          setActiveCheckoutPaymentId(id);
        }}
      />

      {/* Merchant Onboarding Modal */}
      <MerchantOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentPolicy={policy}
        onComplete={({ paymentId }) => {
          setIsOnboardingOpen(false);
          loadAllData();
          if (paymentId) {
            setActiveCheckoutPaymentId(paymentId);
          }
        }}
      />

      {/* Help & Documentation Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Global Command Palette Modal (Cmd+K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab as NavTab)}
        onSelectRole={handleRoleChange}
        currentRole={currentRole}
      />

      {/* Enterprise Authentication & Role Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          showToast(`Signed in as ${user.name} (${user.role})`, 'success');
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="recoveriq-theme">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
