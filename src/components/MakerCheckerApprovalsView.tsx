// RecoverIQ — Enterprise Dual-Authorization (Maker-Checker 4-Eye) Governance View
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { MakerCheckerRequest, EnterpriseRole } from '../types';
import {
  fetchMakerCheckerRequests,
  approveMakerCheckerRequest,
  rejectMakerCheckerRequest,
} from '../lib/api';
import { formatINR, formatDate, timeAgo } from '../lib/utils';

interface MakerCheckerApprovalsViewProps {
  currentRole: EnterpriseRole;
  onOpenCaseDetail?: (caseId: string) => void;
}

export const MakerCheckerApprovalsView: React.FC<MakerCheckerApprovalsViewProps> = ({
  currentRole,
  onOpenCaseDetail,
}) => {
  const [requests, setRequests] = useState<MakerCheckerRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MakerCheckerRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMakerCheckerRequests();
      setRequests(data);
      if (data.length > 0 && !selectedRequest) {
        setSelectedRequest(data[0]);
      }
    } catch (err) {
      console.error('Failed to load maker-checker requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reqId: string) => {
    setIsProcessing(true);
    try {
      const result = await approveMakerCheckerRequest(
        reqId,
        {
          user_id: 'usr_risk_01',
          name: 'Meera Iyer',
          role: currentRole,
        },
        reviewNotes || 'Approved per risk criteria and customer lifetime value.'
      );
      setActionSuccessMessage(result.message);
      setRequests((prev) => prev.map((r) => (r.id === reqId ? result.request : r)));
      setSelectedRequest(result.request);
      setReviewNotes('');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reqId: string) => {
    setIsProcessing(true);
    try {
      const result = await rejectMakerCheckerRequest(
        reqId,
        {
          user_id: 'usr_risk_01',
          name: 'Meera Iyer',
          role: currentRole,
        },
        reviewNotes || 'Declined due to policy threshold risk constraints.'
      );
      setActionSuccessMessage(result.message);
      setRequests((prev) => prev.map((r) => (r.id === reqId ? result.request : r)));
      setSelectedRequest(result.request);
      setReviewNotes('');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Rejection failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.case_id.toLowerCase().includes(q) ||
        r.requested_by.name.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.action_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const isRiskOfficerOrAdmin = currentRole === 'MERCHANT_ADMIN' || currentRole === 'RISK_OFFICER';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Lock className="w-3.5 h-3.5" />
            Dual-Authorization Governance (4-Eye Principle)
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Maker-Checker Approval Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Enforces strict separation of duties. High-value recovery overrides, write-offs, and custom dunning campaigns require independent authorization from a designated Risk Officer before execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center">
            <div className="text-2xl font-black text-amber-400 font-mono">{pendingCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Pending Review</div>
          </div>
          <button
            onClick={loadRequests}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh Approvals"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionSuccessMessage}
        </div>
      )}

      {/* Main Content Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Request List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by case, requester, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {(['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* List Cards */}
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                Loading approvals queue...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                No authorization requests match criteria.
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                const isPending = req.status === 'PENDING_APPROVAL';

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-50'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                              isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : req.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {req.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {formatINR(req.amount)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">
                          {req.action_type.replace(/_/g, ' ')}
                        </h4>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400">
                        {timeAgo(req.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {req.reason}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Maker: <strong className="text-slate-700">{req.requested_by.name}</strong></span>
                      <span className="font-mono text-slate-400">{req.case_id}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Request Authorization Review */}
        <div className="lg:col-span-7">
          {selectedRequest ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      {selectedRequest.action_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{selectedRequest.id}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-mono">
                    {formatINR(selectedRequest.amount)}
                  </h2>
                </div>

                {onOpenCaseDetail && (
                  <button
                    onClick={() => onOpenCaseDetail(selectedRequest.case_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Case
                  </button>
                )}
              </div>

              {/* Requester & Case Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Maker (Requester)</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedRequest.requested_by.name}</div>
                  <div className="text-[11px] text-slate-500">{selectedRequest.requested_by.role}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
                  <div className="font-mono text-slate-900 mt-0.5">{formatDate(selectedRequest.created_at)}</div>
                  <div className="text-[11px] text-slate-500">Case: {selectedRequest.case_id}</div>
                </div>
              </div>

              {/* Justification & Business Context */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Exception</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
                    {selectedRequest.reason}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Business Justification & Impact Notes</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono">
                    {selectedRequest.justification_notes}
                  </div>
                </div>
              </div>

              {/* Review Status or Action Box */}
              {selectedRequest.status === 'PENDING_APPROVAL' ? (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <h4 className="text-xs font-bold text-amber-900">
                      Dual-Authorization Action (Checker)
                    </h4>
                  </div>

                  {!isRiskOfficerOrAdmin && (
                    <div className="p-2.5 rounded-lg bg-amber-100 text-amber-900 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>
                        Your current role (<strong>{currentRole}</strong>) is read-only for approvals. Switch to <strong>RISK_OFFICER</strong> or <strong>MERCHANT_ADMIN</strong> to authorize this request.
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Checker Compliance Audit Notes</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Enter verification notes for SOC2 compliance trail..."
                      rows={3}
                      disabled={!isRiskOfficerOrAdmin || isProcessing}
                      className="w-full p-2.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={!isRiskOfficerOrAdmin || isProcessing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold border border-rose-300 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject Request
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={!isRiskOfficerOrAdmin || isProcessing}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Grant Dual-Approval
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {selectedRequest.status === 'APPROVED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      Review Decision: {selectedRequest.status}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {selectedRequest.reviewed_at ? formatDate(selectedRequest.reviewed_at) : ''}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Reviewed By: <strong className="text-slate-900">{selectedRequest.reviewed_by?.name}</strong> ({selectedRequest.reviewed_by?.role})
                  </div>
                  {selectedRequest.review_notes && (
                    <p className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-slate-700">
                      "{selectedRequest.review_notes}"
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              Select an authorization request from the queue to view full context.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
