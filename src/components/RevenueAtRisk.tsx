import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  CreditCard,
  Building,
  Smartphone,
} from 'lucide-react';
import { RevenueRiskCase } from '../types';
import { formatINR, formatDate, timeAgo, cn } from '../lib/utils';

interface RevenueAtRiskProps {
  cases: RevenueRiskCase[];
  onSelectCase: (c: RevenueRiskCase) => void;
  onOpenDetailModal: (c: RevenueRiskCase) => void;
  onOpenCommandCenter: () => void;
}

export const RevenueAtRisk: React.FC<RevenueAtRiskProps> = ({
  cases,
  onSelectCase,
  onOpenDetailModal,
  onOpenCommandCenter,
}) => {
  const [search, setSearch] = useState('');

  const filtered = cases.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.payment_id.toLowerCase().includes(q) ||
      c.customer?.name.toLowerCase().includes(q) ||
      c.payment?.failure_reason.toLowerCase().includes(q)
    );
  });

  const totalAtRisk = cases.reduce((sum, c) => sum + c.at_risk_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <h1 className="text-lg font-bold text-white">Revenue at Risk Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Total of {formatINR(totalAtRisk)} across {cases.length} at-risk transactions under active protection.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 w-64"
          />
        </div>
      </div>

      {/* Grid of Transaction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-100 text-sm">{c.payment_id}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(c.created_at)}</p>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    c.status === 'SUCCEEDED' && 'bg-emerald-950 text-emerald-300 border-emerald-800',
                    c.status === 'BLOCKED' && 'bg-rose-950 text-rose-300 border-rose-800',
                    c.status === 'ESCALATED' && 'bg-amber-950 text-amber-300 border-amber-800',
                    c.status === 'DECIDED' && 'bg-indigo-950 text-indigo-300 border-indigo-800',
                    c.status === 'PENDING' && 'bg-slate-800 text-slate-300 border-slate-700',
                  )}
                >
                  {c.status}
                </span>
              </div>

              {/* Amount */}
              <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">At-Risk Value</span>
                  <span className="text-xl font-bold text-white font-['JetBrains_Mono']">
                    {formatINR(c.at_risk_amount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Method</span>
                  <span className="text-xs font-semibold text-slate-300 uppercase">
                    {c.payment?.payment_method || 'UPI'}
                  </span>
                </div>
              </div>

              {/* Customer & Failure */}
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-semibold text-slate-200">{c.customer?.name || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reason:</span>
                  <span className="font-medium text-rose-300 truncate max-w-[170px]" title={c.payment?.failure_description}>
                    {c.payment?.failure_reason.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ML Likelihood:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {c.ml_score ? `${(c.ml_score.probability * 100).toFixed(0)}%` : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  onSelectCase(c);
                  onOpenCommandCenter();
                }}
                className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-center"
              >
                Analyze in AI Hub
              </button>
              <button
                onClick={() => onOpenDetailModal(c)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="View Details"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
