// RecoverIQ — Policy Simulator & Natural Language Policy Assistant
import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Send,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Info,
} from 'lucide-react';
import { PolicyConfig, PolicySimulationInput, PolicySimulationResult } from '../types';
import { fetchPolicyConfig, updatePolicyConfig, simulatePolicy, parseNaturalPolicy } from '../lib/api';

export const PolicySimulatorView: React.FC = () => {
  const [currentPolicy, setCurrentPolicy] = useState<PolicyConfig | null>(null);
  const [simConfig, setSimConfig] = useState<PolicySimulationInput>({
    max_retries: 3,
    max_recovery_window_hours: 72,
    max_auto_recovery_amount: 25000,
    high_value_review_threshold: 10000,
    quiet_hours_start: 22,
    quiet_hours_end: 8,
    auto_recovery_enabled: true,
    enable_auto_cooldown: true,
    preferred_channels: ['api', 'whatsapp', 'sms'],
  });

  const [simResult, setSimResult] = useState<PolicySimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [naturalPrompt, setNaturalPrompt] = useState('');
  const [isParsingNatural, setIsParsingNatural] = useState(false);
  const [naturalExplanation, setNaturalExplanation] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Load current policy
  useEffect(() => {
    fetchPolicyConfig().then((pol) => {
      setCurrentPolicy(pol);
      setSimConfig({
        max_retries: pol.max_retries,
        max_recovery_window_hours: pol.max_recovery_window_hours,
        max_auto_recovery_amount: pol.max_auto_recovery_amount,
        high_value_review_threshold: pol.high_value_review_threshold,
        quiet_hours_start: pol.quiet_hours_start,
        quiet_hours_end: pol.quiet_hours_end,
        auto_recovery_enabled: pol.auto_recovery_enabled,
        enable_auto_cooldown: true,
        preferred_channels: ['api', 'whatsapp', 'sms'],
      });
      runSimulation({
        max_retries: pol.max_retries,
        max_recovery_window_hours: pol.max_recovery_window_hours,
        max_auto_recovery_amount: pol.max_auto_recovery_amount,
        high_value_review_threshold: pol.high_value_review_threshold,
        quiet_hours_start: pol.quiet_hours_start,
        quiet_hours_end: pol.quiet_hours_end,
        auto_recovery_enabled: pol.auto_recovery_enabled,
        enable_auto_cooldown: true,
        preferred_channels: ['api', 'whatsapp', 'sms'],
      });
    });
  }, []);

  const runSimulation = async (config: PolicySimulationInput) => {
    setIsSimulating(true);
    try {
      const res = await simulatePolicy(config);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation error', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSliderChange = (field: keyof PolicySimulationInput, value: any) => {
    const updated = { ...simConfig, [field]: value };
    setSimConfig(updated);
    runSimulation(updated);
  };

  const handleNaturalPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalPrompt.trim()) return;

    setIsParsingNatural(true);
    setNaturalExplanation(null);
    try {
      const parsed = await parseNaturalPolicy(naturalPrompt);
      if (parsed.extracted_rules && parsed.extracted_rules.length > 0) {
        const updated = { ...simConfig, ...parsed.proposed_policy };
        setSimConfig(updated);
        setNaturalExplanation(parsed.explanation);
        runSimulation(updated);
      } else {
        setNaturalExplanation(parsed.explanation || 'No parameter modifications recognized.');
      }
    } catch (err: any) {
      setNaturalExplanation(`Parsing error: ${err.message}`);
    } finally {
      setIsParsingNatural(false);
    }
  };

  const handleApplyToLive = async () => {
    if (!confirm('Are you sure you want to apply these simulated parameters to your live production policy?')) {
      return;
    }

    setIsApplying(true);
    setApplySuccessMessage(null);
    try {
      await updatePolicyConfig(simConfig);
      setApplySuccessMessage('Production policy guardrails updated successfully!');
      setTimeout(() => setApplySuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to apply policy: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div id="policy-simulator-view" className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sliders className="w-3.5 h-3.5 text-amber-300" />
              Sandbox & What-If Optimizer
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Policy & Guardrail Simulator
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Safely model and stress-test recovery policy adjustments against historical transaction patterns before deploying to production.
            </p>
          </div>

          <button
            onClick={handleApplyToLive}
            disabled={isApplying}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isApplying ? 'Deploying...' : 'Deploy to Live Policy'}
          </button>
        </div>
      </div>

      {applySuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {applySuccessMessage}
        </div>
      )}

      {/* Natural Language Policy Assistant */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Natural Language Policy Assistant</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Type instructions in plain English (e.g., <span className="italic">"Allow 4 retries, review payments over ₹15,000, and quiet hours from 10 PM to 8 AM"</span>)
        </p>

        <form onSubmit={handleNaturalPromptSubmit} className="flex gap-2">
          <input
            type="text"
            value={naturalPrompt}
            onChange={(e) => setNaturalPrompt(e.target.value)}
            placeholder="e.g. Set max retries to 4 and cap auto recovery at 35000"
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isParsingNatural || !naturalPrompt.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isParsingNatural ? 'Interpreting...' : 'Apply Prompt'}
          </button>
        </form>

        {naturalExplanation && (
          <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 font-medium">
            {naturalExplanation}
          </div>
        )}
      </div>

      {/* Main Grid: Controls + Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Simulated Policy Guardrails</span>
            <span className="text-[11px] font-normal text-slate-400">Drag to test outcomes</span>
          </h2>

          {/* Slider 1: Max Retries */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Max Auto Retries per Case</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {simConfig.max_retries} retries
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={simConfig.max_retries}
              onChange={(e) => handleSliderChange('max_retries', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 retry (conservative)</span>
              <span>3 default</span>
              <span>6 retries (aggressive)</span>
            </div>
          </div>

          {/* Slider 2: High Value Review Threshold */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">High-Value Manual Review Threshold</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                ₹{simConfig.high_value_review_threshold.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="2000"
              max="50000"
              step="1000"
              value={simConfig.high_value_review_threshold}
              onChange={(e) => handleSliderChange('high_value_review_threshold', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹2,000 (high manual review)</span>
              <span>₹10,000 standard</span>
              <span>₹50,000 (mostly auto)</span>
            </div>
          </div>

          {/* Slider 3: Max Auto Recovery Amount Cap */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Max Auto-Recovery Cap</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                ₹{simConfig.max_auto_recovery_amount.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="100000"
              step="5000"
              value={simConfig.max_auto_recovery_amount}
              onChange={(e) => handleSliderChange('max_auto_recovery_amount', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Slider 4: Recovery Window (Hours) */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Maximum Recovery Window</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {simConfig.max_recovery_window_hours} hours ({Math.round(simConfig.max_recovery_window_hours / 24)} days)
              </span>
            </div>
            <input
              type="range"
              min="24"
              max="168"
              step="12"
              value={simConfig.max_recovery_window_hours}
              onChange={(e) => handleSliderChange('max_recovery_window_hours', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Toggles */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="font-medium text-slate-700">Enable Outage Auto-Cooldown Protection</span>
              <input
                type="checkbox"
                checked={simConfig.enable_auto_cooldown}
                onChange={(e) => handleSliderChange('enable_auto_cooldown', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="font-medium text-slate-700">Autonomous Multi-Channel Recovery</span>
              <input
                type="checkbox"
                checked={simConfig.auto_recovery_enabled}
                onChange={(e) => handleSliderChange('auto_recovery_enabled', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Right Column: Projected Impact Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {simResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Simulation Outcome
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      simResult.risk_score === 'LOW_RISK'
                        ? 'bg-emerald-100 text-emerald-800'
                        : simResult.risk_score === 'AGGRESSIVE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {simResult.risk_score} Profile
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Projected Performance Impact</h3>
              </div>

              {/* Recovery Rate Delta */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Projected Recovery Rate</span>
                  <span className="text-2xl font-black text-slate-900">
                    {simResult.projected_recovery_rate}%
                  </span>
                </div>
                <div
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    simResult.recovery_rate_delta >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {simResult.recovery_rate_delta >= 0 ? `+${simResult.recovery_rate_delta}%` : `${simResult.recovery_rate_delta}%`}
                </div>
              </div>

              {/* Revenue Delta */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Estimated Recovered Revenue</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ₹{simResult.projected_recovered_revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  {simResult.revenue_delta >= 0 ? `+₹${simResult.revenue_delta.toLocaleString('en-IN')}` : `-₹${Math.abs(simResult.revenue_delta).toLocaleString('en-IN')}`}
                </div>
              </div>

              {/* Sub-Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Auto-Resolved</span>
                  <span className="text-sm font-bold text-slate-800">
                    {simResult.projected_cases_auto_resolved} cases
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Human Review</span>
                  <span className="text-sm font-bold text-slate-800">
                    {simResult.projected_cases_human_review} cases
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Customer Fatigue</span>
                  <span className="text-sm font-bold text-slate-800">
                    {Math.round(simResult.customer_fatigue_rate * 100)}%
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Saved Fees</span>
                  <span className="text-sm font-bold text-emerald-600">
                    ₹{simResult.estimated_gateway_cost_savings}
                  </span>
                </div>
              </div>

              {/* Recommendations */}
              {simResult.recommendations.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-900 block">
                    Optimizer Observations:
                  </span>
                  {simResult.recommendations.map((rec, i) => (
                    <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-indigo-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Running simulation...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
