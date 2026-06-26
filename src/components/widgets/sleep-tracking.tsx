'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Moon, ChevronDown, ArrowRight } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SleepTracking() {
  const reducedMotion = useReducedMotion();
  const { sleepData } = useDashboardStore();
  const router = useRouter();

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, (sleepData.hours + sleepData.minutes / 60) / 10);
  const strokeDashoffset = circumference - progress * circumference;
  const filledBars = Math.round((sleepData.quality / 100) * 10);

  return (
    <div className="card card-interactive h-full tile-sleep">
      <header className="mb-4 flex items-center justify-between">
        <span className="card-eyebrow flex items-center gap-1.5">
          <Moon className="h-3.5 w-3.5 text-sleep-blue" aria-hidden="true" />
          Sleep
        </span>
        <button
          type="button"
          onClick={() => alert('Period selection coming soon!')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-ring rounded-md px-2 py-1 transition-colors"
        >
          Tonight
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>
      </header>

      <div className="flex items-center justify-between gap-4">
        <div className="relative h-24 w-24">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r={radius} className="stroke-sleep-blue/15" strokeWidth="8" fill="none" />
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-sleep-blue"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={reducedMotion ? false : { strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="card-value text-lg">{sleepData.duration}</span>
            <span className="card-caption text-sleep-blue">{sleepData.qualityLabel}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="card-caption mb-1">Sleep quality</p>
          <p className="card-value text-2xl text-sleep-blue">{sleepData.quality}%</p>
          <div className="mt-2 flex justify-end gap-0.5" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-4 w-1.5 rounded-full transition-colors',
                  i < filledBars ? 'bg-sleep-blue' : 'bg-sleep-blue/15',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push('/sleep')}
        className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-sleep-blue focus-ring rounded-md px-2 py-1 transition-colors"
      >
        View details
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

