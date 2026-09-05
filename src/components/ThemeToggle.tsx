import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'dropdown';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className,
  showLabel = false,
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium shrink-0',
          className
        )}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md transition-all whitespace-nowrap text-[11px]',
            theme === 'light'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
          title="Light theme"
        >
          <Sun className="w-3 h-3 shrink-0" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md transition-all whitespace-nowrap text-[11px]',
            theme === 'dark'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
          title="Dark theme"
        >
          <Moon className="w-3 h-3 shrink-0" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md transition-all whitespace-nowrap text-[11px]',
            theme === 'system'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
          title="Match system theme"
        >
          <Laptop className="w-3 h-3 shrink-0" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative inline-block text-left shrink-0', className)} ref={dropdownRef}>
        <button
          type="button"
          id="theme-dropdown-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
            'bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80',
            'border border-slate-200/90 dark:border-slate-700/80 shadow-2xs',
            isOpen && 'ring-2 ring-blue-500/20 border-blue-400 dark:border-blue-600'
          )}
          title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (Click to switch)`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 capitalize">
            {theme === 'system' ? 'Auto' : theme}
          </span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95 text-xs backdrop-blur-md">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
              Select Theme
            </div>
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer',
                theme === 'light'
                  ? 'bg-amber-50 dark:bg-amber-950/40 font-semibold text-amber-700 dark:text-amber-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </div>
              {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer',
                theme === 'dark'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </div>
              {theme === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer',
                theme === 'system'
                  ? 'bg-blue-50 dark:bg-blue-950/40 font-semibold text-blue-700 dark:text-blue-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-blue-500" />
                <span>System Auto</span>
              </div>
              {theme === 'system' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default: Direct icon toggle button with defined container
  return (
    <button
      type="button"
      id="theme-toggle-button"
      onClick={toggleTheme}
      className={cn(
        'p-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-2xs',
        className
      )}
      title={`Current: ${resolvedTheme} mode. Click to toggle to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode.`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      )}
      {showLabel && (
        <span className="ml-1.5 text-xs font-medium">
          {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};
