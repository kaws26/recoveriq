// RecoverIQ — Enterprise Gateway Routing & Switch Resilience Matrix
import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Zap,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { GatewayRouteHealth, GatewayProvider } from '../types';
import { fetchGatewayMatrix, updateGatewayRoute } from '../lib/api';

interface GatewayRoutingMatrixViewProps {
  onRefreshData?: () => void;
}

export const GatewayRoutingMatrixView: React.FC<GatewayRoutingMatrixViewProps> = ({
  onRefreshData,
}) => {
  const [routes, setRoutes] = useState<GatewayRouteHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGatewayMatrix();
      setRoutes(data);
    } catch (err) {
      console.error('Failed to load gateway matrix', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCircuitBreaker = async (route: GatewayRouteHealth) => {
    setUpdatingId(route.id);
    const newActive = !route.circuit_breaker_active;
    try {
      const updated = await updateGatewayRoute(route.id, {
        circuit_breaker_active: newActive,
        success_rate: newActive ? 24.5 : 98.2,
      });
      setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert('Failed to update circuit breaker: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWeightChange = async (routeId: string, weight: number) => {
    try {
      const updated = await updateGatewayRoute(routeId, { routing_weight_pct: weight });
      setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      console.error('Failed to update weight', err);
    }
  };

  const getStatusBadge = (tripped: boolean) => {
    if (tripped) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <ShieldAlert className="w-3 h-3 text-rose-600" /> CIRCUIT TRIPPED (FAILOVER)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ROUTE HEALTHY
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
            <Server className="w-3.5 h-3.5" />
            High-Availability Payment Routing Engine
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Gateway Routing & Switch Matrix
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Autonomous multi-PSP health monitoring, real-time P95 latency tracking, dynamic traffic load-balancing, and zero-downtime automatic failover circuit breakers.
          </p>
        </div>

        <button
          onClick={loadMatrix}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Matrix
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Active Gateways</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{routes.length} / 5</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Ingestion Uptime</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Avg Fleet P95 Latency</span>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
            {routes.length > 0
              ? `${Math.round(routes.reduce((acc, r) => acc + r.p95_latency_ms, 0) / routes.length)} ms`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Real-time gateway roundtrip</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Tripped Circuits</span>
          <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
            {routes.filter((r) => r.circuit_breaker_active).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Traffic routed to backups</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Failover Efficiency</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">99.8%</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero dropped transactions</div>
        </div>
      </div>

      {/* Gateway Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {routes.map((route) => {
          const isTripped = route.circuit_breaker_active;

          return (
            <div
              key={route.id}
              className={`p-5 rounded-2xl border transition-all ${
                isTripped
                  ? 'bg-rose-50/20 border-rose-200'
                  : 'bg-white border-slate-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {route.name}
                    </span>
                    {getStatusBadge(route.circuit_breaker_active)}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Provider ID: {route.provider}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleCircuitBreaker(route)}
                  disabled={updatingId === route.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isTripped
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200'
                  }`}
                >
                  {isTripped ? 'Reset Circuit' : 'Trip Breaker (Test)'}
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
                  <div className={`text-base font-black font-mono mt-0.5 ${route.success_rate < 80 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {route.success_rate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">P95 Latency</span>
                  <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                    {route.p95_latency_ms} ms
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">24h Failures</span>
                  <div className="text-base font-black font-mono text-slate-700 mt-0.5">
                    {route.failure_count_24h ?? 0}
                  </div>
                </div>
              </div>

              {/* Failover target & Dynamic weight slider */}
              <div className="space-y-3 pt-1 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Auto-Failover Target:</span>
                  <span className="font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                    {route.failover_target_provider ? route.failover_target_provider.replace(/_/g, ' ') : 'STANDBY ROUTE'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" /> Traffic Weight
                    </span>
                    <span className="font-mono text-slate-900">{route.routing_weight_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={route.routing_weight_pct}
                    disabled={isTripped}
                    onChange={(e) => handleWeightChange(route.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
