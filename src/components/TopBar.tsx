import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  CreditCard,
  User,
  ShieldAlert,
  Activity,
  ArrowRight,
  Sparkles,
  Command,
  Clock,
  ExternalLink,
  ChevronRight,
  Sliders,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Payment, Customer, RevenueRiskCase, AuditEvent } from '../types';
import { NavTab } from './Sidebar';
import { formatINR, cn, formatDate, timeAgo } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  payments: Payment[];
  customers: Customer[];
  cases: RevenueRiskCase[];
  auditEvents?: AuditEvent[];
  dateRange: '7d' | '30d' | '90d';
  onDateRangeChange: (range: '7d' | '30d' | '90d') => void;
  onResetData: () => void;
  isResetting: boolean;
  onOpenRecordModal: () => void;
  onSelectTab: (tab: NavTab) => void;
  onSelectCase: (riskCase: RevenueRiskCase) => void;
}

type SearchCategory = 'all' | 'payments' | 'customers' | 'cases' | 'events';

export const TopBar: React.FC<TopBarProps> = ({
  payments,
  customers,
  cases,
  auditEvents = [],
  dateRange,
  onDateRangeChange,
  onResetData,
  isResetting,
  onOpenRecordModal,
  onSelectTab,
  onSelectCase,
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard shortcut listener for ⌘K / Ctrl+K and '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close search popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and group search results
  const searchResults = useMemo(() => {
    const q = searchVal.trim().toLowerCase();

    // Matching Payments
    const matchedPayments = payments
      .filter((p) => {
        if (!q) return false;
        return (
          p.id.toLowerCase().includes(q) ||
          p.customer?.name.toLowerCase().includes(q) ||
          p.customer?.email.toLowerCase().includes(q) ||
          p.payment_method.toLowerCase().includes(q) ||
          p.failure_reason?.toLowerCase().includes(q) ||
          p.failure_code?.toLowerCase().includes(q) ||
          p.failure_description?.toLowerCase().includes(q) ||
          p.amount.toString().includes(q) ||
          p.status.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);

    // Matching Customers
    const matchedCustomers = customers
      .filter((c) => {
        if (!q) return false;
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);

    // Matching Cases
    const matchedCases = cases
      .filter((c) => {
        if (!q) return false;
        return (
          c.id.toLowerCase().includes(q) ||
          c.payment_id.toLowerCase().includes(q) ||
          c.customer_name?.toLowerCase().includes(q) ||
          c.diagnostic_issue?.toLowerCase().includes(q) ||
          c.recommended_action?.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q) ||
          c.at_risk_amount.toString().includes(q)
        );
      })
      .slice(0, 4);

    // Matching Events / Audit Trail
    const matchedEvents = auditEvents
      .filter((evt) => {
        if (!q) return false;
        return (
          evt.id.toLowerCase().includes(q) ||
          evt.summary?.toLowerCase().includes(q) ||
          evt.event_type?.toLowerCase().includes(q) ||
          evt.case_id?.toLowerCase().includes(q) ||
          evt.actor?.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);

    // Navigation / Quick Actions
    const quickActions = [
      {
        id: 'qa-recovery',
        title: 'Open Recovery Workspace',
        desc: 'Review and execute pending payment recovery cases',
        tab: 'recovery' as NavTab,
        icon: ShieldAlert,
      },
      {
        id: 'qa-payments',
        title: 'View Payments Ledger',
        desc: 'Filter and inspect full gateway transaction records',
        tab: 'payments' as NavTab,
        icon: CreditCard,
      },
      {
        id: 'qa-customers',
        title: 'Customer Directory',
        desc: 'View customer lifetime value and payment reliability',
        tab: 'customers' as NavTab,
        icon: User,
      },
      {
        id: 'qa-reports',
        title: 'Financial Reports & Ledger',
        desc: 'Download CSV reconciliation ledgers and recovery yields',
        tab: 'reports' as NavTab,
        icon: FileSpreadsheet,
      },
      {
        id: 'qa-settings',
        title: 'Recovery Policy & Ceilings',
        desc: 'Configure automated retry ceilings and high-value limits',
        tab: 'settings' as NavTab,
        icon: Sliders,
      },
    ].filter((a) => {
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
    });

    return {
      payments: matchedPayments,
      customers: matchedCustomers,
      cases: matchedCases,
      events: matchedEvents,
      quickActions: quickActions.slice(0, q ? 3 : 5),
    };
  }, [searchVal, payments, customers, cases, auditEvents]);

  // Flatten active items for keyboard navigation
  const flatItems = useMemo(() => {
    const list: Array<{
      type: 'payment' | 'customer' | 'case' | 'event' | 'action';
      data: any;
    }> = [];

    if (activeCategory === 'all' || activeCategory === 'payments') {
      searchResults.payments.forEach((p) => list.push({ type: 'payment', data: p }));
    }
    if (activeCategory === 'all' || activeCategory === 'customers') {
      searchResults.customers.forEach((c) => list.push({ type: 'customer', data: c }));
    }
    if (activeCategory === 'all' || activeCategory === 'cases') {
      searchResults.cases.forEach((c) => list.push({ type: 'case', data: c }));
    }
    if (activeCategory === 'all' || activeCategory === 'events') {
      searchResults.events.forEach((e) => list.push({ type: 'event', data: e }));
    }
    if (activeCategory === 'all') {
      searchResults.quickActions.forEach((a) => list.push({ type: 'action', data: a }));
    }

    return list;
  }, [searchResults, activeCategory]);

  const totalResultsCount =
    searchResults.payments.length +
    searchResults.customers.length +
    searchResults.cases.length +
    searchResults.events.length;

  const handleSelectResult = (item: (typeof flatItems)[0]) => {
    setIsOpen(false);
    setSearchVal('');

    if (item.type === 'payment') {
      const payment: Payment = item.data;
      const associatedCase = cases.find((c) => c.payment_id === payment.id);
      if (associatedCase) {
        onSelectCase(associatedCase);
      } else {
        onSelectTab('payments');
      }
    } else if (item.type === 'case') {
      const riskCase: RevenueRiskCase = item.data;
      onSelectCase(riskCase);
    } else if (item.type === 'customer') {
      onSelectTab('customers');
    } else if (item.type === 'event') {
      onSelectTab('activity');
    } else if (item.type === 'action') {
      onSelectTab(item.data.tab);
    }
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, flatItems.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        handleSelectResult(flatItems[selectedIndex]);
      }
    }
  };

  const notifications = [
    {
      id: 'n1',
      title: '₹14,999 Recovered',
      desc: 'Annual subscription payment for Ananya Deshmukh captured via delayed retry.',
      time: '18m ago',
      type: 'success',
      actionTab: 'recovery' as NavTab,
    },
    {
      id: 'n2',
      title: 'High-Value Payment Needs Review',
      desc: '₹38,500 enterprise payment for Priya Venkatesh escalated due to policy ceiling.',
      time: '45m ago',
      type: 'warning',
      actionTab: 'recovery' as NavTab,
    },
    {
      id: 'n3',
      title: 'Recovery Velocity Up +12.8%',
      desc: 'Smart retry cooldowns improved your overall recovery rate to 71.9% this week.',
      time: '2h ago',
      type: 'info',
      actionTab: 'insights' as NavTab,
    },
  ];

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Global Search with Spotlight Popup */}
      <div className="relative flex-1 max-w-lg" ref={searchContainerRef}>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search payments (pay_...), customers, cases, or events..."
            value={searchVal}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchVal(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            className="w-full bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 rounded-lg pl-9 pr-14 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchVal ? (
              <button
                type="button"
                onClick={() => {
                  setSearchVal('');
                  inputRef.current?.focus();
                }}
                className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono shadow-2xs">
                <span>⌘</span>K
              </kbd>
            )}
          </div>
        </div>

        {/* Floating Spotlight Dropdown */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-full sm:w-[540px] max-w-[90vw] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 text-xs">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 overflow-x-auto">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Filter:
              </span>
              {(
                [
                  { id: 'all', label: 'All Results' },
                  { id: 'payments', label: `Payments (${searchResults.payments.length})` },
                  { id: 'customers', label: `Customers (${searchResults.customers.length})` },
                  { id: 'cases', label: `Recovery Cases (${searchResults.cases.length})` },
                  { id: 'events', label: `Events (${searchResults.events.length})` },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedIndex(0);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap',
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scrollable Results Container */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {/* No Query / Initial Suggested State */}
              {!searchVal.trim() && (
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Quick Navigation</span>
                    <span className="text-[10px] font-normal text-slate-400">Type to search anything</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    {searchResults.quickActions.map((action, idx) => {
                      const Icon = action.icon;
                      const isHighlighted = selectedIndex === idx;
                      return (
                        <div
                          key={action.id}
                          onClick={() => {
                            setIsOpen(false);
                            onSelectTab(action.tab);
                          }}
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                            isHighlighted ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold block text-slate-900">{action.title}</span>
                              <span className="text-[11px] text-slate-500">{action.desc}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-2">
                      Suggested Searches
                    </span>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {['UPI Timeout', 'HDFC Bank', 'High Value', 'pay_rec_', 'Rahul Verma', 'Insufficient Funds'].map(
                        (tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSearchVal(tag);
                              setSelectedIndex(0);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Has Query but Empty Results */}
              {searchVal.trim() && totalResultsCount === 0 && searchResults.quickActions.length === 0 && (
                <div className="py-10 text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-900 text-xs">
                    No results found for "{searchVal}"
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Try searching by payment ID (e.g. pay_...), customer name, amount, or failure reason.
                  </p>
                </div>
              )}

              {/* Payments Section */}
              {(activeCategory === 'all' || activeCategory === 'payments') &&
                searchResults.payments.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Payments & Invoices
                    </div>
                    {searchResults.payments.map((p) => {
                      const isHighlighted =
                        flatItems[selectedIndex]?.type === 'payment' &&
                        flatItems[selectedIndex]?.data.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() =>
                            handleSelectResult({ type: 'payment', data: p })
                          }
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                            isHighlighted ? 'bg-slate-100' : 'hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                              <CreditCard className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 font-['JetBrains_Mono']">
                                  {p.id}
                                </span>
                                <span className="uppercase text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600">
                                  {p.payment_method}
                                </span>
                                <span
                                  className={cn(
                                    'text-[10px] px-1.5 py-0.2 rounded font-semibold',
                                    p.status === 'captured'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  )}
                                >
                                  {p.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {p.customer?.name || 'Customer'} • {p.failure_description || p.failure_reason}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-3">
                            <div className="font-bold text-slate-900 font-['JetBrains_Mono']">
                              {formatINR(p.amount)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {timeAgo(p.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Customers Section */}
              {(activeCategory === 'all' || activeCategory === 'customers') &&
                searchResults.customers.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Customers
                    </div>
                    {searchResults.customers.map((c) => {
                      const isHighlighted =
                        flatItems[selectedIndex]?.type === 'customer' &&
                        flatItems[selectedIndex]?.data.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() =>
                            handleSelectResult({ type: 'customer', data: c })
                          }
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                            isHighlighted ? 'bg-slate-100' : 'hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">
                                {c.name}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate block">
                                {c.email} • {c.phone}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-3">
                            <span className="font-bold text-slate-900 font-['JetBrains_Mono'] block">
                              {formatINR(c.lifetime_value)} LTV
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              {c.payment_success_rate}% success
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Recovery Cases Section */}
              {(activeCategory === 'all' || activeCategory === 'cases') &&
                searchResults.cases.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Recovery Workspace Cases
                    </div>
                    {searchResults.cases.map((cs) => {
                      const isHighlighted =
                        flatItems[selectedIndex]?.type === 'case' &&
                        flatItems[selectedIndex]?.data.id === cs.id;
                      return (
                        <div
                          key={cs.id}
                          onClick={() =>
                            handleSelectResult({ type: 'case', data: cs })
                          }
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                            isHighlighted ? 'bg-slate-100' : 'hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 font-['JetBrains_Mono']">
                                  {cs.id}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700">
                                  {cs.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {cs.diagnostic_issue} • Rec: {cs.recommended_action}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-3">
                            <div className="font-bold text-rose-600 font-['JetBrains_Mono']">
                              {formatINR(cs.at_risk_amount)}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-semibold">
                              {Math.round((cs.recovery_likelihood || 0.75) * 100)}% Win Prob
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Events & Activity Section */}
              {(activeCategory === 'all' || activeCategory === 'events') &&
                searchResults.events.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Transaction Events & Logs
                    </div>
                    {searchResults.events.map((evt) => {
                      const isHighlighted =
                        flatItems[selectedIndex]?.type === 'event' &&
                        flatItems[selectedIndex]?.data.id === evt.id;
                      return (
                        <div
                          key={evt.id}
                          onClick={() =>
                            handleSelectResult({ type: 'event', data: evt })
                          }
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                            isHighlighted ? 'bg-slate-100' : 'hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                              <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">
                                  {evt.event_type}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {evt.actor}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {evt.summary}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-3 text-[10px] text-slate-400">
                            {timeAgo(evt.timestamp)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>

            {/* Footer with Keyboard Hints */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                    esc
                  </kbd>
                  <span>Close</span>
                </span>
              </div>
              <span className="text-slate-400 text-[10px]">RecoverIQ Unified Index</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Date Range, Live Status, Theme Toggle, Notifications, Reset */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Date Range Selector */}
        <div className="hidden sm:flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onDateRangeChange(range)}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer',
                dateRange === range
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>

        {/* Live Automation Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Automated Recovery Active</span>
        </div>

        {/* Distinct Divider Separating Business Controls from Utility Actions */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700/80 mx-0.5 hidden sm:block" />

        {/* Theme Mode Selector Island */}
        <ThemeToggle variant="dropdown" />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                <span
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline"
                >
                  Mark all as read
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 space-y-1 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onSelectTab(n.actionTab);
                    }}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reseed Data button */}
        <button
          onClick={onResetData}
          disabled={isResetting}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset Seed Data"
        >
          <RefreshCw className={cn('w-4 h-4', isResetting && 'animate-spin text-slate-600 dark:text-slate-300')} />
        </button>
      </div>
    </header>
  );
};
