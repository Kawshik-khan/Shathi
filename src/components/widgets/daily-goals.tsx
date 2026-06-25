'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { useDashboardStore } from '@/lib/store';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function DailyGoals() {
  const { goals, toggleGoal } = useDashboardStore();
  const router = useRouter();

  const completedCount = goals.filter(g => g.completed).length;
  const progress = (completedCount / goals.length) * 100;

  return (
    <GlassCard className="h-full" delay={0.2}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#4A90A4]" />
          <span className="text-sm font-medium text-foreground">Today&apos;s Goals</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{goals.length} Completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[#EAF2F4] rounded-full mb-5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#6FA8C7] to-[#4A90A4] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => toggleGoal(goal.id)}
          >
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
              goal.completed
                ? "bg-[#4A90A4] border-[#4A90A4]"
                : "border-gray-300 group-hover:border-[#4A90A4]"
            )}>
              {goal.completed && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              )}
            </div>
            <span className={cn(
              "text-sm transition-colors",
              goal.completed 
                ? "text-muted-foreground line-through" 
                : "text-foreground"
            )}>
              {goal.title}
            </span>
            <button
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => alert('Edit goal functionality coming soon!')}
            >
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </motion.div>
        ))}
      </div>

      <button
        className="flex items-center gap-1 mt-5 text-xs text-muted-foreground hover:text-[#4A90A4] transition-colors"
        onClick={() => router.push('/habits')}
      >
        View all goals
        <ArrowRight className="w-3 h-3" />
      </button>
    </GlassCard>
  );
}

