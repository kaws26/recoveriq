import React, { useState } from 'react';
import {
  Activity,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Shield,
  User,
  Clock,
} from 'lucide-react';
import { AuditEvent } from '../types';
import { formatDate, timeAgo, cn, formatINR } from '../lib/utils';

interface ActivityViewProps {
  events: AuditEvent[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ events }) => {
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const filteredEvents = events.filter((e) => {
    if (actorFilter !== 'ALL' && e.actor !== actorFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchMsg = e.summary?.toLowerCase().includes(q);
      const matchCase = e.case_id?.toLowerCase().includes(q);
      const matchAction = e.event_type?.toLowerCase().includes(q);
      if (!matchMsg && !matchCase && !matchAction) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = ['Event ID', 'Timestamp', 'Actor', 'Event Type', 'Case ID', 'Event Summary'];
      const rows = filteredEvents.map((e) => [
        e.id,
        e.timestamp,
        e.actor,
        e.event_type,
        e.case_id || 'N/A',
        `"${(e.summary || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `recoveriq_activity_ledger_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 400);
  };

  const getActorBadge = (actor: string) => {
    switch (actor) {
      case 'AI_AGENT':
      case 'ML_ENGINE':
      case 'EXECUTION_PROVIDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <RotateCcw className="w-3 h-3" />
            <span>Automation</span>
          </span>
        );
      case 'POLICY_ENGINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Shield className="w-3 h-3" />
            <span>Policy Guard</span>
          </span>
        );
      case 'MERCHANT_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <User className="w-3 h-3" />
            <span>Merchant Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            <span>System</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
            Activity
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete immutable record of payment failure detections, recovery actions, and policy enforcements.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export Activity CSV'}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Actors</option>
            <option value="AI_AGENT">Automation</option>
            <option value="POLICY_ENGINE">Policy Guard</option>
            <option value="MERCHANT_ADMIN">Merchant Admin</option>
            <option value="SYSTEM_INGEST">System Ingest</option>
          </select>
        </div>
      </div>

      {/* Activity Stream Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No activity records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div>{timeAgo(evt.timestamp)}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(evt.timestamp)}</div>
                    </td>

                    <td className="py-3.5 px-4">{getActorBadge(evt.actor)}</td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {evt.event_type}
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 leading-snug max-w-md">
                      {evt.summary}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {evt.case_id || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
