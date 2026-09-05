import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  RotateCcw,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Activity,
  Sliders,
  Shield,
  HelpCircle,
  Plus,
  CheckCircle2,
  Building2,
  Sparkles,
  Link2,
  Award,
  AlertOctagon,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../lib/utils';


export type NavTab =
  | 'overview'
  | 'payments'
  | 'recovery'
  | 'lift_lab'
  | 'simulator'
  | 'degradation'
  | 'autopsy'
  | 'customers'
  | 'insights'
  | 'reports'
  | 'activity'
  | 'settings';


interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenRecordModal: () => void;
  onOpenHelpModal: () => void;
  onOpenCreatePayment?: () => void;
  onOpenOnboarding?: () => void;
  needsActionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenRecordModal,
  onOpenHelpModal,
  onOpenCreatePayment,
  onOpenOnboarding,
  needsActionCount = 3,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    {
      id: 'recovery',
      label: 'Recovery Hub',
      icon: RotateCcw,
      badge: needsActionCount > 0 ? needsActionCount : undefined,
    },
    { id: 'lift_lab', label: 'Recovery Lift Lab', icon: Award },
    { id: 'simulator', label: 'Policy Simulator', icon: SlidersHorizontal },
    { id: 'degradation', label: 'Outage Radar', icon: Activity },
    { id: 'autopsy', label: 'Lost Rev Autopsy', icon: AlertOctagon },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'activity', label: 'Audit Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-30 font-['Inter'] min-h-0">
      {/* Brand & Workspace Header (Fixed at top of sidebar) */}
      <div className="shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">
                Recover<span className="text-emerald-600">IQ</span>
              </span>
              <span className="block text-[11px] text-slate-500 font-medium leading-tight">
                Revenue Recovery
              </span>
            </div>
          </div>

          {/* Merchant Organization Switcher Preview */}
          <div className="mt-3.5 flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-800 block truncate">Acme Commerce</span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Live Gateway
                </span>
              </div>
            </div>

            {onOpenOnboarding && (
              <button
                onClick={onOpenOnboarding}
                title="Merchant Setup Wizard"
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Navigation - Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1 overscroll-contain">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? 'text-slate-900' : 'text-slate-400'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                      isActive
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Quick Actions & Profile (Fixed at bottom of sidebar) */}
      <div className="shrink-0 p-3 border-t border-slate-100 space-y-2 bg-white">
        {/* Create Payment / Payment Link */}
        {onOpenCreatePayment && (
          <button
            onClick={onOpenCreatePayment}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Create Test Payment</span>
          </button>
        )}

        {/* Record Failed Payment Modal Button */}
        <button
          onClick={onOpenRecordModal}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Failed Payment</span>
        </button>

        {/* Help & Documentation */}
        <button
          onClick={onOpenHelpModal}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Help & Documentation</span>
        </button>

        {/* Merchant Account Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
              KS
            </div>
            <div className="text-left overflow-hidden">
              <span className="block text-xs font-semibold text-slate-800 truncate leading-tight">
                Kawaljeet Singh
              </span>
              <span className="block text-[10px] text-slate-500 truncate">
                finance@apexdigital.in
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
