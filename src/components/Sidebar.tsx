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
  Terminal,
  Lock,
  Server,
  Command,
  ChevronUp,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { EnterpriseRole, EnterpriseUser } from '../types';
import { UserProfileMenu, ROLE_DEFINITIONS } from './UserProfileMenu';
import { ThemeToggle } from './ThemeToggle';

export type NavTab =
  | 'overview'
  | 'payments'
  | 'recovery'
  | 'test_workflows'
  | 'maker_checker'
  | 'gateways'
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
  onOpenCommandPalette?: () => void;
  needsActionCount?: number;
  pendingApprovalsCount?: number;
  currentRole?: EnterpriseRole;
  onSelectRole?: (role: EnterpriseRole) => void;
  currentUser?: EnterpriseUser;
  onLogout?: () => void;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenRecordModal,
  onOpenHelpModal,
  onOpenCreatePayment,
  onOpenOnboarding,
  onOpenCommandPalette,
  needsActionCount = 3,
  pendingApprovalsCount = 1,
  currentRole = 'MERCHANT_ADMIN',
  onSelectRole,
  currentUser,
  onLogout,
  onOpenAuthModal,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    isNew?: boolean;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    {
      id: 'recovery',
      label: 'Recovery Hub',
      icon: RotateCcw,
      badge: needsActionCount > 0 ? needsActionCount : undefined,
    },
    {
      id: 'test_workflows',
      label: 'Enterprise Test Workflows',
      icon: Terminal,
      badge: '6 Suites',
    },
    {
      id: 'maker_checker',
      label: 'Maker-Checker Approvals',
      icon: Lock,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    {
      id: 'gateways',
      label: 'Gateway Routing Matrix',
      icon: Server,
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

  const activeRoleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.MERCHANT_ADMIN;
  const activeUser: EnterpriseUser = currentUser || {
    id: 'usr_default',
    name: activeRoleMeta.name,
    email: activeRoleMeta.email,
    role: currentRole,
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 select-none z-30 font-['Inter'] min-h-0 transition-colors">
      {/* Brand & Workspace Header (Fixed at top of sidebar) */}
      <div className="shrink-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white shadow-sm border border-slate-700/50">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">
                Recover<span className="text-emerald-600 dark:text-emerald-400">IQ</span>
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                Revenue Recovery
              </span>
            </div>
          </div>

          {/* Merchant Organization Switcher Preview */}
          <div className="mt-3.5 flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">Acme Commerce</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Live Gateway
                </span>
              </div>
            </div>

            {onOpenOnboarding && (
              <button
                onClick={onOpenOnboarding}
                title="Merchant Setup Wizard"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                      isActive
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
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
      <div className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
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
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Failed Payment</span>
        </button>

        {/* Command Palette Trigger (Cmd+K) */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <div className="flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Command Palette</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-500 dark:text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Help & Documentation + Quick Theme Button */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <button
            onClick={onOpenHelpModal}
            className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>Help & Docs</span>
          </button>
          <ThemeToggle variant="icon" />
        </div>

        {/* User Profile Popover Menu (anchored above profile button) */}
        <UserProfileMenu
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          currentUser={activeUser}
          onSelectRole={(newRole) => {
            if (onSelectRole) onSelectRole(newRole);
          }}
          onNavigate={onSelectTab}
          onLogout={() => {
            setIsProfileMenuOpen(false);
            if (onLogout) onLogout();
            else if (onOpenAuthModal) onOpenAuthModal();
          }}
        />

        {/* Enterprise Role Switcher & Merchant Account */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 px-1 relative">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeRoleMeta.avatarBg}`} />
              Active Role
            </span>
            {onSelectRole && (
              <select
                id="sidebar-role-selector"
                value={currentRole}
                onChange={(e) => onSelectRole(e.target.value as EnterpriseRole)}
                className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[150px] truncate"
              >
                <option value="MERCHANT_ADMIN">Merchant Admin</option>
                <option value="PAYMENT_OPS">Payment Ops (Maker)</option>
                <option value="RISK_OFFICER">Risk Officer (Checker)</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="AUDITOR">Compliance Auditor</option>
              </select>
            )}
          </div>

          {/* Clickable Profile Card Button + Quick Logout */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="sidebar-user-profile-button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className={`flex-1 min-w-0 flex items-center justify-between p-2 rounded-xl transition-all border text-left cursor-pointer group ${
                isProfileMenuOpen
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
              }`}
              title="Click to view profile, switch roles, or open settings"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${activeRoleMeta.avatarBg} ${activeRoleMeta.avatarText} shadow-2xs`}
                >
                  {activeRoleMeta.initials}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {activeUser.name || activeRoleMeta.name}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {activeUser.email || activeRoleMeta.email}
                  </span>
                </div>
              </div>

              <ChevronUp
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isProfileMenuOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
            </button>

            {/* Quick Logout Button */}
            {(onLogout || onOpenAuthModal) && (
              <button
                type="button"
                id="sidebar-quick-logout-button"
                onClick={() => {
                  if (onLogout) onLogout();
                  else if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800/80 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400 transition-all cursor-pointer shrink-0"
                title="Sign out / Switch account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
