import React, { useState } from 'react';
import {
  X,
  Plus,
  AlertTriangle,
  CreditCard,
  Building2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { FailureReason, PaymentMethod } from '../types';
import { formatINR } from '../lib/utils';

interface RecordFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (params: {
    amount: number;
    failure_reason: FailureReason;
    failure_code?: string;
    failure_description?: string;
    payment_method?: PaymentMethod;
    customer_name?: string;
    customer_email?: string;
  }) => Promise<void>;
}

export const RecordFailureModal: React.FC<RecordFailureModalProps> = ({
  isOpen,
  onClose,
  onIngest,
}) => {
  const [amount, setAmount] = useState<number>(4999);
  const [customerName, setCustomerName] = useState('Rahul Verma');
  const [customerEmail, setCustomerEmail] = useState('rahul.verma@example.com');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [failureReason, setFailureReason] = useState<FailureReason>('temporary_network_failure');
  const [failureCode, setFailureCode] = useState('GATEWAY_TIMEOUT');
  const [failureDescription, setFailureDescription] = useState(
    'NPCI UPI Gateway response timeout during collect request'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      label: 'NPCI UPI Network Timeout (₹4,999)',
      amount: 4999,
      method: 'upi' as PaymentMethod,
      reason: 'temporary_network_failure' as FailureReason,
      code: 'GATEWAY_TIMEOUT',
      desc: 'NPCI UPI Gateway response timeout during collect request',
    },
    {
      label: 'HDFC Issuer Downtime (₹38,500)',
      amount: 38500,
      method: 'card' as PaymentMethod,
      reason: 'bank_unavailable' as FailureReason,
      code: 'HDFC_CORE_BANKING_DOWN',
      desc: 'Issuer bank host offline for maintenance',
    },
    {
      label: 'Insufficient Balance (₹7,499)',
      amount: 7499,
      method: 'upi' as PaymentMethod,
      reason: 'insufficient_funds' as FailureReason,
      code: 'UPI_INSUFFICIENT_FUNDS',
      desc: 'Account balance below required debit amount',
    },
    {
      label: 'Expired Card (₹2,999)',
      amount: 2999,
      method: 'card' as PaymentMethod,
      reason: 'expired_card' as FailureReason,
      code: 'CARD_EXPIRED',
      desc: 'Customer credit card expired before subscription charge',
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setAmount(p.amount);
    setPaymentMethod(p.method);
    setFailureReason(p.reason);
    setFailureCode(p.code);
    setFailureDescription(p.desc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onIngest({
        amount,
        failure_reason: failureReason,
        failure_code: failureCode,
        failure_description: failureDescription,
        payment_method: paymentMethod,
        customer_name: customerName,
        customer_email: customerEmail,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to record event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Record Failed Payment Event
            </h2>
            <p className="text-xs text-slate-500">
              Ingest an incoming payment failure to evaluate diagnostic and recovery workflows.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Quick Ingestion Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 text-[11px] font-medium text-slate-800 transition-colors truncate"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Transaction Amount (INR)
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-['JetBrains_Mono'] text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="upi">UPI (Collect / AutoPay)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="netbanking">Netbanking</option>
                <option value="mandate">Subscription Mandate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Customer Email
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Failure Reason
            </label>
            <select
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value as FailureReason)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="temporary_network_failure">Temporary Network Timeout</option>
              <option value="bank_unavailable">Issuer Bank Offline / Downtime</option>
              <option value="insufficient_funds">Insufficient Account Balance</option>
              <option value="expired_card">Expired Card / Token</option>
              <option value="authentication_failed">2FA Verification Challenge Expired</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Gateway Failure Description
            </label>
            <input
              type="text"
              value={failureDescription}
              onChange={(e) => setFailureDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
            >
              {isSubmitting ? 'Ingesting...' : 'Record Payment Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
