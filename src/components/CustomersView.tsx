import React, { useState } from 'react';
import {
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  TrendingUp,
  X,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { Customer, Payment, RevenueRiskCase } from '../types';
import { formatINR, cn, formatDate, timeAgo } from '../lib/utils';

interface CustomersViewProps {
  customers: Customer[];
  payments: Payment[];
  cases: RevenueRiskCase[];
  onSelectCase: (riskCase: RevenueRiskCase) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  payments,
  cases,
  onSelectCase,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  const getCustomerPayments = (customerId: string) => {
    return payments.filter((p) => p.customer_id === customerId);
  };

  const getCustomerCases = (customerId: string) => {
    return cases.filter((c) => c.customer_id === customerId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
          Customers
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor customer payment health, lifetime value, and historical recovery rates.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Lifetime Value</th>
                <th className="py-3 px-4">Success Rate</th>
                <th className="py-3 px-4">Total Payments</th>
                <th className="py-3 px-4">Failed</th>
                <th className="py-3 px-4">Recovered</th>
                <th className="py-3 px-4">Recovery Rate</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map((cust) => {
                const custPayments = getCustomerPayments(cust.id);
                const custCases = getCustomerCases(cust.id);
                const hasPendingCase = custCases.some((c) => c.status !== 'SUCCEEDED');

                return (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                          {cust.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{cust.name}</span>
                            {hasPendingCase && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="At-risk transaction detected"></span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{cust.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 font-['JetBrains_Mono']">
                      {formatINR(cust.lifetime_value)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-emerald-700">
                        {Math.round(cust.payment_success_rate * 100)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {cust.total_transactions}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={cn('font-semibold', cust.failed_transactions > 0 ? 'text-rose-600' : 'text-slate-500')}>
                        {cust.failed_transactions}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-emerald-700">
                        {cust.recovered_transactions}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {Math.round(cust.recovery_rate * 100)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(cust);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold text-slate-800 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
            onClick={() => setSelectedCustomer(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Customer Profile
                </span>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                  {selectedCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h2>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.email}
                    </span>
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Lifetime Value</span>
                  <span className="text-base font-bold text-slate-900 font-['JetBrains_Mono']">
                    {formatINR(selectedCustomer.lifetime_value)}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 block text-[11px]">Recovery Success Rate</span>
                  <span className="text-base font-bold text-emerald-700">
                    {Math.round(selectedCustomer.recovery_rate * 100)}%
                  </span>
                </div>
              </div>

              {/* Transactions History */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Payment History & At-Risk Transactions
                </h3>
                <div className="space-y-2">
                  {getCustomerPayments(selectedCustomer.id).map((p) => {
                    const linkedCase = cases.find((c) => c.payment_id === p.id);
                    const isRec = p.status === 'captured' || linkedCase?.status === 'SUCCEEDED';

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (linkedCase) {
                            setSelectedCustomer(null);
                            onSelectCase(linkedCase);
                          }
                        }}
                        className={cn(
                          'p-3 rounded-lg border transition-colors flex items-center justify-between',
                          linkedCase ? 'cursor-pointer hover:bg-slate-50' : 'bg-slate-50',
                          isRec ? 'border-slate-200' : 'border-amber-200 bg-amber-50/30'
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900">{p.id}</span>
                            <span className="uppercase text-[10px] text-slate-500 font-semibold px-1.5 py-0.2 rounded bg-slate-200/60">
                              {p.payment_method}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.failure_reason ? p.failure_reason.replace(/_/g, ' ') : 'Standard Capture'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 font-mono">{formatINR(p.amount)}</div>
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5',
                              isRec
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            )}
                          >
                            {isRec ? 'Recovered' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
