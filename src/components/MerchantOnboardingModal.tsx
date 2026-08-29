import React, { useState } from 'react';
import * as api from '../lib/api';
import {
  Building2,
  KeyRound,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PolicyConfig } from '../types';

interface MerchantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { paymentId?: string }) => void;
  currentPolicy?: PolicyConfig | null;
}

export const MerchantOnboardingModal: React.FC<MerchantOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentPolicy,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Company Profile
  const [companyName, setCompanyName] = useState('Apex Technologies Pvt Ltd');
  const [businessEmail, setBusinessEmail] = useState('billing@apextech.in');
  const [country, setCountry] = useState('India');
  const [currency, setCurrency] = useState('INR');

  // Step 2: Razorpay Test Mode
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [keyErrorMsg, setKeyErrorMsg] = useState('');

  // Step 3: Policy Guardrails
  const [maxRetries, setMaxRetries] = useState(currentPolicy?.max_retries || 3);
  const [maxAutoAmount, setMaxAutoAmount] = useState(currentPolicy?.max_auto_recovery_amount || 25000);
  const [highValueThreshold, setHighValueThreshold] = useState(currentPolicy?.high_value_review_threshold || 10000);

  // Step 4: First Test Payment
  const [amount, setAmount] = useState(4999);
  const [customerName, setCustomerName] = useState('Rohan Verma');
  const [customerEmail, setCustomerEmail] = useState('rohan.verma@example.com');
  const [description, setDescription] = useState('Enterprise Growth Plan — Annual');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestRazorpayConnection = async () => {
    if (!keyId || !keySecret) {
      setKeyErrorMsg('Please enter both Key ID and Secret.');
      setKeyStatus('error');
      return;
    }
    setIsVerifyingKey(true);
    setKeyErrorMsg('');
    try {
      await api.connectRazorpay(keyId, keySecret);
      setKeyStatus('connected');
    } catch (err: any) {
      setKeyStatus('error');
      setKeyErrorMsg(err.message || 'Connection failed.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleCreateFirstPayment = async () => {
    setIsCreatingPayment(true);
    try {
      // Save company profile
      await api.registerCompany({
        company_name: companyName,
        business_email: businessEmail,
        country,
        currency,
      });

      // Save policy
      await api.updatePolicyConfig({
        max_retries: Number(maxRetries),
        max_auto_recovery_amount: Number(maxAutoAmount),
        high_value_review_threshold: Number(highValueThreshold),
      });

      // Create test payment
      const res = await api.createPayment({
        amount: Number(amount),
        currency,
        customer_name: customerName,
        customer_email: customerEmail,
        description,
      });

      setCreatedPaymentId(res.payment.id);
      onComplete({ paymentId: res.payment.id });
    } catch (err: any) {
      alert(err.message || 'Failed to complete onboarding');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Merchant Onboarding & Setup</h2>
              <p className="text-xs text-slate-500">Configure your company, payment gateway, and recovery rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Step Indicator */}
        <nav aria-label="Onboarding Steps" className="px-6 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-4 gap-2 text-xs">
          <div
            className={`flex items-center gap-1.5 font-medium ${
              currentStep >= 1 ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className="truncate">Company</span>
          </div>

          <div
            className={`flex items-center gap-1.5 font-medium ${
              currentStep >= 2 ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className="truncate">Razorpay</span>
          </div>

          <div
            className={`flex items-center gap-1.5 font-medium ${
              currentStep >= 3 ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span className="truncate">Policy</span>
          </div>

          <div
            className={`flex items-center gap-1.5 font-medium ${
              currentStep >= 4 ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              4
            </span>
            <span className="truncate">First Payment</span>
          </div>
        </nav>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Step 1: Company Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up your business entity details for ledger records and customer-facing checkouts.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company / Legal Entity Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Acme Corp Solutions Pvt Ltd"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Business Finance Email</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="finance@acmecorp.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Operating Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="India">India (IN)</option>
                      <option value="Singapore">Singapore (SG)</option>
                      <option value="United States">United States (US)</option>
                      <option value="United Kingdom">United Kingdom (UK)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Base Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="SGD">SGD (S$) - Singapore Dollar</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Step 2: Connect Razorpay Test Mode</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link your Razorpay Test Key to enable real test mode order generation, retry executions, and polling.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Secure Server-Side Credential Handling</span>
                </div>
                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                  Your credentials are tested securely on our server against official Razorpay Test API. Secrets are never exposed to browser clients.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Razorpay Test Key ID</label>
                  <input
                    type="text"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="rzp_test_..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Razorpay Test Key Secret</label>
                  <input
                    type="password"
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••••••••••"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isVerifyingKey || !keyId || !keySecret}
                    onClick={handleTestRazorpayConnection}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isVerifyingKey ? (
                      <>
                        <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        <span>Verifying with Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Connect & Test Key</span>
                      </>
                    )}
                  </button>

                  {keyStatus === 'connected' && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected & Verified Healthy
                    </span>
                  )}

                  {keyStatus === 'error' && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {keyErrorMsg || 'Connection failed'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-2">
                  Tip: You can find test API keys in your Razorpay Dashboard &rarr; Settings &rarr; API Keys &rarr; Generate Test Key.
                  You can also continue using simulation if you do not have Razorpay test keys handy.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Step 3: Recovery Guardrails & Limits</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establish safety boundaries so AI models strictly operate within your merchant authorization bounds.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="font-medium text-slate-700">Maximum Automated Retries</label>
                    <span className="font-semibold text-blue-600">{maxRetries} attempts</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hard cap on automatic retry attempts per customer transaction to prevent card network fatigue.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    High-Value Human Review Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={highValueThreshold}
                    onChange={(e) => setHighValueThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Transactions exceeding this amount will pause automatic retry and require Finance Specialist authorization.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Maximum Auto-Recovery Amount Ceiling (₹)
                  </label>
                  <input
                    type="number"
                    value={maxAutoAmount}
                    onChange={(e) => setMaxAutoAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Absolute maximum transaction ceiling eligible for AI-driven automated recovery.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Step 4: Create Your First Test Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate a test payment and launch the customer checkout experience to test recovery live.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Order Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Order Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-blue-600/10"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              disabled={isCreatingPayment}
              onClick={handleCreateFirstPayment}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-600/10 disabled:opacity-50"
            >
              {isCreatingPayment ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Creating Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete Setup & Launch Test</span>
                </>
              )}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
