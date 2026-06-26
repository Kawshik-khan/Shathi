'use client';

import { motion } from 'framer-motion';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type Priority = 'high' | 'medium' | 'low';

const priorityStyles: Record<Priority, string> = {
  high: 'status-pill status-pill--warning',
  medium: 'status-pill status-pill--info',
  low: 'status-pill status-pill--neutral',
};

const priorityLabel: Record<Priority, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

export function DailyGoals() {
  const { goals, toggleGoal } = useDashboardStore();
  const router = useRouter();

  const completedCount = goals.filter((g) => g.completed).length;
  const progress = goals.length ? (completedCount / goals.length) * 100 : 0;
  const remaining = goals.length - completedCount;

  return (
    <div className="card card-interactive h-full">
      <header className="mb-3 flex items-center justify-between">
        <span className="card-eyebrow flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-goals-purple" aria-hidden="true" />
          Today&apos;s Goals
        </span>
        <span className="card-caption">
          {completedCount}/{goals.length} done
        </span>
      </header>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-goals-purple-soft" aria-hidden="true">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-goals-purple/80 to-goals-purple"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <ul className="space-y-1.5">
        {goals.map((goal, index) => {
          const priority: Priority =
            goal.completed ? 'low' : index === 0 ? 'high' : index < 3 ? 'medium' : 'low';
          return (
            <li key={goal.id}>
              <motion.button
                type="button"
                onClick={() => toggleGoal(goal.id)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + index * 0.04 }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors',
                  'hover:bg-goals-purple-soft focus-ring',
                  goal.completed && 'opacity-70',
                )}
                aria-pressed={goal.completed}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    goal.completed
                      ? 'border-goals-purple bg-goals-purple text-white'
                      : 'border-border group-hover:border-goals-purple',
                  )}
                  aria-hidden="true"
                >
                  {goal.completed && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span
                  className={cn(
                    'flex-1 truncate text-sm transition-colors',
                    goal.completed ? 'text-muted-foreground line-through' : 'text-foreground',
                  )}
                >
                  {goal.title}
                </span>
                {!goal.completed && (
                  <span className={cn(priorityStyles[priority], 'text-[10px]')}>
                    {priorityLabel[priority]}
                  </span>
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between">
        <span className="card-caption">
          {remaining === 0 ? '🎉 All done for today' : `${remaining} to go`}
        </span>
        <button
          type="button"
          onClick={() => router.push('/habits')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-goals-purple focus-ring rounded-md px-2 py-1 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

