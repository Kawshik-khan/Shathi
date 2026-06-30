'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

import {
  chartColors,
  type ChartFeatureColor,
} from '@/components/charts/ChartTheme';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { EmptyState } from '@/components/ui/states/EmptyState';
import { cn } from '@/lib/utils';

export interface InsightItem {
  id: string;
  label: string;
  href: string;
  color: ChartFeatureColor;
  series: { x: number; y: number }[];
}

export interface InsightStripData {
  items: InsightItem[];
}

export interface InsightStripProps {
  load: () => Promise<InsightStripData | null>;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * InsightStrip — Pattern 9 per UI plan §6.12.
 *
 * Horizontal scroll of mini sparkline cards. Each card is feature-accent
 * and routes to its detail page on click. No mock data; loader returns
 * `null` (empty state) when the backend has no series to show.
 */
export function InsightStrip({ load, className, style }: InsightStripProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'empty' }
    | { kind: 'ready'; data: InsightStripData }
  >({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => {
        if (!alive) return;
        setState(
          data && data.items.length > 0
            ? { kind: 'ready', data }
            : { kind: 'empty' },
        );
      })
      .catch(() => {
        if (!alive) return;
        setState({ kind: 'empty' });
      });
    return () => {
      alive = false;
    };
  }, [load]);

  return (
    <section
      aria-label={t('dashboard.insights.sectionTitle')}
      className={cn('flex flex-col gap-3', className)}
      style={style}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold uppercase tracking-wider text-text-primary">
          {t('dashboard.insights.sectionTitle')}
        </h2>
        <button
          type="button"
          onClick={() => router.push('/insights')}
          className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          {t('dashboard.insights.viewAll')}
          <Icon icon={ArrowUpRight} size={12} aria-hidden />
        </button>
      </div>

      {state.kind === 'loading' ? (
        <div className="flex h-28 items-center justify-center rounded-card border border-border-subtle bg-bg-card/40 px-4 text-xs text-text-secondary">
          <LoadingState
            label={t('dashboard.insights.loading')}
            heightClass="h-6 w-full"
          />
        </div>
      ) : state.kind === 'empty' ? (
        <div className="flex h-28 items-center justify-center rounded-card border border-dashed border-border-subtle text-xs text-text-secondary">
          <EmptyState
            title={t('dashboard.insights.empty')}
            tone="neutral"
            className="border-0 p-0"
          />
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
          {state.data.items.slice(0, 8).map((item) => (
            <InsightCard
              key={item.id}
              item={item}
              onClick={() => router.push(item.href)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface InsightCardProps {
  item: InsightItem;
  onClick: () => void;
}

function InsightCard({ item, onClick }: InsightCardProps) {
  const stroke = chartColors.feature[item.color];
  const gradientId = `insight-gradient-${item.id}`;
  const data = item.series;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'w-65 shrink-0 cursor-pointer snap-start overflow-hidden rounded-card border border-white/25 px-8 py-8',
        'transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5',
      )}
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(238,246,240,0.55) 100%)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-primary">
            {item.label}
          </span>
          <Icon
            icon={ArrowUpRight}
            size={12}
            aria-hidden
            className="text-text-secondary"
          />
        </div>
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke={stroke}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
