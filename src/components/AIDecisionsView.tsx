import React, { useState } from 'react';
import {
  Bot,
  Cpu,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Scale,
  Search,
} from 'lucide-react';
import { AIDecision, RevenueRiskCase } from '../types';
import { formatINR, formatDate, timeAgo, cn } from '../lib/utils';

interface AIDecisionsViewProps {
  decisions: AIDecision[];
  cases: RevenueRiskCase[];
  onOpenDetailModal: (c: RevenueRiskCase) => void;
}

export const AIDecisionsView: React.FC<AIDecisionsViewProps> = ({
  decisions,
  cases,
  onOpenDetailModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<AIDecision | null>(decisions[0] || null);

  const filtered = decisions.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.id.toLowerCase().includes(q) ||
      d.case_id.toLowerCase().includes(q) ||
      d.action.toLowerCase().includes(q) ||
      d.explanation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold text-white">AI Autonomous Decisions Log</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete audit of recommendations emitted by NVIDIA Nemotron-3 Super 120B and deterministic fallback engines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg">
            <Cpu className="w-3.5 h-3.5" />
            <span>Active Model: nvidia/nemotron-3-super-120b-a12b</span>
          </div>
        </div>
      </div>

      {/* Grid: Decision List (Left) & Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Decision List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search decisions, reason codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-slate-500 text-xs">
              No AI decisions found yet. Click "Analyze" on any case in the queue.
            </div>
          ) : (
            filtered.map((d) => {
              const isSelected = selectedDecision?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDecision(d)}
                  className={cn(
                    'p-4 rounded-xl border cursor-pointer transition-all text-xs space-y-2',
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80',
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white font-mono text-[11px]">{d.id}</span>
                    <span className="text-[10px] text-slate-400">{timeAgo(d.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-300 text-sm">{d.action.replace(/_/g, ' ')}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {(d.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                  <p className="text-slate-300 line-clamp-2 text-[11px] leading-relaxed">
                    {d.explanation}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Provider: {d.ai_provider}</span>
                    <span className="font-semibold text-emerald-400">
                      Exp Val: {formatINR(d.expected_recovery_value)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 7 Cols: Detailed Structured Decision Payload Inspector */}
        <div className="lg:col-span-7">
          {selectedDecision ? (
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-white">
                      {selectedDecision.action.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                      {selectedDecision.decision_source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Case: {selectedDecision.case_id} • Decision ID: {selectedDecision.id}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const c = cases.find((x) => x.id === selectedDecision.case_id);
                    if (c) onOpenDetailModal(c);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  View Case Context
                </button>
              </div>

              {/* Rationale Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                <span className="font-semibold text-indigo-300 uppercase tracking-wider text-[11px] block">
                  AI Autonomous Rationale & Diagnosis
                </span>
                <p className="text-slate-200 leading-relaxed text-sm">
                  {selectedDecision.explanation}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Confidence Score</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {(selectedDecision.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Delay Parameter</span>
                  <span className="text-lg font-bold text-slate-200 font-mono">
                    {selectedDecision.delay_minutes} mins
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Human Review</span>
                  <span className="text-lg font-bold text-amber-400">
                    {selectedDecision.requires_human_review ? 'Required' : 'Auto-Safe'}
                  </span>
                </div>
              </div>

              {/* Strict Pydantic JSON Contract View */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                    Strict Structured Output Contract (Pydantic Schema)
                  </span>
                  <span className="text-[10px] text-slate-500">Defense-in-depth validated</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {JSON.stringify(
                    {
                      action: selectedDecision.action,
                      delay_minutes: selectedDecision.delay_minutes,
                      reason_code: selectedDecision.reason_code,
                      explanation: selectedDecision.explanation,
                      confidence: selectedDecision.confidence,
                      expected_recovery_value: selectedDecision.expected_recovery_value,
                      requires_human_review: selectedDecision.requires_human_review,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-slate-500 text-xs">
              Select a decision to inspect full reasoning and JSON payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
