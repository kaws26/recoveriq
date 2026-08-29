import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Cpu,
  Bot,
  Scale,
  Zap,
  Lock,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { AuditEvent } from '../types';
import { formatDate, timeAgo, cn } from '../lib/utils';

interface AuditTrailViewProps {
  events: AuditEvent[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ events }) => {
  const [search, setSearch] = useState('');
  const [selectedActor, setSelectedActor] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const filtered = events.filter((e) => {
    if (selectedActor !== 'ALL' && e.actor !== selectedActor) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.id.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.event_type.toLowerCase().includes(q) ||
      e.stage.toLowerCase().includes(q) ||
      (e.case_id && e.case_id.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = (exportDataset: AuditEvent[]) => {
    try {
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const headers = [
        'Event ID',
        'Timestamp (UTC)',
        'Timestamp (Local)',
        'Merchant ID',
        'Case ID',
        'Payment ID',
        'Stage',
        'Event Type',
        'Actor',
        'Summary',
        'Cryptographic Details (JSON)',
      ];

      const rows = exportDataset.map((e) => [
        escapeCsv(e.id),
        escapeCsv(e.timestamp),
        escapeCsv(new Date(e.timestamp).toLocaleString()),
        escapeCsv(e.merchant_id),
        escapeCsv(e.case_id || ''),
        escapeCsv(e.payment_id || ''),
        escapeCsv(e.stage),
        escapeCsv(e.event_type),
        escapeCsv(e.actor),
        escapeCsv(e.summary),
        escapeCsv(e.details),
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `recoveriq_audit_ledger_${new Date().toISOString().split('T')[0]}_${exportDataset.length}_records.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export audit CSV:', err);
    }
  };

  const getActorBadge = (actor: AuditEvent['actor']) => {
    switch (actor) {
      case 'ML_ENGINE':
        return <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold">ML Engine</span>;
      case 'AI_AGENT':
        return <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-semibold">AI Agent</span>;
      case 'POLICY_ENGINE':
        return <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-semibold">Policy Guard</span>;
      case 'EXECUTION_PROVIDER':
        return <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">Execution Provider</span>;
      case 'MERCHANT_ADMIN':
        return <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-semibold">Merchant Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">System Ingest</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and CSV Export Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-white">Immutable Recovery Audit Ledger</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically sealed timeline of all diagnostic events, AI decisions, policy evaluations, and capture verifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56"
            />
          </div>

          {/* Export CSV Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCSV(filtered)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm border",
                downloadSuccess
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-emerald-900/20"
              )}
              title="Export filtered records to CSV for offline reconciliation and finance audits"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Exported ({filtered.length})</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV ({filtered.length})</span>
                </>
              )}
            </button>

            {filtered.length !== events.length && (
              <button
                onClick={() => handleExportCSV(events)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors"
                title="Export entire ledger without filters"
              >
                Export All ({events.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Chips by Actor */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter Actor:
        </span>
        {[
          { key: 'ALL', label: 'All Actors' },
          { key: 'ML_ENGINE', label: 'ML Engine' },
          { key: 'AI_AGENT', label: 'AI Agent' },
          { key: 'POLICY_ENGINE', label: 'Policy Guard' },
          { key: 'EXECUTION_PROVIDER', label: 'Execution Provider' },
          { key: 'MERCHANT_ADMIN', label: 'Merchant Admin' },
          { key: 'SYSTEM_INGEST', label: 'System Ingest' },
        ].map((actorOption) => (
          <button
            key={actorOption.key}
            onClick={() => setSelectedActor(actorOption.key)}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap text-[11px]",
              selectedActor === actorOption.key
                ? "bg-slate-700 text-white border border-slate-600 shadow-sm"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            )}
          >
            {actorOption.label}
          </button>
        ))}
      </div>

      {/* Audit Events List */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-800/60">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit records match the current filter.
          </div>
        ) : (
          filtered.map((e) => {
            const isExpanded = expandedId === e.id;
            return (
              <div key={e.id} className="p-4 hover:bg-slate-800/30 transition-colors space-y-2">
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs">{e.summary}</span>
                        {getActorBadge(e.actor)}
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {e.stage}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                        <span className="font-mono text-slate-500">{e.id}</span>
                        {e.case_id && <span>Case: <strong className="text-slate-300 font-mono">{e.case_id}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right whitespace-nowrap">
                    <span className="text-xs text-slate-300 font-mono block">{timeAgo(e.timestamp)}</span>
                    <span className="text-[10px] text-slate-500">{formatDate(e.timestamp)}</span>
                  </div>
                </div>

                {/* Expanded Details / JSON Payload */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 pl-7 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      Cryptographic Event Payload & Audit Metadata:
                    </span>
                    <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
                      {JSON.stringify(e.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

