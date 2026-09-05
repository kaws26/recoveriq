// RecoverIQ — Enterprise Command Palette (Cmd+K)
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Zap,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Server,
  Play,
  Terminal,
  Clock,
  ArrowRight,
  User,
  Sliders,
  DollarSign,
  Flame,
  FileText,
  Key,
} from 'lucide-react';
import { EnterpriseRole } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onSelectRole: (role: EnterpriseRole) => void;
  currentRole: EnterpriseRole;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'NAVIGATION' | 'ACTIONS' | 'ROLES' | 'TEST_SUITES';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectRole,
  currentRole,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav_overview',
      title: 'Go to Recovery Command Center (Overview)',
      category: 'NAVIGATION',
      icon: <Activity className="w-4 h-4 text-indigo-600" />,
      action: () => onNavigate('overview'),
    },
    {
      id: 'nav_cases',
      title: 'Go to Revenue at Risk Workspace',
      category: 'NAVIGATION',
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      action: () => onNavigate('cases'),
    },
    {
      id: 'nav_test_workflows',
      title: 'Go to Enterprise Test Workflows & Sandbox',
      category: 'NAVIGATION',
      shortcut: 'T',
      icon: <Terminal className="w-4 h-4 text-blue-600" />,
      action: () => onNavigate('test_workflows'),
    },
    {
      id: 'nav_maker_checker',
      title: 'Go to Maker-Checker Approval Queue (4-Eye)',
      category: 'NAVIGATION',
      shortcut: 'M',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      action: () => onNavigate('maker_checker'),
    },
    {
      id: 'nav_gateways',
      title: 'Go to Gateway Routing Matrix & Health Radar',
      category: 'NAVIGATION',
      shortcut: 'G',
      icon: <Server className="w-4 h-4 text-cyan-600" />,
      action: () => onNavigate('gateways'),
    },
    {
      id: 'nav_lift',
      title: 'Go to Recovery Lift Lab & Benchmarks',
      category: 'NAVIGATION',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
      action: () => onNavigate('lift'),
    },
    {
      id: 'nav_degradation',
      title: 'Go to Outage & Switch Radar',
      category: 'NAVIGATION',
      icon: <Flame className="w-4 h-4 text-rose-600" />,
      action: () => onNavigate('degradation'),
    },
    {
      id: 'nav_unrecovered',
      title: 'Go to Unrecovered Revenue Autopsy',
      category: 'NAVIGATION',
      icon: <Activity className="w-4 h-4 text-slate-600" />,
      action: () => onNavigate('unrecovered'),
    },
    {
      id: 'nav_policy_simulator',
      title: 'Go to Policy Simulator & AI Co-Pilot',
      category: 'NAVIGATION',
      icon: <Sliders className="w-4 h-4 text-indigo-500" />,
      action: () => onNavigate('policy_simulator'),
    },
    {
      id: 'nav_audit',
      title: 'Go to Immutable Audit Trail (SOC2 Ledger)',
      category: 'NAVIGATION',
      icon: <FileText className="w-4 h-4 text-slate-500" />,
      action: () => onNavigate('audit'),
    },

    // Roles
    {
      id: 'role_admin',
      title: 'Switch Role: Merchant Admin',
      category: 'ROLES',
      icon: <User className="w-4 h-4 text-indigo-600" />,
      action: () => onSelectRole('MERCHANT_ADMIN'),
    },
    {
      id: 'role_risk',
      title: 'Switch Role: Risk Officer (Authorizer)',
      category: 'ROLES',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      action: () => onSelectRole('RISK_OFFICER'),
    },
    {
      id: 'role_ops',
      title: 'Switch Role: Payment Ops (Maker)',
      category: 'ROLES',
      icon: <Zap className="w-4 h-4 text-amber-600" />,
      action: () => onSelectRole('PAYMENT_OPS'),
    },
    {
      id: 'role_super',
      title: 'Switch Role: Platform Super Admin',
      category: 'ROLES',
      icon: <Server className="w-4 h-4 text-cyan-600" />,
      action: () => onSelectRole('SUPER_ADMIN'),
    },
    {
      id: 'role_auditor',
      title: 'Switch Role: Compliance Auditor',
      category: 'ROLES',
      icon: <FileText className="w-4 h-4 text-slate-600" />,
      action: () => onSelectRole('AUDITOR'),
    },

    // Actions & Test Workflows
    {
      id: 'action_run_upi',
      title: 'Execute UPI AutoPay Mandate Recovery Test',
      category: 'TEST_SUITES',
      icon: <Play className="w-4 h-4 text-emerald-600" />,
      action: () => {
        onNavigate('test_workflows');
      },
    },
    {
      id: 'action_run_outage',
      title: 'Simulate Banking Switch Outage Cascade',
      category: 'TEST_SUITES',
      icon: <Flame className="w-4 h-4 text-rose-600" />,
      action: () => {
        onNavigate('test_workflows');
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    return (
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-white">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, navigate view, switch role, or test suite..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full text-sm bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400"
          />
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            ESC
          </div>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isSelected ? 'text-white' : ''}>{cmd.icon}</span>
                    <span>{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Active Role: <strong className="text-slate-700 font-mono">{currentRole}</strong></span>
        </div>
      </div>
    </div>
  );
};
