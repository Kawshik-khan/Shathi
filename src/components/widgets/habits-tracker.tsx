'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { useDashboardStore } from '@/lib/store';
import { Leaf, ChevronDown, ArrowRight, Dumbbell, Droplets, Moon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  meditation: Sparkles,
  workout: Dumbbell,
  water: Droplets,
  sleep: Moon,
};

export function HabitsTracker() {
  const { habits } = useDashboardStore();
  const router = useRouter();

  return (
    <GlassCard className="h-full" delay={0.25}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-[#22C55E]" />
          <span className="text-sm font-medium text-foreground">Habits</span>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => alert('Period selection coming soon!')}
        >
          This Week
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {habits.map((habit, index) => {
          const Icon = iconMap[habit.icon] || Leaf;
          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F3FAF4] flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[#22C55E]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {habit.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {habit.streak}/{habit.targetDays} days
                  </span>
                </div>
                
                {/* Progress Dots */}
                <div className="flex gap-1">
                  {habit.weeklyProgress.map((completed, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.03 }}
                      className={cn(
                        "w-3 h-3 rounded-full",
                        completed 
                          ? "bg-[#22C55E]" 
                          : "bg-[#EEF7EF]"
                      )}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button
        className="flex items-center gap-1 mt-5 text-xs text-muted-foreground hover:text-[#22C55E] transition-colors"
        onClick={() => router.push('/habits')}
      >
        View all habits
        <ArrowRight className="w-3 h-3" />
      </button>
    </GlassCard>
  );
}

