// RecoverIQ — Recovery Lift Lab & Empirical Benchmark Analytics
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Sparkles,
  Zap,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  ArrowUpRight,
  HelpCircle,
  PieChart,
  CheckCircle2,
} from 'lucide-react';
import { RecoveryLiftMetrics } from '../types';
import { fetchRecoveryLift } from '../lib/api';

export const RecoveryLiftLabView: React.FC = () => {
  const [lift, setLift] = useState<RecoveryLiftMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchRecoveryLift()
      .then((data) => setLift(data))
      .catch((err) => console.error('Failed to load lift metrics', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !lift) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 animate-pulse">
        Calculating empirical Recovery Lift benchmarks against static baseline...
      </div>
    );
  }

  return (
    <div id="recovery-lift-lab" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Empirical Value Demonstration
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Recovery Lift Lab & Benchmark Analytics
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Empirical A/B comparison measuring RecoverIQ adaptive optimization against static naive retry baselines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recompute Benchmarks
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Lift Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Lift Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            +₹{lift.net_lift_revenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Additional recovered revenue vs baseline
          </p>
        </div>

        {/* Recovery Rate Comparison */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recovery Rate Lift</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{lift.recoveriq_recovery_rate}%</span>
            <span className="text-xs text-slate-400 line-through">{lift.baseline_recovery_rate}% base</span>
          </div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            +{lift.net_lift_percentage}% absolute efficiency gain
          </p>
        </div>

        {/* Retry Efficiency */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Retry Efficiency</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {lift.avg_retries_per_recovery_recoveriq} <span className="text-xs text-slate-400 font-medium">retries/case</span>
          </div>
          <p className="text-xs text-blue-600 font-semibold mt-1">
            {lift.retry_efficiency_improvement}% fewer retries than naive 24h loop
          </p>
        </div>

        {/* Avoided Gateway Fees */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avoided Gateway Fees</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{lift.avoided_failed_retry_fees.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-purple-600 font-semibold mt-1">
            Saved by eliminating blind retries during outages
          </p>
        </div>
      </div>

      {/* Lift Breakdown by Failure Reason */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Lift Breakdown by Payment Failure Reason</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical recovery performance by specific banking decline category
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Updated in real-time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Failure Category</th>
                <th className="pb-3">At-Risk Revenue</th>
                <th className="pb-3">Static Baseline</th>
                <th className="pb-3">RecoverIQ Rate</th>
                <th className="pb-3">Absolute Lift</th>
                <th className="pb-3 text-right">Net Revenue Recovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lift.lift_by_failure_reason.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {row.label}
                  </td>
                  <td className="py-3.5 font-mono text-slate-600">
                    ₹{row.at_risk_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 font-semibold text-slate-400">
                    {row.baseline_rate}%
                  </td>
                  <td className="py-3.5 font-bold text-indigo-600">
                    {row.recoveriq_rate}%
                  </td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      +{row.lift_pct}%
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-bold text-emerald-600 font-mono">
                    +₹{row.recovered_lift_amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Method Comparison & Monthly ROI Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Lift Across Payment Rails</h2>
          <p className="text-xs text-slate-500 mb-4">
            Adaptive routing & customer prompts by payment method
          </p>

          <div className="space-y-3">
            {lift.lift_by_payment_method.map((pm, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{pm.label}</h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>Baseline: {pm.baseline_rate}%</span>
                    <span>•</span>
                    <span className="font-semibold text-indigo-600">RecoverIQ: {pm.recoveriq_rate}%</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                    <TrendingUp className="w-3 h-3" /> +{pm.lift_pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projected Monthly Value Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Annualized Impact
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Projected Monthly Savings
            </h3>
            <div className="text-3xl font-black text-amber-300">
              ₹{Math.round(lift.monthly_savings_projection).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Based on current recurring transaction volume, RecoverIQ is projected to protect over ₹{Math.round(lift.monthly_savings_projection * 12).toLocaleString('en-IN')} in annual recurring revenue.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-800/60 flex items-center gap-2 text-xs text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero code changes required. Managed 100% autonomously.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
