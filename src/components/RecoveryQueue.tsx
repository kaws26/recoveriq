import React, { useState } from 'react';
import {
  ListOrdered,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Zap,
  Bot,
  Eye,
  BadgeAlert,
  ArrowUpDown,
} from 'lucide-react';
import { RevenueRiskCase, CaseStatus, RecoveryActionType } from '../types';
import { formatINR, formatDate, timeAgo, cn } from '../lib/utils';

interface RecoveryQueueProps {
  cases: RevenueRiskCase[];
  onSelectCase: (c: RevenueRiskCase) => void;
  onAnalyze: (caseId: string) => Promise<void>;
  onExecute: (caseId: string, action?: RecoveryActionType) => Promise<void>;
  onOpenDetailModal: (c: RevenueRiskCase) => void;
  onOpenCommandCenter: () => void;
}

export const RecoveryQueue: React.FC<RecoveryQueueProps> = ({
  cases,
  onSelectCase,
  onAnalyze,
  onExecute,
  onOpenDetailModal,
  onOpenCommandCenter,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'probability'>('date');

  const filteredCases = cases.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.payment_id.toLowerCase().includes(q) ||
        (c.customer?.name.toLowerCase().includes(q)) ||
        (c.payment?.failure_reason.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'amount') return b.at_risk_amount - a.at_risk_amount;
    if (sortBy === 'probability') return (b.ml_score?.probability || 0) - (a.ml_score?.probability || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const statuses = ['ALL', 'PENDING', 'SCORED', 'DECIDED', 'SCHEDULED', 'ESCALATED', 'SUCCEEDED', 'BLOCKED'];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-white">Live Recovery Priority Queue</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline of at-risk transactions queued for automated or escalated recovery.
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="date">Sort: Recent</option>
            <option value="amount">Sort: Amount (High to Low)</option>
            <option value="probability">Sort: ML Probability</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border',
              filterStatus === st
                ? 'bg-slate-800 text-emerald-400 border-slate-700 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-900 hover:bg-slate-900 hover:text-slate-300',
            )}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Payment & Case</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">At-Risk Value</th>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4">ML Prob</th>
                <th className="py-3 px-4">AI Recommendation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-100">{c.payment_id}</div>
                      <div className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{c.customer?.name || 'Customer'}</div>
                      <div className="text-[10px] text-slate-400">{c.customer?.phone || c.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold font-['JetBrains_Mono'] text-white">
                        {formatINR(c.at_risk_amount)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">{c.payment?.payment_method}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-300 capitalize">
                        {c.payment?.failure_reason.replace(/_/g, ' ')}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{c.payment?.failure_code}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.ml_score ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-400">
                            {(c.ml_score.probability * 100).toFixed(0)}%
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                            {c.ml_score.risk_band === 'HIGH_PROBABILITY' ? 'HIGH' : 'MED'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.ai_decision ? (
                        <div className="text-slate-300">
                          <span className="font-semibold text-indigo-300 block">
                            {c.ai_decision.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block max-w-[140px]" title={c.ai_decision.explanation}>
                            {c.ai_decision.explanation}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not Analyzed</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[10px] font-semibold border inline-block whitespace-nowrap',
                          c.status === 'SUCCEEDED' && 'bg-emerald-950 text-emerald-300 border-emerald-800',
                          c.status === 'BLOCKED' && 'bg-rose-950 text-rose-300 border-rose-800',
                          c.status === 'ESCALATED' && 'bg-amber-950 text-amber-300 border-amber-800',
                          c.status === 'DECIDED' && 'bg-indigo-950 text-indigo-300 border-indigo-800',
                          c.status === 'SCORED' && 'bg-blue-950 text-blue-300 border-blue-800',
                          c.status === 'PENDING' && 'bg-slate-800 text-slate-300 border-slate-700',
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === 'PENDING' && (
                          <button
                            onClick={() => onAnalyze(c.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                          >
                            Analyze
                          </button>
                        )}

                        {(c.status === 'DECIDED' || c.status === 'SCORED') && (
                          <button
                            onClick={() => onExecute(c.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                          >
                            Execute
                          </button>
                        )}

                        <button
                          onClick={() => onOpenDetailModal(c)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          title="View Case Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
