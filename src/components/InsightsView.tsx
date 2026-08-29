import React from 'react';
import {
  TrendingUp,
  Lightbulb,
  Zap,
  Clock,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { FailureReasonStat, InterventionStat } from '../types';
import { formatINR, cn } from '../lib/utils';

interface InsightsViewProps {
  failureReasons: FailureReasonStat[];
  interventions: InterventionStat[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  failureReasons,
  interventions,
}) => {
  const takeaways = [
    {
      id: 't1',
      title: 'Delayed Retries Outperform Immediate Retries',
      desc: 'Retrying after a 20-45 minute cooldown window yields a 28% higher recovery rate during issuer host downtime compared to immediate retry bursts.',
      stat: '+28% Lift',
      type: 'positive',
    },
    {
      id: 't2',
      title: 'UPI Collect Timeouts Are Highly Recoverable',
      desc: 'NPCI gateway timeouts achieve an 87.5% recovery rate when retried within 30 minutes, preserving ₹84,900 of recurring subscription revenue.',
      stat: '87.5% Win Rate',
      type: 'positive',
    },
    {
      id: 't3',
      title: 'WhatsApp Recovery Links Boost Checkout Conversions',
      desc: 'Customers receiving fallback payment links with alternative payment methods complete 75% of failed checkout transactions within 2 hours.',
      stat: '75.0% Conversion',
      type: 'info',
    },
    {
      id: 't4',
      title: 'High-Value Policy Guardrails Prevent Chargebacks',
      desc: 'Flagging transactions above ₹25,000 for manual specialist review reduced customer dispute risk to 0.02% across enterprise cohorts.',
      stat: '0.02% Risk',
      type: 'shield',
    },
  ];

  const BAR_COLORS = ['#0f766e', '#0284c7', '#6366f1', '#f59e0b', '#ec4899', '#64748b'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
          Insights
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Strategic analysis of payment failure causes, intervention yields, and recovery efficiency.
        </p>
      </div>

      {/* Actionable Takeaways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {takeaways.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  {item.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {item.stat}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Intervention Strategy Yield Comparison */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Recovery Yield by Strategy
          </h2>
          <p className="text-xs text-slate-500">
            Comparison of recovery conversion rates and total value recovered across different action types
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Recovery Strategy</th>
                <th className="py-3 px-4">Interventions</th>
                <th className="py-3 px-4">Succeeded</th>
                <th className="py-3 px-4">Success Rate</th>
                <th className="py-3 px-4">Revenue Recovered</th>
                <th className="py-3 px-4">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {interventions.map((intv) => (
                <tr key={intv.action} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {intv.label}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{intv.attempted}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{intv.succeeded}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-emerald-700">{intv.success_rate}%</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-['JetBrains_Mono']">
                    {formatINR(intv.recovered_value)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${intv.success_rate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failure Root Causes Detailed Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Failure Root Causes Breakdown
          </h2>
          <p className="text-xs text-slate-500">
            Total volume and recovery success rate broken down by underlying failure reason
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={failureReasons}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
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
                <Bar dataKey="total_amount" radius={[4, 4, 0, 0]}>
                  {failureReasons.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {failureReasons.map((f) => (
              <div
                key={f.reason}
                className="p-3 rounded-lg border border-slate-200 flex items-center justify-between bg-slate-50/50"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{f.label}</span>
                  <span className="text-[11px] text-slate-500">
                    {f.count} transactions • {formatINR(f.total_amount)} at risk
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700">
                    {f.recovery_rate}% Recovered
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    {formatINR(f.recovered_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
