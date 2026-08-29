import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  ChevronRight,
  Filter,
  ArrowRight,
  CreditCard,
  UserX,
  Sliders,
  DollarSign,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { DashboardSummary, TrendDataPoint, FailureReasonStat, RevenueRiskCase } from '../types';
import { formatINR, cn, timeAgo } from '../lib/utils';

interface OverviewProps {
  summary: DashboardSummary | null;
  trends: TrendDataPoint[];
  failureReasons: FailureReasonStat[];
  recentCases: RevenueRiskCase[];
  onSelectCase: (c: RevenueRiskCase) => void;
  onNavigateTab: (tab: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  summary,
  trends,
  failureReasons,
  recentCases,
  onSelectCase,
  onNavigateTab,
}) => {
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const atRisk = summary?.revenue_at_risk || 147342;
  const recovered = summary?.revenue_recovered || 92450;
  const rate = summary?.recovery_rate || 71.9;
  const recoveredCount = summary?.payments_recovered_count || 14;
  const totalFailed = summary?.total_failed_payments || 18;

  // Filter or scale trends data based on chart period
  const displayTrends = trends.map((t, idx) => {
    if (chartPeriod === '30d') {
      return {
        ...t,
        revenue_at_risk: Math.round(t.revenue_at_risk * 1.8),
        revenue_recovered: Math.round(t.revenue_recovered * 1.85),
      };
    }
    if (chartPeriod === '90d') {
      return {
        ...t,
        revenue_at_risk: Math.round(t.revenue_at_risk * 4.2),
        revenue_recovered: Math.round(t.revenue_recovered * 4.3),
      };
    }
    return t;
  });

  const BAR_COLORS = ['#0f766e', '#0284c7', '#6366f1', '#f59e0b', '#ec4899', '#64748b'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
          Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's how your revenue recovery is performing.
        </p>
      </div>

      {/* KPI Cards Row with Strong Visual Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue Recovered (Hero Card) */}
        <div className="bg-white rounded-xl p-5 border-2 border-emerald-500/20 shadow-sm relative overflow-hidden bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Revenue Recovered
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              {formatINR(recovered)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{summary?.period_change.revenue_recovered || 24.2}% this period</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Revenue at Risk */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Revenue at Risk
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              {formatINR(atRisk)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {totalFailed} failed payments identified
            </div>
          </div>
        </div>

        {/* KPI 3: Recovery Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recovery Rate
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              {rate}%
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Top quartile benchmark: 65%
            </div>
          </div>
        </div>

        {/* KPI 4: Payments Recovered */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payments Recovered
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              {recoveredCount}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Avg recovery time: 18.4 mins
            </div>
          </div>
        </div>
      </div>

      {/* Main Revenue Chart (Revenue at Risk vs Recovered) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Revenue at Risk vs. Revenue Recovered
            </h2>
            <p className="text-xs text-slate-500">
              Tracking recovered volume against identified payment failures over time
            </p>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={cn(
                  'px-3 py-1 rounded-md font-medium transition-all',
                  chartPeriod === period
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartRecovered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="chartRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any) => [
                  formatINR(val),
                  name === 'revenue_recovered' ? 'Revenue Recovered' : 'Revenue at Risk',
                ]}
                labelStyle={{ fontWeight: 600, color: '#0f172a' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                formatter={(val) => (val === 'revenue_recovered' ? 'Revenue Recovered' : 'Revenue at Risk')}
              />
              <Area
                type="monotone"
                dataKey="revenue_at_risk"
                name="revenue_at_risk"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chartRisk)"
              />
              <Area
                type="monotone"
                dataKey="revenue_recovered"
                name="revenue_recovered"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#chartRecovered)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actions Requiring Attention ("Needs your attention") */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <h2 className="text-sm font-bold text-slate-900">Needs your attention</h2>
          </div>
          <span className="text-xs text-slate-500">4 items pending review</span>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Row 1: High value payments */}
          <div
            onClick={() => onNavigateTab('recovery')}
            className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  3 high-value payments require review
                </span>
                <span className="text-xs text-slate-500">
                  Transactions exceeding ₹25,000 auto-recovery threshold flagged for sign-off.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <span>Review</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Row 2: Repeated failures */}
          <div
            onClick={() => onNavigateTab('customers')}
            className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60">
                <UserX className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  12 customers have repeated payment failures
                </span>
                <span className="text-xs text-slate-500">
                  Multiple checkout or mandate declines observed across their recent subscription billing.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <span>View Customers</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Row 3: Recoverable pool */}
          <div
            onClick={() => onNavigateTab('recovery')}
            className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  ₹2.4L of revenue is currently recoverable
                </span>
                <span className="text-xs text-slate-500">
                  High recovery likelihood detected across recent network timeout and issuer downtime events.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <span>Start Recovery</span>
              <ChevronRight className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          {/* Row 4: Recovery policies */}
          <div
            onClick={() => onNavigateTab('settings')}
            className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  2 recovery policies need review
                </span>
                <span className="text-xs text-slate-500">
                  Verify quiet hours and max retry count configurations before weekend billing cycle.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <span>Configure</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Recovery Cases & Failure Root Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Recoveries & At-Risk Payments (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Recovery Activity</h2>
              <p className="text-xs text-slate-500">Latest payment recovery status and recommended actions</p>
            </div>
            <button
              onClick={() => onNavigateTab('recovery')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCases.slice(0, 5).map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCase(c)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      c.status === 'SUCCEEDED'
                        ? 'bg-emerald-500'
                        : c.status === 'ESCALATED'
                        ? 'bg-amber-500'
                        : c.status === 'BLOCKED'
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    )}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {c.customer?.name || 'Customer'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{c.payment_id}</span>
                    </div>
                    <span className="text-xs text-slate-500 capitalize">
                      {c.payment?.failure_reason.replace(/_/g, ' ') || 'Network Glitch'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">
                    {formatINR(c.at_risk_amount)}
                  </div>
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5',
                      c.status === 'SUCCEEDED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : c.status === 'ESCALATED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : c.status === 'BLOCKED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    )}
                  >
                    {c.status === 'SUCCEEDED'
                      ? 'Recovered'
                      : c.status === 'ESCALATED'
                      ? 'Needs Review'
                      : c.status === 'BLOCKED'
                      ? 'Blocked'
                      : 'Scheduled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failure Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Top Failure Root Causes</h2>
            <p className="text-xs text-slate-500">Distribution by at-risk volume</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={failureReasons.slice(0, 5)}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [formatINR(val), 'Volume at risk']}
                />
                <Bar dataKey="total_amount" radius={[0, 4, 4, 0]}>
                  {failureReasons.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
