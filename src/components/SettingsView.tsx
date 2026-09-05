import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Clock,
  DollarSign,
  Bell,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building2,
  CreditCard,
  MessageSquare,
  Mail,
  Zap,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Lock,
  Sun,
  Moon,
  Laptop,
  Check,
} from 'lucide-react';
import { PolicyConfig } from '../types';
import { formatINR } from '../lib/utils';
import * as api from '../lib/api';
import { useTheme } from '../context/ThemeContext';

interface SettingsViewProps {
  policy: PolicyConfig | null;
  onSavePolicy: (updates: Partial<PolicyConfig>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  policy,
  onSavePolicy,
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [maxRetries, setMaxRetries] = useState(policy?.max_retries || 3);
  const [windowHours, setWindowHours] = useState(policy?.max_recovery_window_hours || 72);
  const [highValueCeiling, setHighValueCeiling] = useState(policy?.high_value_review_threshold || 10000);
  const [maxAutoRecoveryAmount, setMaxAutoRecoveryAmount] = useState(policy?.max_auto_recovery_amount || 25000);
  const [autoRecovery, setAutoRecovery] = useState(policy?.auto_recovery_enabled ?? true);
  const [quietStart, setQuietStart] = useState(policy?.quiet_hours_start || 22);
  const [quietEnd, setQuietEnd] = useState(policy?.quiet_hours_end || 8);
  const [preferredProvider, setPreferredProvider] = useState<'simulation' | 'razorpay_test'>('simulation');

  const [channelWhatsapp, setChannelWhatsapp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Razorpay Gateway State
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');
  const [rzpStatus, setRzpStatus] = useState<any>(null);
  const [isTestingRzp, setIsTestingRzp] = useState(false);
  const [rzpMessage, setRzpMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadRzpStatus() {
      try {
        const status = await api.fetchRazorpayStatus();
        setRzpStatus(status);
        if (status.connected) {
          setPreferredProvider('razorpay_test');
        }
      } catch (err) {
        console.error('Failed to load Razorpay status:', err);
      }
    }
    loadRzpStatus();
  }, []);

  const handleConnectRazorpay = async () => {
    if (!razorpayKeyId || !razorpaySecret) {
      setRzpMessage({ text: 'Please enter both Razorpay Test Key ID and Secret.', type: 'error' });
      return;
    }
    setIsTestingRzp(true);
    setRzpMessage(null);
    try {
      const res = await api.connectRazorpay(razorpayKeyId, razorpaySecret);
      setRzpStatus(res.connection);
      setRzpMessage({ text: 'Connected and verified healthy with Razorpay Test Mode API!', type: 'success' });
      setRazorpaySecret('');
    } catch (err: any) {
      setRzpMessage({ text: err.message || 'Connection test failed.', type: 'error' });
    } finally {
      setIsTestingRzp(false);
    }
  };

  const handleDisconnectRazorpay = async () => {
    try {
      await api.disconnectRazorpay();
      const status = await api.fetchRazorpayStatus();
      setRzpStatus(status);
      setRzpMessage({ text: 'Razorpay Test Mode credentials removed.', type: 'success' });
    } catch (err: any) {
      setRzpMessage({ text: err.message || 'Failed to disconnect', type: 'error' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePolicy({
        max_retries: maxRetries,
        max_recovery_window_hours: windowHours,
        high_value_review_threshold: highValueCeiling,
        max_auto_recovery_amount: maxAutoRecoveryAmount,
        auto_recovery_enabled: autoRecovery,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        preferred_execution_provider: preferredProvider,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl font-['Inter']">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-['Plus_Jakarta_Sans']">
            Settings & Integrations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure payment gateways, recovery guardrails, and automated execution parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </>
          )}
        </button>
      </div>

      {/* Section 1: Payment Gateway Integration (Razorpay Test Mode) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Payment Gateway Connection (Razorpay Test Mode)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect your Razorpay Test API keys for live test order creation and real-time polling sync.
            </p>
          </div>

          {rzpStatus?.connected ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected & Healthy ({rzpStatus.keyIdMasked || 'rzp_test_••••'})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Simulation Provider Active
            </span>
          )}
        </div>

        {rzpMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              rzpMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {rzpMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{rzpMessage.text}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Razorpay Test Key ID</label>
              <input
                type="text"
                placeholder={rzpStatus?.keyIdMasked || 'rzp_test_...'}
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Razorpay Test Key Secret</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={razorpaySecret}
                onChange={(e) => setRazorpaySecret(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isTestingRzp}
                onClick={handleConnectRazorpay}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isTestingRzp ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Verifying with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Connect & Test Credentials</span>
                  </>
                )}
              </button>

              {rzpStatus?.connected && (
                <button
                  type="button"
                  onClick={handleDisconnectRazorpay}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Environment: <strong className="text-slate-800 dark:text-slate-200 uppercase font-mono">Test Mode</strong> (Safe for testing)
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Autonomous Recovery Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5 transition-colors">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            Autonomous Recovery Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define automatic retry behavior and retry window limits
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Automated Recovery Execution
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Automatically execute diagnosed recovery actions when policy criteria and limits pass.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRecovery}
                onChange={(e) => setAutoRecovery(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Retries */}
            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-850/50">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Maximum Automatic Retries
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Maximum automated retry attempts per failed transaction before halting.
              </p>
              <select
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value={1}>1 Retry Attempt</option>
                <option value={2}>2 Retry Attempts</option>
                <option value={3}>3 Retry Attempts (Recommended)</option>
                <option value={4}>4 Retry Attempts</option>
                <option value={5}>5 Retry Attempts</option>
              </select>
            </div>

            {/* Recovery Window */}
            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-850/50">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Recovery Time Window
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Time frame after initial failure within which recovery actions may be executed.
              </p>
              <select
                value={windowHours}
                onChange={(e) => setWindowHours(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours</option>
                <option value={72}>72 Hours (Standard)</option>
                <option value={120}>120 Hours (5 Days)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Financial Safety Ceilings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5 transition-colors">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            Financial Risk & Review Guardrails
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control thresholds that trigger mandatory merchant review and approval
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-850/50">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              High-Value Review Threshold (INR)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Transactions at or above this amount will pause automatic retry and require manual operator approval.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={highValueCeiling}
                onChange={(e) => setHighValueCeiling(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold font-['JetBrains_Mono'] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Current limit: {formatINR(highValueCeiling)}
            </span>
          </div>

          <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-850/50">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Maximum Auto-Recovery Amount (INR)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Absolute maximum ceiling permitted for autonomous system-triggered recoveries.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={maxAutoRecoveryAmount}
                onChange={(e) => setMaxAutoRecoveryAmount(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold font-['JetBrains_Mono'] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Current ceiling: {formatINR(maxAutoRecoveryAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Section 4: Customer Experience & Quiet Hours */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5 transition-colors">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            Quiet Hours & Customer Channels
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define customer communication windows and allowed notification channels
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-850/50">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Quiet Hours Start</label>
              <select
                value={quietStart}
                onChange={(e) => setQuietStart(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value={21}>09:00 PM</option>
                <option value={22}>10:00 PM (Default)</option>
                <option value={23}>11:00 PM</option>
              </select>
            </div>

            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-850/50">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Quiet Hours End</label>
              <select
                value={quietEnd}
                onChange={(e) => setQuietEnd(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value={7}>07:00 AM</option>
                <option value={8}>08:00 AM (Default)</option>
                <option value={9}>09:00 AM</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Interface Appearance & Theme Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5 transition-colors">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Appearance & Interface Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose your preferred color theme or sync automatically with your operating system preferences
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                {theme === 'light' && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">Light Mode</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Crisp white canvas with high-contrast slate typography
              </span>
            </div>

            {/* Mini preview bar */}
            <div className="mt-3.5 p-2 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-white shadow-xs" />
              <div className="h-1.5 w-12 bg-slate-300 rounded-full" />
              <div className="h-1.5 w-6 bg-blue-500 rounded-full ml-auto" />
            </div>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              theme === 'dark'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                {theme === 'dark' && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">Dark Mode</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Midnight slate aesthetic optimized for reduced eye strain
              </span>
            </div>

            {/* Mini preview bar */}
            <div className="mt-3.5 p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-slate-800 shadow-xs" />
              <div className="h-1.5 w-12 bg-slate-700 rounded-full" />
              <div className="h-1.5 w-6 bg-emerald-400 rounded-full ml-auto" />
            </div>
          </button>

          {/* System Auto Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              theme === 'system'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                {theme === 'system' && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">System Default</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {resolvedTheme}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Follows your computer's appearance settings automatically
              </span>
            </div>

            {/* Mini preview bar */}
            <div className="mt-3.5 p-2 rounded-lg bg-gradient-to-r from-slate-100 to-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-600">Light</span>
              <span className="text-[9px] font-bold text-slate-300">Dark</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
