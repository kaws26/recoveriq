// RecoverIQ — Case Counterfactual & Replay What-If Analysis Modal
import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { RevenueRiskCase, CounterfactualScenario } from '../types';
import { fetchCaseCounterfactuals } from '../lib/api';

interface CounterfactualModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskCase: RevenueRiskCase;
}

export const CounterfactualModal: React.FC<CounterfactualModalProps> = ({
  isOpen,
  onClose,
  riskCase,
}) => {
  const [scenarios, setScenarios] = useState<CounterfactualScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && riskCase) {
      setLoading(true);
      fetchCaseCounterfactuals(riskCase.id)
        .then((res) => setScenarios(res.scenarios || []))
        .catch(() => setScenarios([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, riskCase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-indigo-300 uppercase block">
                Counterfactual Simulation Engine
              </span>
              <h2 className="text-base font-bold text-white">
                What-If Strategy Replay — Case {riskCase.id}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Case Context Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 font-medium block">At-Risk Amount</span>
              <span className="text-lg font-bold text-slate-900">
                ₹{riskCase.at_risk_amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Failure Reason</span>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 inline-block mt-0.5">
                {riskCase.payment?.failure_reason || 'network_glitch'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Chosen AI Strategy</span>
              <span className="text-xs font-semibold text-indigo-700 block mt-0.5">
                {riskCase.ai_decision?.action || 'RETRY_AFTER_DELAY'} ({riskCase.ai_decision?.delay_minutes || 30}m)
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Outcome Status</span>
              <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                {riskCase.status}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Counterfactual Branches vs. Chosen Strategy</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Mathematical delta vs executed baseline
              </span>
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                Simulating counterfactual outcomes across alternative action branches...
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.map((sc) => {
                  const isPositiveDelta = sc.delta_vs_chosen_strategy >= 0;

                  return (
                    <div
                      key={sc.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{sc.strategy_name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                            {sc.channel}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                              Expected Value
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              ₹{sc.projected_expected_value.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              isPositiveDelta
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isPositiveDelta ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {isPositiveDelta ? `+₹${sc.delta_vs_chosen_strategy}` : `-₹${Math.abs(sc.delta_vs_chosen_strategy)}`}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                        {sc.rationale}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                        <span>P(success): {Math.round(sc.projected_probability * 100)}%</span>
                        <span>•</span>
                        <span>Delay: {sc.delay_minutes} min</span>
                        <span>•</span>
                        <span>Channel Cost: ₹{sc.projected_cost}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">
                          Risk: {sc.risk_profile}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All counterfactual simulations are calculated deterministically using offline ML feature weights.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Replay
          </button>
        </div>
      </div>
    </div>
  );
};
