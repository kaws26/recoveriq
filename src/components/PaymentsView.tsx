import React, { useState } from 'react';
import {
  Search,
  Filter,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Download,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Payment, RevenueRiskCase } from '../types';
import { formatINR, cn, formatDate, timeAgo } from '../lib/utils';

interface PaymentsViewProps {
  payments: Payment[];
  cases: RevenueRiskCase[];
  onSelectPaymentCase: (riskCase: RevenueRiskCase) => void;
  onSelectPaymentWithoutCase?: (payment: Payment) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  cases,
  onSelectPaymentCase,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (methodFilter !== 'ALL' && p.payment_method !== methodFilter) return false;
    if (reasonFilter !== 'ALL' && p.failure_reason !== reasonFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = p.id.toLowerCase().includes(q);
      const matchCust = p.customer?.name.toLowerCase().includes(q);
      const matchEmail = p.customer?.email.toLowerCase().includes(q);
      const matchCode = p.failure_code.toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchEmail && !matchCode) return false;
    }
    return true;
  });

  const getCaseForPayment = (paymentId: string): RevenueRiskCase | undefined => {
    return cases.find((c) => c.payment_id === paymentId);
  };

  const handleRowClick = (p: Payment) => {
    const foundCase = getCaseForPayment(p.id);
    if (foundCase) {
      onSelectPaymentCase(foundCase);
    } else {
      // Build a lightweight virtual case for standard inspection
      const tempCase: RevenueRiskCase = {
        id: `case_${p.id}`,
        merchant_id: p.merchant_id,
        payment_id: p.id,
        payment: p,
        customer: p.customer,
        status: p.status === 'captured' ? 'SUCCEEDED' : 'PENDING',
        priority: 'MEDIUM',
        at_risk_amount: p.amount,
        recovered_amount: p.status === 'captured' ? p.amount : 0,
        execution_source: 'simulation',
        recovery_attempts: p.retry_count,
        tags: [p.payment_method, p.failure_reason],
        created_at: p.created_at,
        updated_at: p.created_at,
      };
      onSelectPaymentCase(tempCase);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            Payments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, monitor, and recover transactions across all payment methods and gateway states.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Payment ID, customer, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="failed">Failed</option>
              <option value="captured">Captured / Recovered</option>
              <option value="pending">Pending</option>
            </select>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Methods</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Netbanking</option>
              <option value="mandate">Subscription Mandate</option>
            </select>

            {/* Failure Reason Filter */}
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Issues</option>
              <option value="temporary_network_failure">Network Glitch</option>
              <option value="bank_unavailable">Bank Downtime</option>
              <option value="insufficient_funds">Insufficient Balance</option>
              <option value="expired_card">Expired Card</option>
              <option value="authentication_failed">2FA Timeout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Issue / Reason</th>
                <th className="py-3 px-4">Occurred</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const associatedCase = getCaseForPayment(p.id);
                  const isRecovered = p.status === 'captured' || associatedCase?.status === 'SUCCEEDED';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleRowClick(p)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {p.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.customer?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{p.customer?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-['JetBrains_Mono']">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="uppercase text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                            isRecovered
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {isRecovered ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Recovered</span>
                            </>
                          ) : p.status === 'failed' ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Failed</span>
                            </>
                          ) : (
                            <span>{p.status}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium text-slate-800">
                          {p.failure_reason.replace(/_/g, ' ')}
                        </span>
                        {p.failure_code && (
                          <span className="block text-[10px] font-mono text-slate-400">
                            {p.failure_code}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {timeAgo(p.occurred_at || p.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(p);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                        >
                          {isRecovered ? 'View' : 'Recover'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
