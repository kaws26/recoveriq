import React, { useState } from 'react';
import {
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Server,
  Building2,
  Terminal,
  RotateCw,
  Sparkles,
  ArrowRight,
  Send,
  Ban,
  HelpCircle,
  FileSearch,
  ExternalLink,
} from 'lucide-react';
import { RevenueRiskCase, DiagnosisReport, FailureClassification, RootCauseCategory } from '../types';
import { formatINR, cn, formatDate } from '../lib/utils';
import * as api from '../lib/api';

interface Stage2DiagnosisCardProps {
  riskCase: RevenueRiskCase;
  onDiagnosisUpdated?: (updatedCase: RevenueRiskCase) => void;
  compact?: boolean;
}

export const Stage2DiagnosisCard: React.FC<Stage2DiagnosisCardProps> = ({
  riskCase,
  onDiagnosisUpdated,
  compact = false,
}) => {
  const [isRunningDiagnosis, setIsRunningDiagnosis] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const diagnosis = riskCase.diagnosis;

  const handleRunDiagnosis = async () => {
    setIsRunningDiagnosis(true);
    setErrorMessage(null);
    try {
      const res = await api.diagnoseCase(riskCase.id);
      if (res.riskCase && onDiagnosisUpdated) {
        onDiagnosisUpdated(res.riskCase);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Diagnosis failed to complete');
    } finally {
      setIsRunningDiagnosis(false);
    }
  };

  const getClassificationBadge = (classification?: FailureClassification) => {
    switch (classification) {
      case 'TRANSIENT':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          label: 'Transient (Auto-Retryable)',
          icon: Clock,
          desc: 'Network switch or gateway timeout. No permanent account block.',
        };
      case 'CUSTOMER_ACTIONABLE':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          label: 'Customer Actionable',
          icon: Send,
          desc: 'Requires customer engagement (e.g. balance top-up, alternate bank app, or 2FA).',
        };
      case 'TERMINAL':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          label: 'Terminal Decline',
          icon: Ban,
          desc: 'Permanent refusal by issuer. Card expired, revoked, or mandate cancelled.',
        };
      default:
        return {
          bg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400',
          label: 'Diagnostic Pending',
          icon: Stethoscope,
          desc: 'Awaiting forensic code analysis.',
        };
    }
  };

  const badge = getClassificationBadge(diagnosis?.classification);
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                Stage 02 • Forensics
              </span>
              <span className="text-xs font-bold text-white">Root Cause Diagnosis</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deterministic error code taxonomy & gateway component attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {diagnosis?.engine_version && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {diagnosis.engine_version}
            </span>
          )}
          <button
            type="button"
            onClick={handleRunDiagnosis}
            disabled={isRunningDiagnosis}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
            title="Execute or re-run diagnostic engine"
          >
            <RotateCw className={cn('w-3.5 h-3.5', isRunningDiagnosis && 'animate-spin')} />
            <span>{isRunningDiagnosis ? 'Diagnosing...' : diagnosis ? 'Re-Diagnose' : 'Run Stage 2'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {diagnosis ? (
        <div className="space-y-4">
          {/* Classification & Confidence Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Primary Classification Pill */}
            <div className="sm:col-span-8 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <div className={`p-2 rounded-xl border shrink-0 ${badge.bg}`}>
                <BadgeIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-200">
                    {diagnosis.root_cause_title || diagnosis.category.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {diagnosis.root_cause_summary}
                </p>
              </div>
            </div>

            {/* Recoverability Score */}
            <div className="sm:col-span-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Recoverability Feasibility
              </span>
              <div className="my-1">
                <span className="text-3xl font-extrabold text-cyan-400 font-['JetBrains_Mono']">
                  {diagnosis.recoverability_score}%
                </span>
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mx-auto',
                  diagnosis.recoverability_score >= 70
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : diagnosis.recoverability_score >= 40
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                )}
              >
                {diagnosis.is_retryable ? 'Deterministic Retry Allowed' : 'Intervention Needed'}
              </span>
            </div>
          </div>

          {/* Sub-Code Analysis & Gateway Component Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Standardized Error Code
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-300">
                <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{diagnosis.error_analysis?.standard_code || 'NPCI_U30'}</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate" title={diagnosis.error_analysis?.raw_code}>
                Raw: {diagnosis.error_analysis?.raw_code || riskCase.payment?.failure_code || 'GATEWAY_ERROR'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Component In Fault
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Server className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="capitalize">{diagnosis.error_analysis?.gateway_component?.replace(/_/g, ' ') || 'Switch'}</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                {diagnosis.error_analysis?.spec_reference || 'NPCI UPI Spec v2.1 §4.8'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Suggested Cooldown
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{diagnosis.suggested_cooldown_seconds || 120} Seconds</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Mitigates switch overload
              </span>
            </div>
          </div>

          {/* Autopsy Forensics Trace Timeline */}
          {diagnosis.detailed_autopsy && diagnosis.detailed_autopsy.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
                  Forensic Trace Autopsy Log
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {diagnosis.detailed_autopsy.length} checkpoints
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {diagnosis.detailed_autopsy.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug text-[11px] text-slate-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Outage / Degradation Radar Correlation */}
          {diagnosis.bank_impact && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-200 block">
                    {diagnosis.bank_impact.bank_name} Switch Status: {diagnosis.bank_impact.health_status}
                  </span>
                  <span className="text-[10px] text-indigo-300">
                    Observed network failure rate: {diagnosis.bank_impact.observed_failure_rate_pct}%
                    {diagnosis.bank_impact.incident_note && ` • ${diagnosis.bank_impact.incident_note}`}
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0',
                  diagnosis.bank_impact.health_status === 'DEGRADED'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                )}
              >
                {diagnosis.bank_impact.health_status}
              </span>
            </div>
          )}

          {/* Recommended Next Step Guidance */}
          <div className="p-3 rounded-xl bg-cyan-950/25 border border-cyan-800/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-cyan-200">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Next Step:</strong> {diagnosis.recommended_next_step}
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider shrink-0">
              Proceed to Stage 3 (ML Score) →
            </span>
          </div>
        </div>
      ) : (
        /* Fallback when diagnosis has not been executed yet */
        <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
          <Stethoscope className="w-8 h-8 text-slate-600 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-slate-300">Stage 2 Diagnosis Not Yet Generated</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Execute root cause forensics to extract standardized error codes, switch attribution, and recoverability classification.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunDiagnosis}
            disabled={isRunningDiagnosis}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={cn('w-4 h-4', isRunningDiagnosis && 'animate-spin')} />
            <span>{isRunningDiagnosis ? 'Executing Stage 2 Forensics...' : 'Run Stage 2 Diagnosis'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
