'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronDown,
  Download,
  Filter,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { exportUserData } from '@/lib/api';
import type { InsightsRange } from '@/lib/insights/derive';
import type { InsightsSlice } from '@/hooks/useInsightsData';

export interface HeaderProps {
  range: InsightsRange;
  onRangeChange: (range: InsightsRange) => void;
  visible: Record<InsightsSlice, boolean>;
  onToggleSlice: (slice: InsightsSlice) => void;
  onRefresh: () => void | Promise<void>;
  isLoading: boolean;
}

const RANGE_OPTIONS: Array<{ value: InsightsRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const FILTER_OPTIONS: Array<{ value: InsightsSlice; label: string }> = [
  { value: 'mood', label: 'Mood' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'habits', label: 'Habits' },
  { value: 'journal', label: 'Journal' },
];

export default function Header({
  range,
  onRangeChange,
  visible,
  onToggleSlice,
  onRefresh,
  isLoading,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<'range' | 'filter' | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click / Escape
  useEffect(() => {
    if (!openMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openMenu]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      const blob = await exportUserData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `shathi-insights-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Unable to export your data.',
      );
    } finally {
      setExporting(false);
    }
  }, []);

  const activeRangeLabel =
    RANGE_OPTIONS.find((o) => o.value === range)?.label ?? 'Last 30 days';

  const activeFilters = FILTER_OPTIONS.filter((o) => visible[o.value]).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="p-6 rounded-[28px] bg-white/60 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-[28px] font-semibold text-[#0F172A] tracking-tight">
            Your Wellness Insights
          </h1>
          <span className="text-2xl">🌿</span>
        </div>
        <p className="mt-1 text-sm text-[#64748B]">
          Understand your emotional patterns and wellness growth over time.
        </p>
      </div>

      <div
        ref={containerRef}
        className="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end relative"
      >
        {/* Mobile: sticky segmented time range */}
        <div
          className="segmented-control w-full md:w-auto sticky top-14 z-30 lg:static"
          role="radiogroup"
          aria-label="Select date range"
        >
          {RANGE_OPTIONS.map((opt) => {
            const selected = opt.value === range;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isLoading}
                onClick={() => onRangeChange(opt.value)}
                className="btn-haptic touch-target flex-1 md:flex-none"
              >
                {opt.label.replace('Last ', '')}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3 flex-wrap relative">
        {/* Range picker */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5FAF5] border border-[#DCFCE7] text-[#0F172A] text-sm font-medium hover:bg-[#EEF7EF] transition-colors"
            aria-label="Select date range"
            aria-expanded={openMenu === 'range'}
            onClick={() =>
              setOpenMenu((m) => (m === 'range' ? null : 'range'))
            }
          >
            <Calendar className="w-4 h-4 text-[#5DBB63]" />
            <span>{activeRangeLabel}</span>
            <ChevronDown
              className={`w-4 h-4 text-[#5DBB63] transition-transform ${
                openMenu === 'range' ? 'rotate-180' : ''
              }`}
            />
          </motion.button>
          <AnimatePresence>
            {openMenu === 'range' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-[#DCFCE7] shadow-xl overflow-hidden z-20"
                role="menu"
              >
                {RANGE_OPTIONS.map((opt) => {
                  const selected = opt.value === range;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => {
                        onRangeChange(opt.value);
                        setOpenMenu(null);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[#F5FAF5] ${
                        selected
                          ? 'text-[#15803D] font-medium'
                          : 'text-[#0F172A]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter picker */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5FAF5] border border-[#DCFCE7] text-[#0F172A] text-sm font-medium hover:bg-[#EEF7EF] transition-colors"
            aria-label="Filter insights"
            aria-expanded={openMenu === 'filter'}
            onClick={() =>
              setOpenMenu((m) => (m === 'filter' ? null : 'filter'))
            }
          >
            <Filter className="w-4 h-4 text-[#5DBB63]" />
            <span>Filter</span>
            <span className="ml-1 px-1.5 rounded-full bg-[#DCFCE7] text-xs text-[#15803D] font-semibold">
              {activeFilters}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#5DBB63] transition-transform ${
                openMenu === 'filter' ? 'rotate-180' : ''
              }`}
            />
          </motion.button>
          <AnimatePresence>
            {openMenu === 'filter' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#DCFCE7] shadow-xl overflow-hidden z-20"
                role="menu"
              >
                {FILTER_OPTIONS.map((opt) => {
                  const checked = visible[opt.value];
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={checked}
                      onClick={() => onToggleSlice(opt.value)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[#F5FAF5] text-[#0F172A]"
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          checked
                            ? 'bg-[#22C55E] border-[#22C55E]'
                            : 'border-[#CBD5E1]'
                        }`}
                      >
                        {checked && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Refresh */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => void onRefresh()}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F5FAF5] border border-[#DCFCE7] text-[#0F172A] text-sm font-medium hover:bg-[#EEF7EF] transition-colors disabled:opacity-60"
          aria-label="Refresh insights"
          disabled={isLoading}
        >
          <RefreshCcw
            className={`w-4 h-4 text-[#5DBB63] ${
              isLoading ? 'animate-spin' : ''
            }`}
          />
        </motion.button>

        {/* Export */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-[#7ED957] to-[#22C55E] text-white text-sm font-medium shadow-[0_4px_14px_rgba(34,197,94,0.25)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.35)] transition-shadow disabled:opacity-70"
          aria-label="Export insights report"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{exporting ? 'Exporting…' : 'Export'}</span>
        </motion.button>

        {exportError && (
          <span
            role="alert"
            className="text-xs text-[#B91C1C] bg-[#FEE2E2] px-2 py-1 rounded-lg"
          >
            {exportError}
          </span>
        )}
        </div>
      </div>
    </motion.div>
  );
}
