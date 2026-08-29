import React from 'react';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Cpu,
  Layers,
  ChevronRight,
  BarChart3,
  Activity,
  ListOrdered,
  Bot,
  Users,
  Settings,
  History,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '../lib/utils';

export type NavTab =
  | 'overview'
  | 'command_center'
  | 'queue'
  | 'revenue_at_risk'
  | 'ai_decisions'
  | 'analytics'
  | 'audit_trail'
  | 'customers'
  | 'settings';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onRunDemo: () => void;
  onOpenIngestModal: () => void;
  onReseedData: () => void;
  isDemoRunning: boolean;
  isReseeding: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onRunDemo,
  onOpenIngestModal,
  onReseedData,
  isDemoRunning,
  isReseeding,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'command_center', label: 'AI Command Center', icon: Sparkles },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'queue', label: 'Recovery Queue', icon: ListOrdered },
    { id: 'revenue_at_risk', label: 'Revenue at Risk', icon: AlertOctagon },
    { id: 'ai_decisions', label: 'AI Decisions', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'audit_trail', label: 'Audit Trail', icon: History },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Policy & Guardrails', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800/80 text-slate-100 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-900/60">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Recover<span className="text-emerald-400">IQ</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded-full">
                  Razorpay Track 03
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Recover lost revenue intelligently
              </p>
            </div>
          </div>

          {/* Engine Status Badges */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">AI Engine:</span>
              <span className="font-semibold text-indigo-300">NVIDIA Nemotron-3</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Execution:</span>
              <span className="font-semibold text-emerald-300">Verified Simulation</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              id="header-ingest-btn"
              onClick={onOpenIngestModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-all shadow-sm"
              title="Inject a custom payment failure event"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ingest Event</span>
            </button>

            <button
              id="header-reseed-btn"
              onClick={onReseedData}
              disabled={isReseeding}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-all"
              title="Reseed database with fresh demo state"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-slate-400', isReseeding && 'animate-spin')} />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              id="header-golden-demo-btn"
              onClick={onRunDemo}
              disabled={isDemoRunning}
              className="relative group flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all disabled:opacity-50"
            >
              <Zap className={cn('w-3.5 h-3.5 text-emerald-200', isDemoRunning && 'animate-bounce')} />
              <span>{isDemoRunning ? 'Executing Journey...' : '1-Click Golden Demo'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60',
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-emerald-400' : 'text-slate-500')} />
                <span>{item.label}</span>
                {item.id === 'command_center' && (
                  <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 text-[10px] rounded border border-indigo-500/30 font-bold">
                    SHOWCASE
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
