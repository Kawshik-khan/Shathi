'use client';

import { BookOpen, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { EmptyState } from '@/components/ui/states/EmptyState';

export interface JournalTileData {
  title: string;
  preview: string;
}

export interface JournalTileProps {
  load: () => Promise<JournalTileData | null>;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * JournalTile — JournalCard for /journal per UI plan §6.12.
 *
 * Renders the most recent journal entry's title + preview. States:
 * loading / empty / ready.
 */
export function JournalTile({ load, className, style }: JournalTileProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'empty' }
    | { kind: 'ready'; data: JournalTileData }
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

  const cta = t('dashboard.tile.journal.open');

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn('group/card flex flex-col gap-8 overflow-hidden rounded-card border py-8 text-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lift', className)}
      style={style}
      onClick={() => router.push('/journal')}
      onKeyDown={(e) => e.key === 'Enter' && router.push('/journal')}
    >
      <div className="flex flex-col gap-4 px-8">
        <div className="flex items-center justify-between">
          <Icon
            icon={BookOpen}
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
            {t('dashboard.tile.journal.title')}
          </span>

          {state.kind === 'loading' ? (
            <LoadingState
              label={t('dashboard.tile.journal.loading')}
              variant="rows"
              rows={2}
            />
          ) : state.kind === 'empty' ? (
            <EmptyState
              title={t('dashboard.tile.journal.empty')}
              tone="journal"
              className="border-0 p-0"
            />
          ) : (
            <>
              <span className="font-display line-clamp-1 text-base font-medium text-text-primary">
                {state.data.title}
              </span>
              <span className="line-clamp-2 text-sm text-text-secondary">
                {state.data.preview}
              </span>
            </>
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
