import React from 'react';
import {
  Activity,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
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
import { InterventionStat, FailureReasonStat, DashboardSummary } from '../types';
import { formatINR } from '../lib/utils';

interface AnalyticsViewProps {
  summary: DashboardSummary | null;
  interventions: InterventionStat[];
  failureReasons: FailureReasonStat[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  summary,
  interventions,
  failureReasons,
}) => {
  const COLORS = ['#10b981', '#6366f1', '#0ea5e9', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-white">Recovery Analytics & Intervention Metrics</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Empirical comparison of recovery action performance, channel effectiveness, and conversion yields.
        </p>
      </div>

      {/* Top Intervention Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Highest Yield Intervention</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">Delayed Cooldown Retry</div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span className="text-emerald-400 font-bold">87.5% Success Rate</span>
            <span className="font-mono text-slate-300 font-semibold">{formatINR(84900)}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Top Omnichannel Method</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">Smart WhatsApp Reminders</div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span className="text-indigo-400 font-bold">72.2% Conversion</span>
            <span className="font-mono text-slate-300 font-semibold">{formatINR(46500)}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mean Recovery Velocity</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-white">18.4 Minutes</div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span className="text-teal-400 font-bold">Cooldown Optimized</span>
            <span className="text-slate-400">vs 48h manual</span>
          </div>
        </div>
      </div>

      {/* Chart: Intervention Effectiveness */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">Intervention Performance Comparison</h3>
            <p className="text-xs text-slate-400">Success rate (%) vs Recovered Volume (₹)</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            Benchmarked
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={interventions} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" interval={0} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                formatter={(val: any, name: string) => [name === 'success_rate' ? `${val}%` : formatINR(val), name === 'success_rate' ? 'Success Rate' : 'Recovered Value']}
              />
              <Bar dataKey="success_rate" name="Success Rate (%)" radius={[6, 6, 0, 0]}>
                {interventions.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deep-Dive Data Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Intervention Execution Statistics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Intervention Strategy</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Succeeded</th>
                <th className="py-3 px-4">Failed / Blocked</th>
                <th className="py-3 px-4">Success Rate</th>
                <th className="py-3 px-4 text-right">Total Recovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {interventions.map((item) => (
                <tr key={item.action} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-white">{item.label}</td>
                  <td className="py-3.5 px-4 font-mono">{item.attempted}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">{item.succeeded}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{item.failed}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${item.success_rate}%` }}></div>
                      </div>
                      <span className="font-bold font-mono text-emerald-400">{item.success_rate}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold font-['JetBrains_Mono'] text-white">
                    {formatINR(item.recovered_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
