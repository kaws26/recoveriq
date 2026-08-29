import React, { useState } from 'react';
import {
  X,
  CreditCard,
  User,
  Cpu,
  Bot,
  Scale,
  Zap,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { RevenueRiskCase, RecoveryActionType } from '../types';
import { formatINR, formatDate, timeAgo, cn } from '../lib/utils';
import { RecoveryJourneyTimeline } from './RecoveryJourneyTimeline';
import { NextBestActionCard } from './NextBestActionCard';
import { CustomerFatigueBadge } from './CustomerFatigueBadge';
import { CounterfactualModal } from './CounterfactualModal';

interface CaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: RevenueRiskCase | null;
  onAnalyze: (caseId: string) => Promise<void>;
  onExecute: (caseId: string, action?: RecoveryActionType, delayMinutes?: number) => Promise<void>;
  onStop: (caseId: string) => Promise<void>;
  onEscalate: (caseId: string) => Promise<void>;
  isAnalyzing: boolean;
  isExecuting: boolean;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  onAnalyze,
  onExecute,
  onStop,
  onEscalate,
  isAnalyzing,
  isExecuting,
}) => {
  const [showCounterfactual, setShowCounterfactual] = useState(false);

  if (!isOpen || !caseItem) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-mono">{caseItem.payment_id}</h2>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                      caseItem.status === 'SUCCEEDED' && 'bg-emerald-950 text-emerald-300 border-emerald-800',
                      caseItem.status === 'BLOCKED' && 'bg-rose-950 text-rose-300 border-rose-800',
                      caseItem.status === 'ESCALATED' && 'bg-amber-950 text-amber-300 border-amber-800',
                      caseItem.status === 'DECIDED' && 'bg-indigo-950 text-indigo-300 border-indigo-800',
                      caseItem.status === 'PENDING' && 'bg-slate-800 text-slate-300 border-slate-700',
                    )}
                  >
                    {caseItem.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Case ID: {caseItem.id} • Created {timeAgo(caseItem.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCounterfactual(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                What-If Replay
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 text-xs">
            {/* Top Key Figures */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Revenue at Risk</span>
                <span className="text-2xl font-extrabold text-white font-['JetBrains_Mono'] mt-1 block">
                  {formatINR(caseItem.at_risk_amount)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Recovered Amount</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-['JetBrains_Mono'] mt-1 block">
                  {formatINR(caseItem.recovered_amount)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ML Recovery Prob</span>
                <span className="text-2xl font-extrabold text-indigo-300 font-mono mt-1 block">
                  {caseItem.ml_score ? `${(caseItem.ml_score.probability * 100).toFixed(0)}%` : 'Pending'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Confidence Band</span>
                <span className="text-2xl font-extrabold text-amber-300 font-mono mt-1 block">
                  {caseItem.ml_score?.recovery_band || 'STANDARD'}
                </span>
              </div>
            </div>

            {/* Next Best Action Card (Top Highlight) */}
            <NextBestActionCard
              riskCase={caseItem}
              onExecuteAction={(act, delay) => onExecute(caseItem.id, act, delay)}
              isExecuting={isExecuting}
            />

            {/* Recovery State Machine Lifecycle Journey */}
            <RecoveryJourneyTimeline riskCase={caseItem} />

            {/* Diagnosis & Customer Details + Fatigue */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">Payment & Failure Details</span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failure Code:</span>
                    <span className="font-mono text-rose-300">{caseItem.payment?.failure_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failure Reason:</span>
                    <span className="text-slate-200 capitalize">{caseItem.payment?.failure_reason.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="text-slate-200 uppercase">{caseItem.payment?.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Description:</span>
                    <span className="text-slate-300 text-right">{caseItem.payment?.failure_description}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">Customer Profile</span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-semibold text-slate-200">{caseItem.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-300">{caseItem.customer?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer LTV:</span>
                    <span className="font-mono text-slate-200">{formatINR(caseItem.customer?.lifetime_value || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Historical Success Rate:</span>
                    <span className="font-mono text-emerald-400">
                      {((caseItem.customer?.payment_success_rate || 0.8) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <CustomerFatigueBadge profile={caseItem.fatigue_profile} />
              </div>
            </div>

            {/* AI Decision Rationale */}
            {caseItem.ai_decision && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <span className="font-bold text-indigo-300 block text-xs">AI Recommendation & Rationale</span>
                <p className="text-slate-200 leading-relaxed text-xs">{caseItem.ai_decision.explanation}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-indigo-900/60">
                  <span>Action: <strong className="text-white">{caseItem.ai_decision.action}</strong></span>
                  <span>Delay: <strong className="text-white">{caseItem.ai_decision.delay_minutes}m</strong></span>
                  <span>Provider: <strong className="text-indigo-300">{caseItem.ai_decision.ai_provider}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur px-6 py-4 border-t border-slate-800 flex justify-between items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => onStop(caseItem.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Stop Case
              </button>
              <button
                onClick={() => onEscalate(caseItem.id)}
                className="px-3 py-1.5 rounded-xl bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 text-xs font-semibold transition-colors"
              >
                Escalate
              </button>
            </div>

            <div className="flex gap-2">
              {caseItem.status === 'PENDING' && (
                <button
                  onClick={() => onAnalyze(caseItem.id)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Case'}</span>
                </button>
              )}

              {(caseItem.status === 'DECIDED' || caseItem.status === 'SCORED') && (
                <button
                  onClick={() => onExecute(caseItem.id)}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isExecuting ? 'Executing...' : 'Execute Recovery'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Counterfactual Scenario Replay Modal */}
      <CounterfactualModal
        isOpen={showCounterfactual}
        onClose={() => setShowCounterfactual(false)}
        riskCase={caseItem}
      />
    </>
  );
};
