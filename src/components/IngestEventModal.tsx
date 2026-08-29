import React, { useState } from 'react';
import { X, PlusCircle, CreditCard, User, AlertTriangle, Zap } from 'lucide-react';
import { FailureReason, PaymentMethod } from '../types';

interface IngestEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (data: {
    amount: number;
    failure_reason: FailureReason;
    failure_code?: string;
    failure_description?: string;
    payment_method?: PaymentMethod;
    customer_name?: string;
    customer_email?: string;
  }) => Promise<void>;
}

export const IngestEventModal: React.FC<IngestEventModalProps> = ({
  isOpen,
  onClose,
  onIngest,
}) => {
  const [amount, setAmount] = useState<number>(4999);
  const [failureReason, setFailureReason] = useState<FailureReason>('temporary_network_failure');
  const [failureCode, setFailureCode] = useState<string>('GATEWAY_TIMEOUT');
  const [failureDesc, setFailureDesc] = useState<string>('Issuer bank did not respond within 30000ms');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [customerName, setCustomerName] = useState<string>('Arjun Verma');
  const [customerEmail, setCustomerEmail] = useState<string>('arjun.verma@example.com');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleReasonChange = (reason: FailureReason) => {
    setFailureReason(reason);
    if (reason === 'temporary_network_failure') {
      setFailureCode('GATEWAY_TIMEOUT');
      setFailureDesc('Issuer bank did not respond within 30000ms');
    } else if (reason === 'bank_unavailable') {
      setFailureCode('BANK_DOWNTIME');
      setFailureDesc('HDFC Bank UPI switch experiencing intermittent downtime');
    } else if (reason === 'insufficient_funds') {
      setFailureCode('INSUFFICIENT_FUNDS');
      setFailureDesc('Customer account has insufficient funds');
    } else if (reason === 'expired_card') {
      setFailureCode('CARD_EXPIRED');
      setFailureDesc('Card expiry date is in the past (12/23)');
    } else {
      setFailureCode('AUTH_FAILED');
      setFailureDesc('Customer entered incorrect 3D Secure OTP');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onIngest({
        amount: Number(amount),
        failure_reason: failureReason,
        failure_code: failureCode,
        failure_description: failureDesc,
        payment_method: paymentMethod,
        customer_name: customerName,
        customer_email: customerEmail,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ingest Payment Failure Event</h2>
              <p className="text-[11px] text-slate-400">Simulate incoming webhook or real-time polling event</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Transaction Amount (₹)</label>
              <input
                type="number"
                min={100}
                max={500000}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="upi">UPI</option>
                <option value="card">Card (Credit/Debit)</option>
                <option value="netbanking">Net Banking</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Failure Reason & Diagnosis</label>
            <select
              value={failureReason}
              onChange={(e) => handleReasonChange(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="temporary_network_failure">Temporary Network Failure (High P)</option>
              <option value="bank_unavailable">Bank Downtime / Outage</option>
              <option value="insufficient_funds">Insufficient Funds (Balance)</option>
              <option value="expired_card">Card Expired (Payment Link Strategy)</option>
              <option value="authentication_failed">Authentication Failed (3DS)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Failure Code</label>
              <input
                type="text"
                value={failureCode}
                onChange={(e) => setFailureCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Customer Email</label>
            <input
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Failure Description</label>
            <input
              type="text"
              value={failureDesc}
              onChange={(e) => setFailureDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Ingesting Event...' : 'Ingest to Pipeline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
