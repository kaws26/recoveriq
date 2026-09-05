import React, { useEffect, useRef } from 'react';
import {
  User,
  Shield,
  ShieldCheck,
  Zap,
  Sliders,
  LogOut,
  Check,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Lock,
  Building2,
  FileSpreadsheet,
  Globe,
  X,
} from 'lucide-react';
import { EnterpriseRole, EnterpriseUser } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: EnterpriseUser;
  onSelectRole: (role: EnterpriseRole) => void;
  onNavigate: (tab: any) => void;
  onLogout: () => void;
}

export interface RoleMeta {
  role: EnterpriseRole;
  name: string;
  email: string;
  title: string;
  initials: string;
  description: string;
  badgeClass: string;
  avatarBg: string;
  avatarText: string;
  permissionHighlight: string;
}

export const ROLE_DEFINITIONS: Record<EnterpriseRole, RoleMeta> = {
  MERCHANT_ADMIN: {
    role: 'MERCHANT_ADMIN',
    name: 'Kawaljeet Singh',
    email: 'finance@apexdigital.in',
    title: 'Merchant Admin',
    initials: 'KS',
    description: 'Full operational control, gateway policy & recovery management',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarBg: 'bg-blue-100 border-blue-300',
    avatarText: 'text-blue-800',
    permissionHighlight: 'All Permissions • High-Value Approvals • Gateway Routing',
  },
  PAYMENT_OPS: {
    role: 'PAYMENT_OPS',
    name: 'Priya Sharma',
    email: 'ops@apexdigital.in',
    title: 'Payment Ops (Maker)',
    initials: 'PS',
    description: 'Schedules retries, generates payment links & initiates recoveries',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    avatarBg: 'bg-amber-100 border-amber-300',
    avatarText: 'text-amber-800',
    permissionHighlight: 'Maker Role • Can draft & schedule actions • Needs Checker for >₹10k',
  },
  RISK_OFFICER: {
    role: 'RISK_OFFICER',
    name: 'Arjun Mehta',
    email: 'risk@apexdigital.in',
    title: 'Risk Officer (Checker)',
    initials: 'AM',
    description: '4-Eye Dual-Authorization checker for exceptions & write-offs',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    avatarBg: 'bg-purple-100 border-purple-300',
    avatarText: 'text-purple-800',
    permissionHighlight: 'Checker Role • Authorizes Maker-Checker queue • Policy Overrides',
  },
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    name: 'Platform Super Admin',
    email: 'admin@recoveriq.ai',
    title: 'Super Admin',
    initials: 'SA',
    description: 'Global system orchestrator, circuit breaker override & tenant ops',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    avatarBg: 'bg-indigo-100 border-indigo-300',
    avatarText: 'text-indigo-800',
    permissionHighlight: 'Platform Wide • Circuit Breaker Overrides • Tenant Setup',
  },
  AUDITOR: {
    role: 'AUDITOR',
    name: 'Sneha Kapoor',
    email: 'auditor@ey-audit.com',
    title: 'Compliance Auditor',
    initials: 'SK',
    description: 'Read-only access for SOC2, regulatory audit trails & evidence logs',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-100 border-emerald-300',
    avatarText: 'text-emerald-800',
    permissionHighlight: 'Read-Only Audit Trail • SOC2 Export • Immutable Evidence',
  },
  FINANCE_AUDITOR: {
    role: 'FINANCE_AUDITOR',
    name: 'Sneha Kapoor',
    email: 'auditor@ey-audit.com',
    title: 'Finance Auditor',
    initials: 'SK',
    description: 'Read-only access for SOC2, regulatory audit trails & evidence logs',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-100 border-emerald-300',
    avatarText: 'text-emerald-800',
    permissionHighlight: 'Read-Only Audit Trail • Financial Reconciliations',
  },
};

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectRole,
  onNavigate,
  onLogout,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentMeta = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.MERCHANT_ADMIN;
  const availableRoles: EnterpriseRole[] = [
    'MERCHANT_ADMIN',
    'PAYMENT_OPS',
    'RISK_OFFICER',
    'SUPER_ADMIN',
    'AUDITOR',
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Floating User Profile & Role Popover */}
      <div
        ref={popoverRef}
        className="fixed bottom-4 left-4 sm:left-64 w-84 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors"
      >
        {/* User Header Summary */}
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border ${currentMeta.avatarBg} ${currentMeta.avatarText}`}
              >
                {currentMeta.initials}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-white truncate leading-tight">
                  {currentUser.name || currentMeta.name}
                </h3>
                <span className="text-[11px] text-slate-300 font-mono block truncate">
                  {currentUser.email || currentMeta.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Merchant & Role Details */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[140px]">Apex Digital Tech</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${currentMeta.badgeClass}`}
            >
              {currentMeta.title}
            </span>
          </div>
        </div>

        {/* Permissions & Capabilities Summary */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold mb-0.5 uppercase tracking-wider text-[9px]">
            <Shield className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            Active RBAC Capability
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-snug">{currentMeta.permissionHighlight}</p>
        </div>

        {/* Role Switcher Section */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Switch Role (Instant RBAC)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">5 Roles</span>
          </div>

          <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
            {availableRoles.map((roleKey) => {
              const meta = ROLE_DEFINITIONS[roleKey];
              const isSelected = currentUser.role === roleKey;

              return (
                <button
                  key={roleKey}
                  id={`switch-role-${roleKey}`}
                  onClick={() => {
                    onSelectRole(roleKey);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 shadow-2xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${meta.avatarBg} ${meta.avatarText}`}
                    >
                      {meta.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {meta.title}
                        </span>
                      </div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {meta.name} • {meta.email}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      Select
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interface Theme Switcher Row */}
        <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Interface Theme</span>
          <ThemeToggle variant="segmented" />
        </div>

        {/* Quick Navigation Links */}
        <div className="p-2 space-y-0.5 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onNavigate('maker_checker');
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Maker-Checker Approval Queue</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('activity');
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Audit Trail (SOC2 Evidence)</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('settings');
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Merchant & API Settings</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Logout Action */}
        <div className="p-2 bg-slate-50 dark:bg-slate-900/80">
          <button
            id="user-profile-logout-button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/80 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>
      </div>
    </>
  );
};
