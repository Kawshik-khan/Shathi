'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WellnessScoreHeroProps {
  /** 0-100 wellness score for today */
  score: number;
  /** delta vs. yesterday, can be negative */
  delta?: number;
  /** Status label, e.g. "Good", "Great", "Low" */
  status?: 'Great' | 'Good' | 'Fair' | 'Low';
  /** Optional context line under the score */
  context?: string;
  className?: string;
}

const SIZE = 96;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function statusIntent(status: WellnessScoreHeroProps['status']) {
  switch (status) {
    case 'Great':
      return 'status-pill--success';
    case 'Good':
      return 'status-pill--info';
    case 'Fair':
      return 'status-pill--warning';
    case 'Low':
    default:
      return 'status-pill--danger';
  }
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />;
  if (delta < 0) return <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Minus className="h-3.5 w-3.5" aria-hidden="true" />;
}

/**
 * Compact Wellness Score KPI used in the dashboard header.
 * Animated circular ring + large numeric + status pill + delta.
 */
export function WellnessScoreHero({
  score,
  delta = 0,
  status = 'Good',
  context,
  className,
}: WellnessScoreHeroProps) {
  const reducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const progress = clamped / 100;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className={cn('flex items-center gap-4', className)}
      role="group"
      aria-label={`Wellness score ${clamped} out of 100, ${status.toLowerCase()}`}
    >
      {/* Ring */}
      <div className="relative h-24 w-24 shrink-0">
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
            stroke="currentColor"
            strokeWidth={STROKE}
            fill="none"
            className="text-black/5 dark:text-white/10"
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="url(#wellness-ring)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }
            }
          />
          <defs>
            <linearGradient id="wellness-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8AB7A6" />
              <stop offset="100%" stopColor="#5A8D7B" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {clamped}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            /100
          </span>
        </div>
      </div>

      {/* Caption + delta */}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="card-eyebrow">Wellness Score</span>
        <span className={cn('status-pill self-start', statusIntent(status))}>
          {status}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            delta > 0 && 'text-mood-green',
            delta < 0 && 'text-mood-red',
            delta === 0 && 'text-muted-foreground',
          )}
        >
          <TrendIcon delta={delta} />
          {delta === 0
            ? 'Same as yesterday'
            : `${Math.abs(delta)} ${delta > 0 ? 'up' : 'down'} from yesterday`}
        </span>
        {context && <span className="card-caption truncate">{context}</span>}
      </div>
    </div>
  );
}
