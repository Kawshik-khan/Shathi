'use client';

import { motion } from 'framer-motion';
import { Leaf, ChevronDown, ArrowRight, Dumbbell, Droplets, Moon, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthToken, getHabits, type Habit } from '@/lib/api';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  meditation: Sparkles,
  workout: Dumbbell,
  water: Droplets,
  sleep: Moon,
};

export function HabitsTracker() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const token = getAuthToken();

    if (!token) {
      Promise.resolve().then(() => {
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }

    getHabits()
      .then((data) => {
        if (mounted) setHabits(data.slice(0, 4));
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load habits.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="card card-interactive h-full">
      <header className="mb-4 flex items-center justify-between">
        <span className="card-eyebrow flex items-center gap-1.5">
          <Leaf className="h-3.5 w-3.5 text-habits-emerald" aria-hidden="true" />
          Habits
        </span>
        <button
          type="button"
          disabled
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-ring rounded-md px-2 py-1 transition-colors"
        >
          This Week
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>
      </header>

      <div className="space-y-3">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Loading habits
          </div>
        ) : error ? (
          <div className="status-pill status-pill--danger w-full">{error}</div>
        ) : habits.length === 0 ? (
          <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
            No habits yet. Add one to start tracking streaks.
          </div>
        ) : (
          habits.map((habit, index) => {
            const Icon = iconMap[habit.icon ?? ''] || Leaf;
            const completedDots = Math.min(7, habit.current_streak);
            const weeklyProgress = Array.from({ length: 7 }, (_, i) => i < completedDots);
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-habits-emerald-soft">
                  <Icon className="h-4.5 w-4.5 text-habits-emerald" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{habit.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {habit.current_streak}d streak
                    </span>
                  </div>
                  <div className="flex gap-1" aria-hidden="true">
                    {weeklyProgress.map((completed, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.03 }}
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          completed ? 'bg-habits-emerald' : 'bg-habits-emerald-soft',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push('/habits')}
        className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-habits-emerald focus-ring rounded-md px-2 py-1 transition-colors"
      >
        View all habits
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

