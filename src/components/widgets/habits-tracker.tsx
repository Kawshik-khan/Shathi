'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { getAuthToken, getHabits, type Habit } from '@/lib/api';
import { Leaf, ChevronDown, ArrowRight, Dumbbell, Droplets, Moon, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    <GlassCard className="h-full" delay={0.25}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-[#4A90A4]" />
          <span className="text-sm font-medium text-foreground">Habits</span>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          type="button"
          disabled
        >
          This Week
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading habits
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 p-3 text-xs text-red-500">{error}</div>
        ) : habits.length === 0 ? (
          <div className="rounded-2xl bg-[#F1F5F7]/80 p-4 text-sm text-muted-foreground">
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F1F5F7] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#4A90A4]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground truncate">
                      {habit.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {habit.current_streak}/7 days
                    </span>
                  </div>
                  
                  {/* Progress Dots */}
                  <div className="flex gap-1">
                    {weeklyProgress.map((completed, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.03 }}
                        className={cn(
                          "w-3 h-3 rounded-full",
                          completed 
                            ? "bg-[#4A90A4]" 
                            : "bg-[#EAF2F4]"
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
        className="flex items-center gap-1 mt-5 text-xs text-muted-foreground hover:text-[#4A90A4] transition-colors"
        onClick={() => router.push('/habits')}
      >
        View all habits
        <ArrowRight className="w-3 h-3" />
      </button>
    </GlassCard>
  );
}

