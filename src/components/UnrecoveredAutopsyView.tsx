// RecoverIQ — Unrecovered Revenue Intelligence & Autopsy Screen
import React, { useState, useEffect } from 'react';
import {
  PieChart,
  AlertOctagon,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { UnrecoveredRevenueAnalysis } from '../types';
import { fetchUnrecoveredAnalysis } from '../lib/api';

export const UnrecoveredAutopsyView: React.FC = () => {
  const [analysis, setAnalysis] = useState<UnrecoveredRevenueAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchUnrecoveredAnalysis()
      .then((data) => setAnalysis(data))
      .catch((err) => console.error('Failed to load unrecovered analysis', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !analysis) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
        Performing unrecovered revenue root-cause autopsy across failed payment cohorts...
      </div>
    );
  }

  return (
    <div id="unrecovered-autopsy-view" className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <AlertOctagon className="w-3.5 h-3.5 text-purple-400" />
              Lost Revenue Diagnosis
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Unrecovered Revenue Analysis & Preventive Playbooks
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Categorizes terminal payment declines, identifies preventable leakage, and prescribes systemic fixes to maximize overall payment success.
            </p>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Autopsy
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Unrecovered Revenue
          </span>
          <div className="text-2xl font-black text-slate-900">
            ₹{analysis.total_unrecovered_amount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {analysis.total_unrecovered_count} terminal cases ({analysis.unrecovered_rate}% of volume)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 block mb-1">
            Preventable Leakage
          </span>
          <div className="text-2xl font-black text-emerald-700">
            ₹{analysis.preventable_leakage_amount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            Recoverable via proactive updater playbooks
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Hard Terminal Declines
          </span>
          <div className="text-2xl font-black text-slate-700">
            ₹{analysis.hard_declines_amount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Policy stops, revoked cards, or fraudulent attempts
          </p>
        </div>
      </div>

      {/* Root Cause Categories Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Root Cause Classification</h2>
        <p className="text-xs text-slate-500 mb-4">
          Where revenue leaked and why automated retry loops stopped
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.categories.map((cat, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900">{cat.label}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {cat.percentage_of_unrecovered}% of lost rev
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900">
                  ₹{cat.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500">({cat.count} cases)</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {cat.description}
              </p>

              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Playbook: {cat.playbook_action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preventive Playbooks Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Recommended Preventive Playbooks</h2>
        </div>

        <div className="space-y-3">
          {analysis.preventive_playbook.map((play, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      play.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {play.urgency} Priority
                  </span>
                  <h3 className="text-xs font-bold text-slate-900">{play.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{play.action}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-emerald-600 block bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {play.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
