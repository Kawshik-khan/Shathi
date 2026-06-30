'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useInsightsData, type InsightsSlice } from '@/hooks/useInsightsData';
import Header from '@/components/insights/Header';

// Recharts surfaces SSR sizing warnings during prerender — render the grid on
// the client only. The shells inside each grid keep paint fast.
const OverviewGridClient = dynamic(
  () => import('@/components/insights/OverviewGrid'),
  {
    ssr: false,
    loading: () => <GridSkeleton rows={1} />,
  },
);

const AdvancedGridClient = dynamic(
  () => import('@/components/insights/AdvancedGrid'),
  {
    ssr: false,
    loading: () => <GridSkeleton rows={2} />,
  },
);

const RecommendationsClient = dynamic(
  () => import('@/components/insights/Recommendations'),
  {
    ssr: false,
    loading: () => <GridSkeleton rows={2} />,
  },
);

function GridSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-6" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="h-48 rounded-3xl skeleton-shimmer" />
          <div className="h-48 rounded-3xl skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function InsightsContent() {
  const data = useInsightsData('30d');

  const { filters, setRange, toggleSlice, refetch, isLoading, error } = data;
  const { range, visible } = filters;

  const visibleHelpers = useMemo(
    () => ({
      mood: visible.has('mood' as InsightsSlice),
      sleep: visible.has('sleep' as InsightsSlice),
      habits: visible.has('habits' as InsightsSlice),
      journal: visible.has('journal' as InsightsSlice),
    }),
    [visible],
  );

  return (
    <div className="w-full min-w-0 space-y-8">
      <Header
        range={range}
        onRangeChange={setRange}
        visible={visibleHelpers}
        onToggleSlice={toggleSlice}
        onRefresh={refetch}
        isLoading={isLoading}
      />

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FCD34D] text-sm text-[#92400E] flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1 rounded-lg bg-white/70 text-[#92400E] text-xs font-medium hover:bg-white"
          >
            Retry
          </button>
        </div>
      )}

      <OverviewGridClient />
      <AdvancedGridClient />
      <RecommendationsClient />
    </div>
  );
}