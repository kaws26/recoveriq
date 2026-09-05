import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Send,
  Link2,
  MessageSquare,
  Ban,
  Building2,
  CreditCard,
  User,
  History,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sliders,
  FileText,
  UserCheck,
} from 'lucide-react';
import { RevenueRiskCase, RecoveryActionType } from '../types';
import { formatINR, cn, formatDate, timeAgo } from '../lib/utils';
import { NextBestActionCard } from './NextBestActionCard';
import { RecoveryJourneyTimeline } from './RecoveryJourneyTimeline';
import { CustomerFatigueBadge } from './CustomerFatigueBadge';
import { CounterfactualModal } from './CounterfactualModal';


interface PaymentDetailDrawerProps {
  riskCase: RevenueRiskCase | null;
  onClose: () => void;
  onExecuteRecovery: (params: {
    caseId: string;
    action?: RecoveryActionType;
    delayMinutes?: number;
  }) => Promise<void>;
  onEscalateCase: (caseId: string, notes?: string) => Promise<void>;
  onStopRecovery: (caseId: string, reason?: string) => Promise<void>;
}

export const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  riskCase,
  onClose,
  onExecuteRecovery,
  onEscalateCase,
  onStopRecovery,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<RecoveryActionType>('RETRY_AFTER_DELAY');
  const [customDelay, setCustomDelay] = useState<number>(20);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');
  const [stopReason, setStopReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCounterfactual, setShowCounterfactual] = useState(false);


  if (!riskCase) return null;

  const payment = riskCase.payment;
  const customer = riskCase.customer;
  const isRecovered = riskCase.status === 'SUCCEEDED';
  const isEscalated = riskCase.status === 'ESCALATED';
  const isBlocked = riskCase.status === 'BLOCKED';

  const defaultAction: RecoveryActionType = riskCase.ai_decision?.action || 'RETRY_AFTER_DELAY';
  const recommendedDelay = riskCase.ai_decision?.delay_minutes || 20;

  const handleExecute = async () => {
    setIsExecuting(true);
    setShowConfirmModal(false);
    try {
      await onExecuteRecovery({
        caseId: riskCase.id,
        action: selectedStrategy,
        delayMinutes: selectedStrategy === 'RETRY_AFTER_DELAY' ? customDelay : 0,
      });
      setSuccessMessage(`Recovery successfully executed for ${formatINR(riskCase.at_risk_amount)}.`);
    } catch (err: any) {
      alert(err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEscalate = async () => {
    setIsExecuting(true);
    setShowEscalateModal(false);
    try {
      await onEscalateCase(riskCase.id, escalationNotes || 'Escalated to specialist review');
      setSuccessMessage('Payment escalated to merchant specialist queue.');
    } catch (err: any) {
      alert(err.message || 'Escalation failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStop = async () => {
    setIsExecuting(true);
    setShowStopModal(false);
    try {
      await onStopRecovery(riskCase.id, stopReason || 'Stopped by merchant admin');
      setSuccessMessage('Recovery halted successfully.');
    } catch (err: any) {
      alert(err.message || 'Stop failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // Structured Plain-Language Explanations
  const getWhatHappened = () => {
    const reason = payment?.failure_reason;
    if (reason === 'temporary_network_failure' || reason === 'payment_timeout') {
      return 'Payment failed because of a temporary network timeout between the gateway and issuer bank switch.';
    }
    if (reason === 'insufficient_funds') {
      return 'Payment declined due to insufficient customer balance or daily debit limit at time of charge.';
    }
    if (reason === 'bank_unavailable') {
      return 'Payment could not be processed because the issuer bank core banking system was temporarily unreachable.';
    }
    if (reason === 'expired_card') {
      return 'Payment declined because the customer card instrument has expired or was revoked.';
    }
    if (reason === 'mandate_failed') {
      return 'Standing instruction / mandate execution failed due to notification pre-debit window.';
    }
    return `Payment failed with gateway code: ${payment?.failure_code || 'GATEWAY_ERROR'}.`;
  };

  const getWhatWeThink = () => {
    const prob = riskCase.ml_score?.probability || 0.85;
    if (prob >= 0.8) return `High likelihood of recovery (${Math.round(prob * 100)}% estimated probability).`;
    if (prob >= 0.5) return `Moderate likelihood of recovery (${Math.round(prob * 100)}% estimated probability).`;
    return `Low likelihood of recovery (${Math.round(prob * 100)}% estimated probability) — recommend manual channel.`;
  };

  const getWhyExplanation = () => {
    if (customer && customer.payment_success_rate >= 0.8) {
      return `Customer has a strong payment history (${Math.round(customer.payment_success_rate * 100)}% success rate across ${customer.total_transactions} orders, LTV ${formatINR(customer.lifetime_value)}) and this failure type commonly resolves after a short delay.`;
    }
    return `Failure type analysis indicates recovery is viable without risk of card network penalty or merchant fee leakage.`;
  };

  const getWhatWillHappen = () => {
    if (isRecovered) {
      return 'Payment has been successfully authorized, verified, and settled to your ledger.';
    }
    if (isEscalated) {
      return 'Transaction is paused pending manual authorization from your finance specialist.';
    }
    return 'Payment will be retried automatically according to your recovery policy and configured provider.';
  };

  return (
    <>
      {/* Slide-over Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {riskCase.payment_id}
              </span>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                  isRecovered
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isEscalated
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : isBlocked
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                )}
              >
                {isRecovered
                  ? 'Recovered'
                  : isEscalated
                  ? 'Needs Review'
                  : isBlocked
                  ? 'Blocked'
                  : 'Actionable'}
              </span>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Provider: {riskCase.execution_source === 'razorpay_test' ? 'Razorpay Test Mode' : 'Simulation'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCounterfactual(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold border border-indigo-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                What-If Replay
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>


          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 font-['JetBrains_Mono']">
              {formatINR(riskCase.at_risk_amount)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Customer: <span className="font-semibold text-slate-800">{customer?.name || 'Customer'}</span>{' '}
              ({customer?.email})
            </div>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-medium text-xs">{successMessage}</div>
            </div>
          )}

          {/* High-Value Escalation Review Banner */}
          {isEscalated && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>NEEDS MERCHANT REVIEW</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Recover <strong>{formatINR(riskCase.at_risk_amount)}</strong>?{' '}
                <span className="text-amber-700">
                  Reason: This payment exceeds your automatic recovery threshold (₹10,000) or was flagged for human authorization.
                </span>
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  disabled={isExecuting}
                  onClick={handleExecute}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Approve Recovery
                </button>
                <button
                  disabled={isExecuting}
                  onClick={() => setShowStopModal(true)}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-medium transition"
                >
                  Decline / Halt
                </button>
              </div>
            </div>
          )}

          {/* Next Best Action Card */}
          <NextBestActionCard
            riskCase={riskCase}
            onExecuteAction={(act, delay) =>
              onExecuteRecovery({
                caseId: riskCase.id,
                action: act,
                delayMinutes: delay,
              })
            }
            isExecuting={isExecuting}
          />

          {/* 7-Stage State Machine Lifecycle Journey */}
          <RecoveryJourneyTimeline riskCase={riskCase} />

          {/* Customer Fatigue Guardrail Card */}
          <CustomerFatigueBadge profile={riskCase.fatigue_profile} />


          {/* Section 1: Tri-Fold Architecture Badges */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
            <div className="p-2 rounded-lg bg-white border border-slate-100 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-indigo-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Recommendation</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-tight">
                {riskCase.ai_decision?.ai_provider || 'NVIDIA Nemotron / XGBoost'}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-100 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-blue-700">
                <Sliders className="w-3.5 h-3.5" />
                <span>Merchant Policy</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-tight">
                {riskCase.policy_evaluation?.verdict || 'PASSED'}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-100 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Merchant Control</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-tight">
                {isEscalated ? 'Manual Review' : 'Auto Authorized'}
              </p>
            </div>
          </div>

          {/* Section 2: Structured Plain-Language Explainability */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recovery Intelligence & Explanation
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                {Math.round((riskCase.ml_score?.probability || 0.92) * 100)}% Likelihood
              </span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-400">
                  What Happened
                </span>
                <p className="text-slate-700 mt-0.5">{getWhatHappened()}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-400">
                  What We Think
                </span>
                <p className="text-slate-700 mt-0.5">{getWhatWeThink()}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-400">
                  What We Recommend
                </span>
                <p className="text-slate-700 mt-0.5 font-medium text-indigo-900 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                  {riskCase.ai_decision?.action === 'RETRY_AFTER_DELAY'
                    ? `Retry after ${riskCase.ai_decision.delay_minutes || 20} minutes`
                    : riskCase.ai_decision?.action === 'RETRY_NOW'
                    ? 'Retry immediately through secondary route'
                    : riskCase.ai_decision?.action === 'CREATE_PAYMENT_LINK'
                    ? 'Send alternate payment link to customer'
                    : 'Escalate to specialist for review'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-400">
                  Why
                </span>
                <p className="text-slate-700 mt-0.5">{getWhyExplanation()}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-400">
                  What Will Happen
                </span>
                <p className="text-slate-700 mt-0.5">{getWhatWillHappen()}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-400">
                  Who Controls It
                </span>
                <p className="text-slate-600 mt-0.5 text-[11px]">
                  Your recovery settings, quiet hours (22:00-08:00), and safety ceilings strictly apply.
                </p>
              </div>
            </div>

            {/* Select Action Strategy */}
            {!isRecovered && (
              <div className="pt-3 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Manual Strategy Override
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'RETRY_AFTER_DELAY', label: 'Delayed Retry (20m)' },
                    { id: 'RETRY_NOW', label: 'Immediate Retry' },
                    { id: 'CREATE_PAYMENT_LINK', label: 'Payment Link' },
                    { id: 'SEND_REMINDER', label: 'WhatsApp Reminder' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStrategy(s.id as any)}
                      className={cn(
                        'p-2 rounded-lg border text-left font-medium text-xs transition-all',
                        selectedStrategy === s.id
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Recovery Timeline */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Event Timeline & Audit Ledger
            </span>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Event 1 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-xs"></div>
                <div className="font-semibold text-slate-900">Payment Failed</div>
                <div className="text-slate-500 text-[11px]">
                  {formatINR(riskCase.at_risk_amount)} declined via {payment?.payment_method || 'UPI'} — {timeAgo(payment?.occurred_at || riskCase.created_at)}
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-xs"></div>
                <div className="font-semibold text-slate-900">Issue Diagnosed & Polled</div>
                <div className="text-slate-500 text-[11px]">
                  Identified {payment?.failure_reason.replace(/_/g, ' ')} ({payment?.failure_code || 'GATEWAY_TIMEOUT'})
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow-xs"></div>
                <div className="font-semibold text-slate-900">Recovery Recommended</div>
                <div className="text-slate-500 text-[11px]">
                  {riskCase.ai_decision?.explanation || 'Recommended delayed retry with high recovery confidence.'}
                </div>
              </div>

              {/* Event 4 if succeeded */}
              {isRecovered && (
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></div>
                  <div className="font-semibold text-emerald-700">Payment Captured & Verified</div>
                  <div className="text-slate-500 text-[11px]">
                    {formatINR(riskCase.recovered_amount || riskCase.at_risk_amount)} settled directly to merchant ledger.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10 flex items-center justify-between gap-3">
          {!isRecovered ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEscalateModal(true)}
                  disabled={isExecuting}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Escalate
                </button>
                <button
                  onClick={() => setShowStopModal(true)}
                  disabled={isExecuting}
                  className="px-3 py-2 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  Halt
                </button>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isExecuting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
              >
                {isExecuting ? (
                  <span>Executing Recovery...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Execute Recovery ({formatINR(riskCase.at_risk_amount)})</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Revenue Fully Recovered & Settled</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Retry Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Recovery Execution
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to execute a recovery action of{' '}
              <strong className="text-slate-900">{formatINR(riskCase.at_risk_amount)}</strong> for{' '}
              <strong className="text-slate-900">{customer?.name}</strong> using{' '}
              <strong className="text-slate-900">{selectedStrategy.replace(/_/g, ' ')}</strong>.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>Payment ID:</span>
                <span className="font-mono font-semibold">{riskCase.payment_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="uppercase font-semibold">{payment?.payment_method}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Escalate Payment Case</h3>
            <p className="text-xs text-slate-600">
              Flag this transaction for manual specialist review and pause automatic retries.
            </p>
            <textarea
              rows={3}
              placeholder="Add review notes (optional)..."
              value={escalationNotes}
              onChange={(e) => setEscalationNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Modal */}
      {showStopModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Halt Recovery</h3>
            <p className="text-xs text-slate-600">
              This will cancel any pending retries or links and mark the recovery as stopped.
            </p>
            <input
              type="text"
              placeholder="Reason (e.g. Customer requested cancellation)..."
              value={stopReason}
              onChange={(e) => setStopReason(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStopModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStop}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                Halt Recovery
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Counterfactual Scenario Replay Modal */}
      <CounterfactualModal
        isOpen={showCounterfactual}
        onClose={() => setShowCounterfactual(false)}
        riskCase={riskCase}
      />
    </>
  );
};

