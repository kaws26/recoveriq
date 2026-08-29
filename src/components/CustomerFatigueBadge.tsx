// RecoverIQ — Customer Fatigue & Intervention Budget Indicator
import React from 'react';
import { ShieldCheck, Moon, BellOff, MessageSquare, AlertCircle } from 'lucide-react';
import { CustomerFatigueProfile } from '../types';

interface CustomerFatigueBadgeProps {
  profile?: CustomerFatigueProfile;
}

export const CustomerFatigueBadge: React.FC<CustomerFatigueBadgeProps> = ({ profile }) => {
  if (!profile) return null;

  const isFatigued = profile.fatigue_status === 'FATIGUED';
  const isModerate = profile.fatigue_status === 'MODERATE';
  const isQuietHours = profile.quiet_hours_active;

  return (
    <div id="customer-fatigue-badge" className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          <h4 className="text-xs font-bold text-slate-900">Customer Fatigue & Guardrail Budget</h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isFatigued
              ? 'bg-rose-100 text-rose-800'
              : isModerate
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {profile.fatigue_status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-400 block font-medium">Messages (24h)</span>
          <span className="text-sm font-bold text-slate-800">
            {profile.messages_last_24h} / {profile.max_allowed_24h} max
          </span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-400 block font-medium">Quiet Hours</span>
          <span className="text-xs font-semibold flex items-center gap-1 text-slate-700">
            {isQuietHours ? (
              <>
                <Moon className="w-3 h-3 text-indigo-600" /> Active (10PM-8AM)
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Open Window
              </>
            )}
          </span>
        </div>
      </div>

      {isFatigued && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-700 bg-rose-50 p-2 rounded-md border border-rose-100 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Customer reached daily reminder limit. Additional prompts blocked.
        </div>
      )}

      {isQuietHours && !isFatigued && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100 font-medium">
          <Moon className="w-3.5 h-3.5 shrink-0" />
          Quiet hours active. WhatsApp/SMS queued until 08:00 AM IST.
        </div>
      )}
    </div>
  );
};
