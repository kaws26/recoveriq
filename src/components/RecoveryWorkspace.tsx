import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  DollarSign,
  Filter,
  Check,
} from 'lucide-react';
import { RevenueRiskCase, CaseStatus } from '../types';
import { formatINR, cn, timeAgo } from '../lib/utils';

interface RecoveryWorkspaceProps {
  cases: RevenueRiskCase[];
  onSelectCase: (riskCase: RevenueRiskCase) => void;
  onQuickRecover?: (caseId: string) => void;
}

type RecoveryTab = 'all' | 'needs_action' | 'scheduled' | 'in_progress' | 'recovered' | 'failed' | 'escalated';

export const RecoveryWorkspace: React.FC<RecoveryWorkspaceProps> = ({
  cases,
  onSelectCase,
  onQuickRecover,
}) => {
  const [activeTab, setActiveTab] = useState<RecoveryTab>('all');
  const [search, setSearch] = useState('');
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Categorize counts
  const countNeedsAction = cases.filter((c) => ['PENDING', 'SCORED', 'DECIDED'].includes(c.status)).length;
  const countScheduled = cases.filter((c) => c.status === 'SCHEDULED').length;
  const countInProgress = cases.filter((c) => c.status === 'EXECUTING').length;
  const countRecovered = cases.filter((c) => c.status === 'SUCCEEDED').length;
  const countFailed = cases.filter((c) => ['FAILED', 'BLOCKED', 'STOPPED'].includes(c.status)).length;
  const countEscalated = cases.filter((c) => c.status === 'ESCALATED').length;

  const filteredCases = cases.filter((c) => {
    // Tab filtering
    if (activeTab === 'needs_action' && !['PENDING', 'SCORED', 'DECIDED'].includes(c.status)) return false;
    if (activeTab === 'scheduled' && c.status !== 'SCHEDULED') return false;
    if (activeTab === 'in_progress' && c.status !== 'EXECUTING') return false;
    if (activeTab === 'recovered' && c.status !== 'SUCCEEDED') return false;
    if (activeTab === 'failed' && !['FAILED', 'BLOCKED', 'STOPPED'].includes(c.status)) return false;
    if (activeTab === 'escalated' && c.status !== 'ESCALATED') return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = c.payment_id.toLowerCase().includes(q);
      const matchCust = c.customer?.name.toLowerCase().includes(q);
      const matchEmail = c.customer?.email.toLowerCase().includes(q);
      const matchReason = c.payment?.failure_reason.toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchEmail && !matchReason) return false;
    }

    return true;
  });

  const getRecommendedActionLabel = (c: RevenueRiskCase) => {
    if (c.ai_decision?.action) {
      switch (c.ai_decision.action) {
        case 'RETRY_AFTER_DELAY':
          return `Retry in ${c.ai_decision.delay_minutes || 20}m`;
        case 'RETRY_NOW':
          return 'Immediate Retry';
        case 'CREATE_PAYMENT_LINK':
          return 'Send Payment Link';
        case 'SEND_REMINDER':
          return 'WhatsApp Reminder';
        case 'ESCALATE':
          return 'VIP Specialist Review';
        case 'STOP':
          return 'Halt Recovery';
        default:
          return 'Recommended Retry';
      }
    }
    if (c.payment?.failure_reason === 'temporary_network_failure') return 'Retry in 20 mins';
    if (c.payment?.failure_reason === 'bank_unavailable') return 'Retry in 45 mins';
    if (c.payment?.failure_reason === 'insufficient_funds') return 'Send WhatsApp Prompt';
    if (c.payment?.failure_reason === 'expired_card') return 'Send Payment Link';
    return 'Automated Retry';
  };

  const getLikelihoodBadge = (c: RevenueRiskCase) => {
    const prob = c.ml_score?.probability ?? (c.payment?.failure_reason === 'temporary_network_failure' ? 0.95 : 0.74);
    const pct = Math.round(prob * 100);

    if (pct >= 85) {
      return {
        label: `${pct}% High`,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barColor: 'bg-emerald-500',
        pct,
      };
    }
    if (pct >= 60) {
      return {
        label: `${pct}% Moderate`,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        barColor: 'bg-amber-500',
        pct,
      };
    }
    return {
      label: `${pct}% Low`,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      barColor: 'bg-slate-400',
      pct,
    };
  };

  const tabs: { id: RecoveryTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: cases.length },
    { id: 'needs_action', label: 'Needs Action', count: countNeedsAction },
    { id: 'scheduled', label: 'Scheduled', count: countScheduled },
    { id: 'in_progress', label: 'In Progress', count: countInProgress },
    { id: 'recovered', label: 'Recovered', count: countRecovered },
    { id: 'escalated', label: 'Escalated', count: countEscalated },
    { id: 'failed', label: 'Failed / Blocked', count: countFailed },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
          Recovery
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track and recover payments that are at risk of being lost.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex space-x-1 sm:space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter recovery cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Recovery Workspace Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Issue</th>
                <th className="py-3 px-4">Recovery Likelihood</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No recovery opportunities in this view.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const likelihood = getLikelihoodBadge(c);
                  const isRecovered = c.status === 'SUCCEEDED';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium text-slate-900 block">
                          {c.payment_id}
                        </span>
                        <span className="uppercase text-[10px] text-slate-500 font-semibold">
                          {c.payment?.payment_method || 'UPI'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.customer?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{c.customer?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 font-['JetBrains_Mono']">
                        {formatINR(c.at_risk_amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium text-slate-800 block">
                          {c.payment?.failure_reason.replace(/_/g, ' ') || 'Network Glitch'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {c.payment?.failure_code || 'GATEWAY_TIMEOUT'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-800">{likelihood.label}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', likelihood.barColor)}
                              style={{ width: `${likelihood.pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">
                          {getRecommendedActionLabel(c)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                            c.status === 'SUCCEEDED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'ESCALATED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : c.status === 'BLOCKED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : c.status === 'SCHEDULED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {c.status === 'SUCCEEDED'
                            ? 'Recovered'
                            : c.status === 'ESCALATED'
                            ? 'Needs Review'
                            : c.status === 'BLOCKED'
                            ? 'Blocked'
                            : c.status === 'SCHEDULED'
                            ? 'Scheduled'
                            : 'Needs Action'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {timeAgo(c.updated_at || c.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c);
                          }}
                          className={cn(
                            'px-3 py-1 text-xs font-semibold rounded-lg transition-all shadow-2xs',
                            isRecovered
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          )}
                        >
                          {isRecovered ? 'View Details' : 'Review & Recover'}
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
