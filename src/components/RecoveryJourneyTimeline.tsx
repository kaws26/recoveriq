// RecoverIQ — Recovery State Machine & Lifecycle Journey Component
import React from 'react';
import {
  Activity,
  Brain,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Server,
  UserCheck,
  Stethoscope,
} from 'lucide-react';
import { RevenueRiskCase, RecoveryJourneyStage } from '../types';

interface RecoveryJourneyTimelineProps {
  riskCase: RevenueRiskCase;
}

export const RecoveryJourneyTimeline: React.FC<RecoveryJourneyTimelineProps> = ({ riskCase }) => {
  const payment = riskCase.payment;
  const diagnosis = riskCase.diagnosis;
  const mlScore = riskCase.ml_score;
  const aiDecision = riskCase.ai_decision;
  const policyEval = riskCase.policy_evaluation;
  const latestAction = riskCase.latest_action;

  // Build explicit 7-stage state machine journey matching RecoveryJourneyStage model
  const stages: RecoveryJourneyStage[] = [
    {
      stage: 'INGESTION',
      label: '1. Detect & Event Ingestion',
      status: 'COMPLETED',
      timestamp: riskCase.created_at,
      actor: 'SYSTEM_INGEST',
      description: `Detected payment failure on ${payment?.payment_method?.toUpperCase() || 'UPI'} (${payment?.failure_reason || 'network glitch'}) with error code ${payment?.failure_code || 'GATEWAY_TIMEOUT'}. Event normalized into risk case.`,
      details: {
        amount: riskCase.at_risk_amount,
        failure_reason: payment?.failure_reason || 'temporary_network_failure',
        method: payment?.payment_method || 'upi',
      },
    },
    {
      stage: 'DIAGNOSIS',
      label: '2. Root Cause Diagnosis & Forensics',
      status: diagnosis ? 'COMPLETED' : 'RUNNING',
      timestamp: diagnosis?.diagnosed_at || riskCase.created_at,
      actor: 'DIAGNOSTIC_ENGINE',
      description: diagnosis
        ? `Categorized as ${diagnosis.classification} (${diagnosis.category.replace(/_/g, ' ')}) with standardized code ${diagnosis.error_analysis?.standard_code || 'NPCI_U30'}. Feasibility: ${diagnosis.recoverability_score}%.`
        : 'Running deterministic error autopsy & switch attribution...',
      details: {
        classification: diagnosis?.classification,
        category: diagnosis?.category,
        standard_code: diagnosis?.error_analysis?.standard_code,
        recoverability_score: diagnosis?.recoverability_score,
      },
    },
    {
      stage: 'ML_SCORING',
      label: '3. ML XGBoost Probability Scoring',
      status: mlScore ? 'COMPLETED' : 'RUNNING',
      timestamp: mlScore?.scored_at || riskCase.created_at,
      actor: 'ML_ENGINE',
      description: mlScore
        ? `Model calculated ${Math.round(mlScore.probability * 100)}% recovery probability (${mlScore.recovery_band} tier) with ${mlScore.confidence} confidence.`
        : 'Computing gradient-boosted recovery probability...',
      details: {
        probability: mlScore?.probability,
        confidence: mlScore?.confidence,
        recovery_band: mlScore?.recovery_band,
      },
    },
    {
      stage: 'POLICY_EVAL',
      label: '3. Guardrails & NBA Strategy',
      status: policyEval ? (policyEval.permitted ? 'COMPLETED' : 'BLOCKED') : 'RUNNING',
      timestamp: policyEval?.evaluated_at || aiDecision?.created_at || riskCase.created_at,
      actor: 'POLICY_ENGINE',
      description: policyEval
        ? policyEval.permitted
          ? `Deterministic guardrails PASSED. Next Best Action: ${aiDecision?.action.replace(/_/g, ' ') || 'Smart Retry'}.`
          : `Guardrails BLOCKED: ${policyEval.reason}`
        : 'Validating safety thresholds and quiet hours...',
      details: {
        permitted: policyEval?.permitted,
        max_retries: policyEval?.max_retries,
      },
    },
    {
      stage: 'ACTION_EXECUTION',
      label: '4. Autonomous Provider Execution',
      status:
        riskCase.status === 'SUCCEEDED'
          ? 'COMPLETED'
          : riskCase.status === 'EXECUTING'
          ? 'RUNNING'
          : riskCase.status === 'BLOCKED'
          ? 'BLOCKED'
          : 'PENDING',
      timestamp: latestAction?.executed_at,
      actor: 'EXECUTION_PROVIDER',
      description: latestAction
        ? `Dispatched ${latestAction.action_type} via ${riskCase.execution_source} provider.`
        : riskCase.status === 'BLOCKED'
        ? 'Execution halted by merchant policy safety limit.'
        : 'Awaiting automatic or manual dispatch.',
      details: {
        source: riskCase.execution_source,
        action_type: latestAction?.action_type || aiDecision?.action,
      },
    },
    {
      stage: 'VERIFICATION',
      label: '5. Gateway Settlement Verification',
      status:
        riskCase.status === 'SUCCEEDED'
          ? 'COMPLETED'
          : riskCase.status === 'FAILED'
          ? 'FAILED'
          : riskCase.status === 'BLOCKED'
          ? 'BLOCKED'
          : 'PENDING',
      timestamp: latestAction?.verified_at,
      actor: 'SYSTEM_INGEST',
      description:
        riskCase.status === 'SUCCEEDED'
          ? `Settlement confirmed. ₹${riskCase.recovered_amount.toLocaleString('en-IN')} successfully verified and reconciled.`
          : riskCase.status === 'FAILED'
          ? 'Recovery attempt declined by upstream gateway.'
          : 'Awaiting payment gateway webhook confirmation.',
      details: {
        status: riskCase.status,
        recovered_amount: riskCase.recovered_amount,
      },
    },
    {
      stage: 'OUTCOME_ACCOUNTING',
      label: '6. Ledger & Recovery Lift Accounting',
      status: riskCase.status === 'SUCCEEDED' ? 'COMPLETED' : 'PENDING',
      timestamp: latestAction?.verified_at,
      actor: 'RULE_ENGINE',
      description:
        riskCase.status === 'SUCCEEDED'
          ? 'Recorded to recovered revenue ledger and attributed to merchant net lift analytics.'
          : 'Pending successful recovery confirmation.',
      details: {
        recovered_amount: riskCase.recovered_amount,
      },
    },
  ];

  const getStageIcon = (actor: string) => {
    switch (actor) {
      case 'SYSTEM_INGEST':
        return <Server className="w-4 h-4 text-sky-600" />;
      case 'DIAGNOSTIC_ENGINE':
        return <Stethoscope className="w-4 h-4 text-cyan-600" />;
      case 'RULE_ENGINE':
        return <Activity className="w-4 h-4 text-indigo-600" />;
      case 'ML_ENGINE':
      case 'ML_SCORER':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'AI_AGENT':
        return <Brain className="w-4 h-4 text-purple-600" />;
      case 'POLICY_ENGINE':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'EXECUTION_PROVIDER':
        return <Zap className="w-4 h-4 text-blue-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: RecoveryJourneyStage['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Clock className="w-3 h-3" /> Active
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Blocked
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div id="recovery-journey-timeline" className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Autonomous Recovery State Machine & Journey
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-stage lifecycle from error detection to gateway settlement
          </p>
        </div>
        <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
          Case ID: {riskCase.id}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {stages.map((stage, idx) => {
          const isCurrent = stage.status === 'RUNNING';
          const isDone = stage.status === 'COMPLETED';
          const isBlocked = stage.status === 'BLOCKED';

          return (
            <div key={idx} className="relative group">
              {/* Bullet Node */}
              <div
                className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-xs'
                    : isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                    : isBlocked
                    ? 'bg-amber-50 border-amber-500 text-amber-600'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Stage Card */}
              <div
                className={`p-3.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/50 border-blue-200 shadow-xs ring-1 ring-blue-100'
                    : isDone
                    ? 'bg-slate-50/70 border-slate-200'
                    : isBlocked
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-white border border-slate-200/80 shadow-2xs">
                      {getStageIcon(stage.actor)}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{stage.label}</h4>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600 font-semibold">
                      {stage.actor.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stage.timestamp && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(stage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                    {getStatusBadge(stage.status)}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
