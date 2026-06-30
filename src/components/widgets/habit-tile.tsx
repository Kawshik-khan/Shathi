'use client';

import { ListChecks, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { EmptyState } from '@/components/ui/states/EmptyState';

export interface HabitTileData {
  /** Habits completed today. */
  done: number;
  /** Total active habits. */
  total: number;
}

export interface HabitTileProps {
  load: () => Promise<HabitTileData | null>;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HabitTile — FeatureCard for /habits per UI plan §6.12.
 *
 * Renders today's habit progress. States: loading / empty / ready.
 */
export function HabitTile({ load, className, style }: HabitTileProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'empty' }
    | { kind: 'ready'; data: HabitTileData }
  >({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => {
        if (!alive) return;
        setState(data ? { kind: 'ready', data } : { kind: 'empty' });
      })
      .catch(() => {
        if (!alive) return;
        setState({ kind: 'empty' });
      });
    return () => {
      alive = false;
    };
  }, [load]);

  const cta = t('dashboard.tile.habits.open');

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn('group/card flex flex-col gap-8 overflow-hidden rounded-card border py-8 text-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lift', className)}
      style={style}
      onClick={() => router.push('/habits')}
      onKeyDown={(e) => e.key === 'Enter' && router.push('/habits')}
    >
      <div className="flex flex-col gap-4 px-8">
        <div className="flex items-center justify-between">
          <Icon
            icon={ListChecks}
            size={20}
            aria-hidden
            className="text-accent-habit"
          />
          <Icon
            icon={ArrowUpRight}
            size={16}
            aria-hidden
            className="text-text-secondary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-heading text-sm font-semibold uppercase tracking-wider text-text-primary">
            {t('dashboard.tile.habits.title')}
          </span>

          {state.kind === 'loading' ? (
            <LoadingState
              label={t('dashboard.tile.habits.loading')}
              heightClass="h-5 w-32"
            />
          ) : state.kind === 'empty' ? (
            <EmptyState
              title={t('dashboard.tile.habits.empty')}
              tone="habit"
              className="border-0 p-0"
            />
          ) : (
            <span className="text-sm text-text-primary">
              {t('dashboard.tile.habits.completed', {
                done: state.data.done,
                total: state.data.total,
              })}
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-habit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm">
          {cta}
          <Icon icon={ArrowUpRight} size={12} aria-hidden />
        </span>
      </div>
    </div>
  );
}
