'use client';

import React from 'react';
import { Heart, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { EmptyState } from '@/components/ui/states/EmptyState';

export interface MoodTileData {
  /** ISO timestamp of the most recent mood log. */
  loggedAt: string;
}

export interface MoodTileProps {
  load: () => Promise<MoodTileData | null>;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * MoodTile — FeatureCard for /mood per UI plan §6.12.
 *
 * Renders the most recent mood log time. States: loading / empty / ready.
 */
export function MoodTile({ load, className, style }: MoodTileProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'empty' }
    | { kind: 'ready'; data: MoodTileData }
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

  const locale = i18n.language?.startsWith('bn') ? 'bn-BD' : 'en-US';
  const cta = t('dashboard.tile.mood.open');

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn('group/card flex flex-col gap-8 overflow-hidden rounded-card border py-8 text-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lift', className)}
      style={style}
      onClick={() => router.push('/mood')}
      onKeyDown={(e) => e.key === 'Enter' && router.push('/mood')}
    >
      <div className="flex flex-col gap-4 px-8">
        <div className="flex items-center justify-between">
          <Icon
            icon={Heart}
            size={20}
            aria-hidden
            className="text-accent-mood"
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
            {t('dashboard.tile.mood.title')}
          </span>

          {state.kind === 'loading' ? (
            <LoadingState
              label={t('dashboard.tile.mood.loading')}
              heightClass="h-5 w-32"
            />
          ) : state.kind === 'empty' ? (
            <EmptyState
              title={t('dashboard.tile.mood.empty')}
              tone="mood"
              className="border-0 p-0"
            />
          ) : (
            <span className="text-sm text-text-secondary">
              {t('dashboard.tile.mood.logged', {
                time: new Date(state.data.loggedAt).toLocaleString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })}
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-mood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm">
          {cta}
          <Icon icon={ArrowUpRight} size={12} aria-hidden />
        </span>
      </div>
    </div>
  );
}
