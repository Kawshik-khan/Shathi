'use client';

import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { EmptyState } from '@/components/ui/states/EmptyState';

export interface CompanionTileData {
  prompt: string;
}

export interface CompanionTileProps {
  load: () => Promise<CompanionTileData | null>;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * CompanionTile — InsightCard for /ai-companion per UI plan §6.12.
 *
 * Renders the daily companion prompt. Uses `accent="journal"` per the
 * plan's brand color map (companion is the only tile allowed at the
 * journal-accent slot on the dashboard). States: loading / empty / ready.
 */
export function CompanionTile({ load, className, style }: CompanionTileProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'empty' }
    | { kind: 'ready'; data: CompanionTileData }
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

  const cta = t('dashboard.tile.companion.open');

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn('group/card flex flex-col gap-8 overflow-hidden rounded-card border py-8 text-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lift', className)}
      style={style}
      onClick={() => router.push('/ai-companion')}
      onKeyDown={(e) => e.key === 'Enter' && router.push('/ai-companion')}
    >
      <div className="flex flex-col gap-4 px-8">
        <div className="flex items-center justify-between">
          <Icon
            icon={Sparkles}
            size={20}
            aria-hidden
            className="text-accent-journal"
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
            {t('dashboard.tile.companion.title')}
          </span>

          {state.kind === 'loading' ? (
            <LoadingState
              label={t('dashboard.tile.companion.loading')}
              variant="rows"
              rows={2}
            />
          ) : state.kind === 'empty' ? (
            <EmptyState
              title={t('dashboard.tile.companion.empty')}
              tone="journal"
              className="border-0 p-0"
            />
          ) : (
            <span className="font-display line-clamp-3 text-base italic text-text-primary">
              {state.data.prompt}
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-journal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm">
          {cta}
          <Icon icon={ArrowUpRight} size={12} aria-hidden />
        </span>
      </div>
    </div>
  );
}
