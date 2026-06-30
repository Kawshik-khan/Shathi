'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { cn } from '@/lib/utils';

const SIZE = 120;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Status = 'great' | 'good' | 'fair' | 'low';

export interface WellnessScore {
  /** 0–100 composite of last week's mood, sleep, and habit signals. */
  score: number;
  /** Score delta vs. yesterday. Positive = improving. */
  delta: number;
  /** Status bucket derived from score; drives pill color. */
  status: Status;
}

export interface WellnessScoreCardProps {
  /** Source loader — should fetch and resolve with a real value, or `null`. */
  load: () => Promise<WellnessScore | null>;
  className?: string;
}

// SVG attrs can't read Tailwind utilities directly; use CSS vars (which
// globals.css guarantees to exist) for the gauge stroke.
const STATUS_RAMP: Record<Status, string> = {
  great: 'rgba(255,255,255,0.92)',
  good: 'rgba(255,255,255,0.92)',
  fair: 'rgba(255,255,255,0.92)',
  low: 'rgba(255,255,255,0.92)',
};

const STATUS_PILL: Record<Status, string> = {
  great: 'bg-white/12 text-white',
  good: 'bg-white/12 text-white',
  fair: 'bg-white/12 text-white',
  low: 'bg-white/12 text-white',
};

/**
 * WellnessScoreCard — Pattern 1 (HeroCard) per UI plan §6.12.
 *
 * Reads from the caller's loader so we don't bake endpoints into the widget.
 * Renders loading / empty states explicitly — never mocks data.
 */
export function WellnessScoreCard({ load, className }: WellnessScoreCardProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'empty' }
    | { kind: 'ready'; data: WellnessScore }
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

  return (
    <Card variant="feature" accent="energy" className={cn('border-white/10 bg-gradient-to-br from-[#55715B] to-[#6E8E73] text-white shadow-card', className)}>
      <div className="flex items-center gap-6">
        <div className="relative h-30 w-30 shrink-0">
          {state.kind === 'loading' ? (
            <div className="flex h-full w-full items-center justify-center">
              <LoadingState
                label=""
                heightClass="h-16 w-16 rounded-full"
                className="border-0 p-0"
              />
            </div>
          ) : state.kind === 'empty' ? (
            <div className="flex h-full w-full items-center justify-center">
              <span
                aria-hidden
                className="font-display text-3xl font-semibold tabular-nums text-white/75"
              >
                —
              </span>
            </div>
          ) : (
            <>
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="-rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  className="stroke-white/15"
                  strokeWidth={STROKE}
                />
                <motion.circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={STATUS_RAMP[state.data.status]}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  initial={{ strokeDashoffset: CIRCUMFERENCE }}
                  animate={{
                    strokeDashoffset:
                      CIRCUMFERENCE * (1 - state.data.score / 100),
                  }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-display text-3xl font-semibold tabular-nums tracking-tight text-white"
                  aria-label={`${t('dashboard.wellnessScore.label')} ${state.data.score}`}
                >
                  {state.data.score}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/75">
                  /100
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/75">
            {t('dashboard.wellnessScore.label')}
          </span>

          {state.kind === 'loading' ? (
            <span className="text-sm text-white/75">
              {t('dashboard.wellnessScore.loading')}
            </span>
          ) : state.kind === 'empty' ? (
            <span className="text-sm text-white/75">
              {t('dashboard.wellnessScore.empty')}
            </span>
          ) : (
            <>
              <span
                className={cn(
                  'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  STATUS_PILL[state.data.status],
                )}
              >
                {t(`dashboard.wellnessScore.status.${state.data.status}`)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-white/75">
                {state.data.delta > 0 ? (
                  <Icon icon={TrendingUp} size={12} aria-hidden />
                ) : state.data.delta < 0 ? (
                  <Icon icon={TrendingDown} size={12} aria-hidden />
                ) : (
                  <Icon icon={Minus} size={12} aria-hidden />
                )}
                {state.data.delta > 0
                  ? t('dashboard.wellnessScore.delta.up', {
                      count: state.data.delta,
                    })
                  : state.data.delta < 0
                    ? t('dashboard.wellnessScore.delta.down', {
                        count: Math.abs(state.data.delta),
                      })
                    : t('dashboard.wellnessScore.delta.flat')}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
