// RecoverIQ — Next Best Action & Expected Value Decisioning Component
import React from 'react';
import {
  TrendingUp,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Globe,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { NextBestActionOption, RevenueRiskCase, RecoveryActionType } from '../types';

interface NextBestActionCardProps {
  riskCase: RevenueRiskCase;
  onExecuteAction?: (action: RecoveryActionType, delayMinutes?: number) => void;
  isExecuting?: boolean;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  riskCase,
  onExecuteAction,
  isExecuting,
}) => {
  const actions = riskCase.next_best_actions || [];
  const topAction = actions.find((a) => a.is_recommended) || actions[0];
  const alternateActions = actions.filter((a) => a !== topAction);

  const getChannelIcon = (channel: NextBestActionOption['channel']) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'email':
      case 'sms':
        return <Globe className="w-3.5 h-3.5 text-blue-600" />;
      case 'api':
        return <Zap className="w-3.5 h-3.5 text-indigo-600" />;
      case 'manual':
        return <UserCheck className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div id="next-best-action-card" className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-700/60 border border-indigo-500/30">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200 block">
              Autonomous Optimization Engine
            </span>
            <h3 className="text-sm font-bold text-white">Next Best Action (NBA) Recommendation</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-100 font-medium border border-indigo-400/30">
            EV Maximized
          </span>
        </div>
      </div>

      {topAction ? (
        <div className="p-5 space-y-4">
          {/* Primary Recommended Action Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 border border-indigo-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                    Rank #1 Recommended
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    {getChannelIcon(topAction.channel)}
                    {topAction.channel.toUpperCase()} CHANNEL
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{topAction.label}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{topAction.description}</p>
              </div>

              {/* Expected Value & Probability Block */}
              <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Value</span>
                  <span className="text-base font-bold text-emerald-600">
                    +₹{topAction.expected_value.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Success Prob</span>
                  <span className="text-base font-bold text-indigo-600">
                    {Math.round(topAction.probability * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Rationale and Strategy Explanation */}
            <div className="p-3 bg-white/80 rounded-lg border border-slate-200/70 text-xs text-slate-700 mb-3">
              <span className="font-semibold text-slate-900 block mb-0.5">Strategy Rationale:</span>
              {topAction.rationale}
            </div>

            {/* Action Meta & Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Delay: {topAction.delay_minutes > 0 ? `${topAction.delay_minutes} min cooldown` : 'Instant execution'}
                </span>
                <span>•</span>
                <span>Channel Cost: ₹{topAction.estimated_cost}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Policy Permitted
                </span>
              </div>

              {onExecuteAction && (
                <button
                  onClick={() => onExecuteAction(topAction.action, topAction.delay_minutes)}
                  disabled={isExecuting || !topAction.policy_permitted}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {isExecuting ? 'Dispatching...' : `Execute Recommendation`}
                </button>
              )}
            </div>
          </div>

          {/* Alternate Ranked Actions Table */}
          {alternateActions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Evaluated Alternate Interventions ({alternateActions.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Ranked by Expected Value (EV)</span>
              </h4>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
                {alternateActions.map((opt) => (
                  <div
                    key={opt.rank}
                    className="p-3 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {opt.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">{opt.label}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {opt.channel}
                          </span>
                          {!opt.policy_permitted && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Blocked by Policy
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{opt.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">
                          {Math.round(opt.probability * 100)}% prob
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600">
                          EV: +₹{opt.expected_value.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {onExecuteAction && (
                        <button
                          onClick={() => onExecuteAction(opt.action, opt.delay_minutes)}
                          disabled={isExecuting || !opt.policy_permitted}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 transition-colors"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-500">
          Calculating Next Best Action options...
        </div>
      )}
    </div>
  );
};
