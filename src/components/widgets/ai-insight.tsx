'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, Trophy } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export function AIInsight() {
  const reducedMotion = useReducedMotion();
  const { aiInsight } = useDashboardStore();
  const router = useRouter();

  return (
    <div className="card card-interactive relative h-full overflow-hidden">
      <header className="mb-3 flex items-center justify-between">
        <span className="card-eyebrow flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          AI Insight
        </span>
        <span className="status-pill status-pill--info">Today</span>
      </header>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="card-title flex items-center gap-1.5">
            {aiInsight.title}
            <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
          </p>
          <p className="card-body mt-1">{aiInsight.message}</p>
        </div>

        <motion.div
          aria-hidden="true"
          animate={reducedMotion ? undefined : { scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="h-14 w-14 shrink-0 rounded-full bg-linear-to-br from-insights-teal/60 to-goals-purple/60 opacity-80 blur-sm"
        />
      </div>

      <button
        type="button"
        onClick={() => router.push('/insights')}
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary focus-ring rounded-md px-2 py-1 transition-colors"
      >
        View insights
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}