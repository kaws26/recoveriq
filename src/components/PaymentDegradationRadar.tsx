// RecoverIQ — Payment Degradation & Outage Intelligence Radar
import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ShieldAlert,
  Clock,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { PaymentDegradationAlert } from '../types';
import { fetchDegradationAlerts, toggleDegradationMitigation } from '../lib/api';

export const PaymentDegradationRadar: React.FC = () => {
  const [alerts, setAlerts] = useState<PaymentDegradationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadAlerts = () => {
    setLoading(true);
    fetchDegradationAlerts()
      .then((data) => setAlerts(data))
      .catch((err) => console.error('Failed to load degradation alerts', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleToggle = async (alertId: string, currentActive: boolean) => {
    setActionInProgress(alertId);
    try {
      const res = await toggleDegradationMitigation(alertId, !currentActive);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
    } catch (err: any) {
      alert(`Mitigation update failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div id="payment-degradation-radar" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Real-time Outage Radar
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Payment Rail & Issuer Degradation Intelligence
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Detects upstream banking server failures, spike anomalies, and applies adaptive cooldowns to protect retry budgets and conversion rates.
            </p>
          </div>

          <button
            onClick={loadAlerts}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Radar
          </button>
        </div>
      </div>

      {/* Degradation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {alerts.map((alert) => {
          const isDegraded = alert.status === 'DEGRADED';
          const isDown = alert.status === 'OUTAGE';
          const isHealthy = alert.status === 'HEALTHY';

          return (
            <div
              key={alert.id}
              className={`rounded-2xl border p-5 bg-white shadow-xs transition-all ${
                isDegraded
                  ? 'border-amber-300/80 bg-amber-50/20 ring-1 ring-amber-200'
                  : isDown
                  ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-200'
                  : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isDegraded ? 'bg-amber-500 animate-ping' : isDown ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                    }`}
                  />
                  {alert.issuer_or_network}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isDegraded
                      ? 'bg-amber-100 text-amber-800'
                      : isDown
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {alert.status}
                </span>
              </div>

              {/* Spike Metric */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                    Failure Rate
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {alert.current_failure_rate}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Baseline: {alert.baseline_failure_rate}%
                  </span>
                </div>

                {alert.failure_spike_percentage > 50 && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <TrendingUp className="w-3 h-3" />
                      +{alert.failure_spike_percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Spike Anomaly</span>
                  </div>
                )}
              </div>

              {/* Impact stats */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 rounded-lg bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Impacted Payments</span>
                  <span className="font-bold text-slate-800">{alert.affected_payments_count} txs</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Volume at Risk</span>
                  <span className="font-bold text-slate-800">₹{alert.affected_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Mitigation block */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-4">
                <span className="font-semibold text-slate-900 block mb-0.5">Recommended Mitigation:</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {alert.recommended_mitigation}
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Auto-Cooldown Active
                </span>
                <button
                  onClick={() => handleToggle(alert.id, alert.mitigation_active)}
                  disabled={actionInProgress === alert.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    alert.mitigation_active
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {alert.mitigation_active ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
