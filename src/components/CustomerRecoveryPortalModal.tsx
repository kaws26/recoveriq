// RecoverIQ — Customer Self-Service 1-Click Recovery Portal Modal
import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  QrCode,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { RevenueRiskCase } from '../types';
import { formatINR } from '../lib/utils';

interface CustomerRecoveryPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskCase: RevenueRiskCase;
  onCompletePayment?: (caseId: string) => void;
}

export const CustomerRecoveryPortalModal: React.FC<CustomerRecoveryPortalModalProps> = ({
  isOpen,
  onClose,
  riskCase,
  onCompletePayment,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('customer@okhdfcbank');
  const [discountApplied, setDiscountApplied] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const originalAmount = riskCase.at_risk_amount;
  const discountAmount = discountApplied ? Math.round(originalAmount * 0.05) : 0;
  const payableAmount = originalAmount - discountAmount;
  const recoveryUrl = `https://pay.recoveriq.ai/rec_${riskCase.id}?token=rec_tok_${Date.now().toString(36)}`;

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      if (onCompletePayment) {
        onCompletePayment(riskCase.id);
      }
    }, 1200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(recoveryUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-sm">
              IQ
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                Apex Digital Technologies <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-slate-400">
                Secure 256-bit Encrypted Checkout
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {isPaid ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">Payment Successful!</h3>
                <p className="text-xs text-slate-600">
                  Transaction of <strong className="font-mono">{formatINR(payableAmount)}</strong> settled successfully.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-500">
                Ref ID: tx_rec_{Date.now().toString(36).toUpperCase()}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Portal
              </button>
            </div>
          ) : (
            <>
              {/* Bill Details Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Subscription Renewal:</span>
                  <span className="font-semibold text-slate-800">{riskCase.customer_name}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Original Invoice:</span>
                  <span className="font-mono line-through">{formatINR(originalAmount)}</span>
                </div>

                {discountApplied && (
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 5% Instant Recovery Incentive
                    </span>
                    <span>- {formatINR(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">Amount Due</span>
                  <span className="text-2xl font-black text-indigo-600 font-mono">
                    {formatINR(payableAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Choose Payment Method</label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedMethod('UPI')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedMethod === 'UPI'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-50 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span className="text-xs">Instant UPI</span>
                  </button>

                  <button
                    onClick={() => setSelectedMethod('CARD')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedMethod === 'CARD'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-50 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                    <span className="text-xs">Credit Card</span>
                  </button>

                  <button
                    onClick={() => setSelectedMethod('NETBANKING')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedMethod === 'NETBANKING'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-50 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                    <span className="text-xs">Netbanking</span>
                  </button>
                </div>
              </div>

              {/* Method Specific Form */}
              {selectedMethod === 'UPI' && (
                <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Scan UPI Dynamic QR</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-100 px-2 py-0.5 rounded">
                      GPay / PhonePe / Paytm
                    </span>
                  </div>

                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="w-20 h-20 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0">
                      <QrCode className="w-14 h-14" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-900">1-Click QR Checkout</div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Scan from any UPI application on your smartphone to complete the renewal.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Or Enter VPA (Virtual Payment Address)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedMethod === 'CARD' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Card Number</label>
                    <input
                      type="text"
                      defaultValue="•••• •••• •••• 4242"
                      className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700">Expiry</label>
                      <input
                        type="text"
                        defaultValue="08/29"
                        className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">CVV</label>
                      <input
                        type="password"
                        defaultValue="•••"
                        className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'NETBANKING' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <label className="font-semibold text-slate-700">Select Bank</label>
                  <select className="w-full p-2.5 bg-white rounded-xl border border-slate-200">
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>State Bank of India</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay {formatINR(payableAmount)} Securely
                  </>
                )}
              </button>

              {/* Shareable Link Box */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono truncate max-w-[280px]">{recoveryUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
