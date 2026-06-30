'use client';

import { Moon, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { EmptyState } from '@/components/ui/states/EmptyState';

export interface SleepTileData {
  totalMinutes: number;
}

export interface SleepTileProps {
  load: () => Promise<SleepTileData | null>;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SleepTile — SummaryCard for /sleep per UI plan §6.12.
 *
 * Renders last-night total sleep. States: loading / empty / ready.
 */
export function SleepTile({ load, className, style }: SleepTileProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'empty' }
    | { kind: 'ready'; data: SleepTileData }
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

  const cta = t('dashboard.tile.sleep.open');
  const hours =
    state.kind === 'ready' ? Math.floor(state.data.totalMinutes / 60) : 0;
  const minutes =
    state.kind === 'ready' ? state.data.totalMinutes % 60 : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn('group/card flex flex-col gap-8 overflow-hidden rounded-card border py-8 text-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lift', className)}
      style={style}
      onClick={() => router.push('/sleep')}
      onKeyDown={(e) => e.key === 'Enter' && router.push('/sleep')}
    >
      <div className="flex flex-col gap-4 px-8">
        <div className="flex items-center justify-between">
          <Icon
            icon={Moon}
            size={20}
            aria-hidden
            className="text-accent-sleep"
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
            {t('dashboard.tile.sleep.title')}
          </span>

          {state.kind === 'loading' ? (
            <LoadingState
              label={t('dashboard.tile.sleep.loading')}
              heightClass="h-7 w-24"
            />
          ) : state.kind === 'empty' ? (
            <EmptyState
              title={t('dashboard.tile.sleep.empty')}
              tone="sleep"
              className="border-0 p-0"
            />
          ) : (
            <span className="font-stats text-2xl font-semibold tabular-nums text-text-primary">
              {hours}h {minutes.toString().padStart(2, '0')}m
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-sleep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm">
          {cta}
          <Icon icon={ArrowUpRight} size={12} aria-hidden />
        </span>
      </div>
    </div>
  );
}
