import React from 'react';
import {
  X,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  DollarSign,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                RecoverIQ Documentation
              </h2>
              <p className="text-xs text-slate-500">
                Operating principles and merchant revenue recovery workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Pillars of Merchant Revenue Recovery */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            The 4-Step Recovery Loop
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                FIND: Detection
              </span>
              <p className="text-slate-600 leading-relaxed">
                RecoverIQ continuously ingests failed transactions across UPI, Card, Netbanking, and Subscription Mandates via Razorpay webhooks and gateway polling.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                UNDERSTAND: Diagnosis
              </span>
              <p className="text-slate-600 leading-relaxed">
                Evaluates failure error codes, customer historical reliability, instrument type, and issuer uptime to determine recovery probability.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                ACT: Orchestration
              </span>
              <p className="text-slate-600 leading-relaxed">
                Applies calibrated recovery interventions: smart delayed retries, multi-instrument payment links, or customer reminders, strictly respecting policy ceilings.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                  4
                </span>
                VERIFY: Settlement
              </span>
              <p className="text-slate-600 leading-relaxed">
                Validates captured funds with the payment gateway, updating ledger balances and recording an immutable audit trail for financial reconciliation.
              </p>
            </div>
          </div>
        </div>

        {/* Guardrails Info */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1.5">
          <span className="font-bold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Deterministic Policy Guardrails
          </span>
          <p className="text-xs text-emerald-800/90 leading-relaxed">
            All automated recovery actions strictly respect merchant-defined ceilings: maximum 3 retries, quiet hours between 10 PM and 8 AM, and mandatory human review for payments exceeding ₹25,000.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
