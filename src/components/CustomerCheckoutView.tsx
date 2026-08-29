import React, { useState, useEffect } from 'react';
import { CustomerCheckoutSession, FailureReason, PaymentMethod } from '../types';
import * as api from '../lib/api';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerCheckoutViewProps {
  paymentId: string;
  onReturnToDashboard?: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const CustomerCheckoutView: React.FC<CustomerCheckoutViewProps> = ({
  paymentId,
  onReturnToDashboard,
}) => {
  const [session, setSession] = useState<CustomerCheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outcome, setOutcome] = useState<'success' | 'failed' | null>(null);
  const [outcomeMessage, setOutcomeMessage] = useState<string>('');

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const data = await api.fetchCheckoutSession(paymentId);
        setSession(data);
        if (data.status === 'captured') {
          setOutcome('success');
          setOutcomeMessage('This payment was already successfully completed.');
        }
      } catch (err: any) {
        setError(err.message || 'Payment link not found or expired.');
      } finally {
        setLoading(false);
      }
    }
    if (paymentId) {
      loadSession();
    }
  }, [paymentId]);

  // Launch official Razorpay Checkout modal in Test Mode if key is configured
  const handleLaunchRazorpay = () => {
    if (!session) return;

    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => initRazorpayModal();
      document.body.appendChild(script);
    } else {
      initRazorpayModal();
    }
  };

  const initRazorpayModal = () => {
    if (!session || !window.Razorpay) return;

    const options = {
      key: session.razorpay_key_id || 'rzp_test_demo12345',
      amount: Math.round(session.amount * 100),
      currency: session.currency || 'INR',
      name: session.merchant_name,
      description: session.description,
      order_id: session.razorpay_order_id,
      prefill: {
        name: session.customer_name,
        email: session.customer_email,
        contact: session.customer_phone,
      },
      theme: {
        color: '#0f172a',
      },
      handler: async (response: any) => {
        setIsProcessing(true);
        try {
          await api.completeCheckoutPayment(session.payment_id, {
            status: 'captured',
            provider_payment_id: response.razorpay_payment_id,
            payment_method: 'card',
          });
          setOutcome('success');
          setOutcomeMessage('Payment of ₹' + session.amount.toLocaleString('en-IN') + ' completed successfully via Razorpay Test Mode!');
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (err: any) {
          setError(err.message || 'Payment confirmation error');
        } finally {
          setIsProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          console.log('Checkout dismissed');
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response: any) => {
        setIsProcessing(true);
        try {
          await api.completeCheckoutPayment(session.payment_id, {
            status: 'failed',
            failure_reason: 'temporary_network_failure',
            failure_code: response.error?.code || 'BAD_REQUEST_ERROR',
            failure_description: response.error?.description || 'Payment failed via Razorpay Test Checkout',
            provider_payment_id: response.error?.metadata?.payment_id || `pay_${Date.now()}`,
          });
          setOutcome('failed');
          setOutcomeMessage('Your payment could not be processed. Our merchant system has been notified.');
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsProcessing(false);
        }
      });
      rzp.open();
    } catch (e: any) {
      console.error('Razorpay popup error:', e);
    }
  };

  // Direct Test Instrument Execution
  const handleTestInstrument = async (
    status: 'captured' | 'failed',
    failureReason?: FailureReason,
    failureCode?: string,
    failureDesc?: string,
    method: PaymentMethod = 'upi'
  ) => {
    if (!session) return;
    setIsProcessing(true);
    setError(null);

    try {
      if (status === 'captured') {
        await api.completeCheckoutPayment(session.payment_id, {
          status: 'captured',
          payment_method: method,
          provider_payment_id: `rzp_test_cap_${Date.now()}`,
        });
        setOutcome('success');
        setOutcomeMessage(`Payment of ₹${session.amount.toLocaleString('en-IN')} was authorized and captured successfully.`);
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      } else {
        await api.completeCheckoutPayment(session.payment_id, {
          status: 'failed',
          failure_reason: failureReason || 'temporary_network_failure',
          failure_code: failureCode || 'GATEWAY_TIMEOUT',
          failure_description: failureDesc || 'Payment failed during test processing',
          payment_method: method,
          provider_payment_id: `rzp_test_fail_${Date.now()}`,
        });
        setOutcome('failed');
        setOutcomeMessage(
          failureDesc ||
            'The payment attempt could not be authorized by your bank. Please choose another payment method or try again.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error processing transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto" />
          <h2 className="text-lg font-semibold text-white">Loading Secure Checkout...</h2>
          <p className="text-xs text-slate-400">Verifying session credentials and cryptographic keys</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-white">Checkout Link Expired</h2>
          <p className="text-xs text-slate-400">{error}</p>
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition"
            >
              Return to Merchant Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter']">
      {/* Merchant Dev Mode Header Switcher */}
      {onReturnToDashboard && (
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20 uppercase tracking-wider text-[10px]">
              Customer Checkout Environment
            </span>
            <span className="text-slate-400 hidden sm:inline">
              Testing checkout experience for <strong className="text-slate-200">{session.merchant_name}</strong>
            </span>
          </div>
          <button
            onClick={onReturnToDashboard}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium transition border border-slate-700"
          >
            <span>Return to RecoverIQ Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </header>
      )}

      {/* Main Checkout Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Order Summary & Merchant Profile */}
          <section className="lg:col-span-5 bg-slate-900/60 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                  {session.merchant_name.charAt(0)}
                </div>
                <div>
                  <h1 className="font-semibold text-white text-base leading-tight">{session.merchant_name}</h1>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                    Verified Merchant Account
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Order Description</p>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800 text-xs text-slate-300">
                  {session.description}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Customer</span>
                  <span className="text-slate-200 font-medium">{session.customer_name}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Email</span>
                  <span className="text-slate-200 font-medium">{session.customer_email}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Reference ID</span>
                  <span className="font-mono text-slate-300 text-[11px]">{session.payment_id}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Total Payable</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white font-mono tracking-tight">
                    ₹{session.amount.toLocaleString('en-IN')}.00
                  </div>
                  <span className="text-[10px] text-slate-400">{session.currency} (All taxes included)</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>256-bit SSL encrypted secure checkout</span>
              </div>
            </div>
          </section>

          {/* Right Column: Interactive Test Payment & Outcome */}
          <section className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-900">
            {outcome === 'success' ? (
              <div className="my-auto text-center space-y-5 py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-in zoom-in-50">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">{outcomeMessage}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 text-xs font-mono text-slate-400 text-left space-y-1.5 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span>Payment ID:</span>
                    <span className="text-slate-200">{session.payment_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-400 font-semibold">₹{session.amount.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-emerald-400">CAPTURED & SETTLED</span>
                  </div>
                </div>

                {onReturnToDashboard && (
                  <button
                    onClick={onReturnToDashboard}
                    className="w-full max-w-sm mx-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                  >
                    <span>View Ledger in Merchant Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : outcome === 'failed' ? (
              <div className="my-auto text-center space-y-5 py-6">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto animate-in zoom-in-50">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Payment Declined</h2>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">{outcomeMessage}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 text-xs text-slate-300 max-w-sm mx-auto text-left">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 If this was an inadvertent error, you can choose another card, UPI ID, or netbanking account below.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto w-full">
                  <button
                    onClick={() => {
                      setOutcome(null);
                      setOutcomeMessage('');
                    }}
                    className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Another Method</span>
                  </button>

                  {onReturnToDashboard && (
                    <button
                      onClick={onReturnToDashboard}
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                      <span>Observe RecoverIQ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-white">Choose Payment Method</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select an official Razorpay Test Mode modal or simulate a specific payment instrument outcome.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Primary Action: Official Razorpay Test Mode Checkout */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-500 text-white flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">Official Razorpay Test Mode</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-medium">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Triggers the real Razorpay Test Mode Checkout modal with sample OTPs, cards, and UPI handlers.
                  </p>
                  <button
                    disabled={isProcessing}
                    onClick={handleLaunchRazorpay}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 disabled:opacity-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch Razorpay Test Checkout</span>
                  </button>
                </div>

                {/* Direct Scenario Test Instruments */}
                <div className="space-y-2.5">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                    Simulate Specific Payment Failure Scenarios
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleTestInstrument(
                          'failed',
                          'temporary_network_failure',
                          'NPCI_GATEWAY_TIMEOUT',
                          'UPI transaction timed out while communicating with NPCI switch.',
                          'upi'
                        )
                      }
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-start gap-2.5 group disabled:opacity-50"
                    >
                      <Smartphone className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-slate-200 block group-hover:text-white">
                          UPI - Network Timeout
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          High likelihood of auto recovery (85%)
                        </span>
                      </div>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleTestInstrument(
                          'failed',
                          'insufficient_funds',
                          'INSUFFICIENT_FUNDS_DECLINE',
                          'Card declined due to insufficient account balance.',
                          'card'
                        )
                      }
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-start gap-2.5 group disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-slate-200 block group-hover:text-white">
                          Card - Insufficient Funds
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Smart delay scheduled for salary day
                        </span>
                      </div>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleTestInstrument(
                          'failed',
                          'bank_unavailable',
                          'HDFC_SWITCH_DOWN',
                          'Issuer core banking system undergoing scheduled maintenance.',
                          'netbanking'
                        )
                      }
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-start gap-2.5 group disabled:opacity-50"
                    >
                      <Building2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-slate-200 block group-hover:text-white">
                          Bank - Core Switch Down
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Monitors bank health & retries
                        </span>
                      </div>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleTestInstrument(
                          'failed',
                          'expired_card',
                          'CARD_EXPIRED_DECLINE',
                          'The payment instrument expired on 08/26.',
                          'card'
                        )
                      }
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-start gap-2.5 group disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-slate-200 block group-hover:text-white">
                          Card - Expired Instrument
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Halts retry & triggers update link
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Success Simulation */}
                <div className="pt-2">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleTestInstrument('captured', undefined, undefined, undefined, 'upi')}
                    className="w-full py-2.5 px-4 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 border border-emerald-500/30 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Settle Instantly (Success)</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-800/60">
        <span>Powered by RecoverIQ Payment Recovery Infrastructure • Razorpay Test Mode Certified</span>
      </footer>
    </div>
  );
};
