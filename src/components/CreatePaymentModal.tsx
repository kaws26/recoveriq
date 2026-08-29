import React, { useState } from 'react';
import * as api from '../lib/api';
import {
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentCreated: (paymentId: string) => void;
  onOpenCheckout?: (paymentId: string) => void;
}

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentCreated,
  onOpenCheckout,
}) => {
  const [amount, setAmount] = useState<number>(4999);
  const [currency, setCurrency] = useState('INR');
  const [customerName, setCustomerName] = useState('Ananya Sharma');
  const [customerEmail, setCustomerEmail] = useState('ananya.sharma@example.com');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  const [description, setDescription] = useState('SaaS Cloud Tier 2 Subscription');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPayment, setCreatedPayment] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (!customerName || !customerEmail) {
      setError('Customer name and email are required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.createPayment({
        amount: Number(amount),
        currency,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        description,
      });

      setCreatedPayment(res.payment);
      onPaymentCreated(res.payment.id);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      setError(err.message || 'Failed to create payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdPayment) return;
    const url = `${window.location.origin}/pay/${createdPayment.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLaunchCheckout = () => {
    if (!createdPayment) return;
    onClose();
    if (onOpenCheckout) {
      onOpenCheckout(createdPayment.id);
    } else {
      window.open(`/pay/${createdPayment.id}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {createdPayment ? 'Payment Created' : 'Create Real Test Payment'}
              </h2>
              <p className="text-xs text-slate-500">
                {createdPayment
                  ? 'Payment order ready for customer checkout'
                  : 'Generate a payment link with Razorpay Test Mode mapping'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Content */}
        <div className="p-6 space-y-4">
          {createdPayment ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Status: PENDING CHECKOUT</span>
                  <span className="text-xs font-mono font-bold text-emerald-800">
                    ₹{createdPayment.amount.toLocaleString('en-IN')}.00
                  </span>
                </div>
                <p className="text-xs text-emerald-700">
                  Payment order created for <strong>{createdPayment.customer?.name || customerName}</strong>. Open the checkout link below to test the transaction outcome.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">Customer Checkout Link</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    type="text"
                    value={`${window.location.origin}/pay/${createdPayment.id}`}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleLaunchCheckout}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
                >
                  <span>Open Customer Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="4999"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Ananya Sharma"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ananya@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="+919876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Order / Item Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Annual Enterprise Subscription"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-blue-600/10 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Payment & Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
