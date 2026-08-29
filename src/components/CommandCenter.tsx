import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Clock,
  User,
  CreditCard,
  Lock,
  Cpu,
  Bot,
  Scale,
  FileCheck,
  BadgeAlert,
  Play,
  Share2,
  Send,
  Eye,
} from 'lucide-react';
import { RevenueRiskCase, CaseStatus, RecoveryActionType } from '../types';
import { formatINR, formatDate, timeAgo, cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface CommandCenterProps {
  cases: RevenueRiskCase[];
  selectedCase: RevenueRiskCase | null;
  onSelectCase: (c: RevenueRiskCase) => void;
  onAnalyze: (caseId: string) => Promise<void>;
  onExecute: (caseId: string, action?: RecoveryActionType) => Promise<void>;
  onStop: (caseId: string) => Promise<void>;
  onEscalate: (caseId: string) => Promise<void>;
  isAnalyzing: boolean;
  isExecuting: boolean;
  onOpenDetailModal: (c: RevenueRiskCase) => void;
}

const STAGES = [
  { key: 'DETECT', label: '1. Detect', desc: 'Ingest failure event' },
  { key: 'DIAGNOSE', label: '2. Diagnose', desc: 'Identify root cause' },
  { key: 'SCORE', label: '3. ML Score', desc: 'XGBoost P(recovery)' },
  { key: 'DECIDE', label: '4. AI Decide', desc: 'NVIDIA Nemotron reasoning' },
  { key: 'POLICY', label: '5. Policy Guard', desc: 'Deterministic bounds' },
  { key: 'EXECUTE', label: '6. Execute', desc: 'Simulation / Razorpay' },
  { key: 'VERIFY', label: '7. Verify', desc: 'Cryptographic proof' },
  { key: 'MEASURE', label: '8. Measure', desc: 'Record recovered revenue' },
  { key: 'AUDIT', label: '9. Audit', desc: 'Immutable ledger' },
];

export const CommandCenter: React.FC<CommandCenterProps> = ({
  cases,
  selectedCase,
  onSelectCase,
  onAnalyze,
  onExecute,
  onStop,
  onEscalate,
  isAnalyzing,
  isExecuting,
  onOpenDetailModal,
}) => {
  const currentCase = selectedCase || cases[0] || null;

  // Compute active stage progress for the visualizer
  const getStageStatus = (stageKey: string): 'completed' | 'current' | 'upcoming' | 'blocked' => {
    if (!currentCase) return 'upcoming';

    if (currentCase.status === 'SUCCEEDED') return 'completed';
    if (currentCase.status === 'BLOCKED') {
      if (['DETECT', 'DIAGNOSE', 'SCORE', 'DECIDE'].includes(stageKey)) return 'completed';
      if (stageKey === 'POLICY') return 'blocked';
      return 'upcoming';
    }
    if (currentCase.status === 'ESCALATED') {
      if (['DETECT', 'DIAGNOSE', 'SCORE', 'DECIDE'].includes(stageKey)) return 'completed';
      if (stageKey === 'POLICY') return 'current';
      return 'upcoming';
    }
    if (currentCase.status === 'DECIDED' || currentCase.status === 'SCHEDULED') {
      if (['DETECT', 'DIAGNOSE', 'SCORE', 'DECIDE', 'POLICY'].includes(stageKey)) return 'completed';
      if (stageKey === 'EXECUTE') return 'current';
      return 'upcoming';
    }
    if (currentCase.status === 'SCORED') {
      if (['DETECT', 'DIAGNOSE', 'SCORE'].includes(stageKey)) return 'completed';
      if (stageKey === 'DECIDE') return 'current';
      return 'upcoming';
    }
    if (currentCase.status === 'PENDING') {
      if (stageKey === 'DETECT' || stageKey === 'DIAGNOSE') return 'completed';
      if (stageKey === 'SCORE') return 'current';
      return 'upcoming';
    }
    return 'upcoming';
  };

  const handleExecuteWithConfetti = async () => {
    if (!currentCase) return;
    await onExecute(currentCase.id);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Showcase Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-5 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
              AI Revenue Recovery Command Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Autonomous revenue protection with ML probability scoring, NVIDIA Nemotron reasoning, and deterministic policy guardrails.
          </p>
        </div>

        {/* Case Quick Switcher Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Select Case:</span>
          {cases.slice(0, 4).map((c) => {
            const isSel = currentCase?.id === c.id;
            return (
              <button
                key={c.id}
                id={`command-select-case-${c.id}`}
                onClick={() => onSelectCase(c)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all',
                  isSel
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span>{formatINR(c.at_risk_amount)}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({c.payment?.failure_reason === 'temporary_network_failure' ? 'Network' : c.payment?.failure_reason === 'bank_unavailable' ? 'Bank Down' : c.payment?.failure_reason === 'insufficient_funds' ? 'Balance' : 'Expired'})</span>
                  {c.status === 'SUCCEEDED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {c.status === 'BLOCKED' && <ShieldAlert className="w-3 h-3 text-red-400" />}
                  {c.status === 'ESCALATED' && <BadgeAlert className="w-3 h-3 text-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 9-Stage Recovery Lifecycle Progress Stepper */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Autonomous Recovery Pipeline Lifecycle
          </h3>
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time Verification Active
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {STAGES.map((st, idx) => {
            const stStatus = getStageStatus(st.key);
            return (
              <div
                key={st.key}
                className={cn(
                  'relative flex flex-col p-2.5 rounded-xl border text-left transition-all',
                  stStatus === 'completed' && 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300',
                  stStatus === 'current' && 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/40',
                  stStatus === 'blocked' && 'bg-rose-950/30 border-rose-800/60 text-rose-300',
                  stStatus === 'upcoming' && 'bg-slate-950/50 border-slate-800/50 text-slate-500',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold">{st.label}</span>
                  {stStatus === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {stStatus === 'current' && <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                  {stStatus === 'blocked' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight truncate">{st.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage Workspace */}
      {currentCase && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Transaction & Customer Context */}
          <div className="lg:col-span-4 space-y-5">
            {/* Transaction Card */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{currentCase.payment_id}</h3>
                    <p className="text-xs text-slate-400">{timeAgo(currentCase.created_at)}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-semibold border',
                    currentCase.status === 'SUCCEEDED' && 'bg-emerald-950 text-emerald-300 border-emerald-800',
                    currentCase.status === 'BLOCKED' && 'bg-rose-950 text-rose-300 border-rose-800',
                    currentCase.status === 'ESCALATED' && 'bg-amber-950 text-amber-300 border-amber-800',
                    currentCase.status === 'DECIDED' && 'bg-indigo-950 text-indigo-300 border-indigo-800',
                    currentCase.status === 'SCORED' && 'bg-blue-950 text-blue-300 border-blue-800',
                    currentCase.status === 'PENDING' && 'bg-slate-800 text-slate-300 border-slate-700',
                  )}
                >
                  {currentCase.status}
                </span>
              </div>

              {/* Amount Display */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Revenue at Risk</span>
                <div className="text-3xl font-extrabold text-white font-['JetBrains_Mono'] mt-1">
                  {formatINR(currentCase.at_risk_amount)}
                </div>
                {currentCase.recovered_amount > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Recovered: {formatINR(currentCase.recovered_amount)}
                  </div>
                )}
              </div>

              {/* Diagnosis Details */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Failure Code</span>
                  <span className="font-mono font-semibold text-rose-300">{currentCase.payment?.failure_code || 'GATEWAY_TIMEOUT'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Method</span>
                  <span className="font-semibold text-slate-200 uppercase">{currentCase.payment?.payment_method || 'UPI'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Retry Attempts</span>
                  <span className="font-semibold text-slate-200">{currentCase.recovery_attempts} / 3 limit</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Description</span>
                  <span className="text-right text-slate-300 max-w-[180px] truncate" title={currentCase.payment?.failure_description}>
                    {currentCase.payment?.failure_description || 'Payment timeout'}
                  </span>
                </div>
              </div>

              {/* Customer Profile Card */}
              {currentCase.customer && (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-slate-200">{currentCase.customer.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800/60">
                      <span className="text-slate-500 block">Customer LTV</span>
                      <span className="font-semibold text-slate-200 font-['JetBrains_Mono']">
                        {formatINR(currentCase.customer.lifetime_value)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800/60">
                      <span className="text-slate-500 block">Historical Success</span>
                      <span className="font-semibold text-emerald-400">
                        {((currentCase.customer.payment_success_rate || 0.8) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="pt-2 space-y-2">
                {currentCase.status === 'PENDING' && (
                  <button
                    id="command-analyze-btn"
                    onClick={() => onAnalyze(currentCase.id)}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-950/50 disabled:opacity-50"
                  >
                    <Bot className={cn('w-4 h-4', isAnalyzing && 'animate-spin')} />
                    <span>{isAnalyzing ? 'Analyzing ML & Nemotron...' : '1. Analyze Case with AI'}</span>
                  </button>
                )}

                {(currentCase.status === 'DECIDED' || currentCase.status === 'SCORED') && (
                  <button
                    id="command-execute-btn"
                    onClick={handleExecuteWithConfetti}
                    disabled={isExecuting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/50 disabled:opacity-50"
                  >
                    <Zap className={cn('w-4 h-4', isExecuting && 'animate-bounce')} />
                    <span>{isExecuting ? 'Executing & Verifying...' : '2. Execute & Verify Recovery'}</span>
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenDetailModal(currentCase)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Context</span>
                  </button>
                  <button
                    onClick={() => onEscalate(currentCase.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 transition-all"
                  >
                    <BadgeAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Escalate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (8 Cols): ML Probability, AI Decision & Deterministic Guardrails */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. ML Probability & Feature Weights */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">ML Probability Engine (XGBoost)</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  recovery_xgb_v1.2.0
                </span>
              </div>

              {currentCase.ml_score ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Gauge Display */}
                  <div className="md:col-span-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center">
                    <span className="text-xs text-slate-400 font-medium">P(successful_recovery)</span>
                    <div className="text-4xl font-extrabold text-emerald-400 font-['JetBrains_Mono'] my-1">
                      {(currentCase.ml_score.probability * 100).toFixed(0)}%
                    </div>
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      {currentCase.ml_score.risk_band}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-2">
                      95% CI: [{(currentCase.ml_score.confidence_interval[0] * 100).toFixed(0)}% - {(currentCase.ml_score.confidence_interval[1] * 100).toFixed(0)}%]
                    </p>
                  </div>

                  {/* Feature Importance Vector */}
                  <div className="md:col-span-8 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">Top Predictive Feature Weights:</span>
                    {Object.entries(currentCase.ml_score.feature_importances || {}).map(([feat, weight]) => {
                      const numWeight = Number(weight);
                      return (
                        <div key={feat} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-mono capitalize">{feat.replace(/_/g, ' ')}</span>
                            <span className="text-slate-200 font-semibold font-mono">{(numWeight * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                              style={{ width: `${numWeight * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400">
                  <p className="text-xs">ML probability scoring pending. Click "Analyze Case with AI" to compute.</p>
                </div>
              )}
            </div>

            {/* 2. NVIDIA Nemotron AI Decision & Strategy Comparison */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">AI Agent Decisioning (NVIDIA Nemotron)</h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentCase.ai_decision?.ai_provider || 'NVIDIA Nemotron-3 Super 120B'}
                </span>
              </div>

              {currentCase.ai_decision ? (
                <div className="space-y-4">
                  {/* Selected Action Banner */}
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-bold block">
                        Recommended Recovery Action
                      </span>
                      <div className="text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                        <span>{currentCase.ai_decision.action.replace(/_/g, ' ')}</span>
                        {currentCase.ai_decision.delay_minutes > 0 && (
                          <span className="text-xs font-normal text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded">
                            (Delay: {currentCase.ai_decision.delay_minutes} mins)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Expected Recovery Value</span>
                      <span className="text-lg font-bold text-emerald-400 font-['JetBrains_Mono']">
                        {formatINR(currentCase.ai_decision.expected_recovery_value)}
                      </span>
                    </div>
                  </div>

                  {/* AI Explanation Text */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                    <span className="font-semibold text-indigo-300 block mb-1">AI Rationale & Strategy:</span>
                    <p className="text-slate-300 leading-relaxed">{currentCase.ai_decision.explanation}</p>
                  </div>

                  {/* Strategy Comparison Matrix */}
                  {currentCase.ai_decision.strategy_comparison && (
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block mb-2">Evaluated Interventions Matrix:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentCase.ai_decision.strategy_comparison.map((opt) => (
                          <div
                            key={opt.action}
                            className={cn(
                              'p-3 rounded-xl border text-xs transition-all',
                              opt.is_selected
                                ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                                : 'bg-slate-950/50 border-slate-800/80 opacity-75',
                            )}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-slate-200">{opt.label}</span>
                              <span className="font-mono font-semibold text-emerald-400">
                                {(opt.probability * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug">{opt.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400">
                  <p className="text-xs">AI Agent evaluation pending. Click "Analyze Case with AI" to generate structured decision.</p>
                </div>
              )}
            </div>

            {/* 3. Deterministic Policy Guardrails */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Deterministic Financial Guardrails</h3>
                </div>
                {currentCase.policy_evaluation && (
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                      currentCase.policy_evaluation.verdict === 'PASSED' && 'bg-emerald-950 text-emerald-300 border-emerald-800',
                      currentCase.policy_evaluation.verdict === 'BLOCKED' && 'bg-rose-950 text-rose-300 border-rose-800',
                      currentCase.policy_evaluation.verdict === 'ESCALATED_HUMAN_REVIEW' && 'bg-amber-950 text-amber-300 border-amber-800',
                    )}
                  >
                    Verdict: {currentCase.policy_evaluation.verdict}
                  </span>
                )}
              </div>

              {currentCase.policy_evaluation ? (
                <div className="space-y-2.5">
                  {currentCase.policy_evaluation.rules_checked.map((rule) => (
                    <div
                      key={rule.rule_id}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border text-xs',
                        rule.passed
                          ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                          : rule.severity === 'BLOCK'
                          ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                          : 'bg-amber-950/30 border-amber-800/60 text-amber-300',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {rule.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold">{rule.name}</span>
                          <span className="text-[10px] text-slate-400 block">{rule.description}</span>
                        </div>
                      </div>
                      <span className="font-bold text-[11px]">
                        {rule.passed ? 'PASSED' : rule.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                  Guardrail rules: Double-charge lock, Max retries (3), Auto-recovery cap (₹25k), High-value threshold (₹10k), Quiet hours (22:00-08:00).
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
