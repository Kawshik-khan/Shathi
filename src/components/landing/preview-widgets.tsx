'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { cn } from '@/lib/utils';
import { BookHeart, Leaf, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const moodPoints = [6.4, 7.1, 6.8, 7.6, 7.3, 8.1, 8.4];
const habits = [
  { name: 'Morning calm', streak: 5 },
  { name: 'Hydration', streak: 6 },
  { name: 'Evening journal', streak: 3 },
];

export function MoodPreviewCard() {
  const max = Math.max(...moodPoints);

  return (
    <GlassCard className="h-full" delay={0.1}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#22C55E]" />
          <span className="text-sm font-medium text-muted-foreground">Mood Overview</span>
        </div>
        <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#22C55E]">
          Demo
        </span>
      </div>

      <div className="mb-5 flex items-baseline gap-3">
        <span className="text-4xl font-bold text-foreground">8.4</span>
        <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#22C55E]">
          Rising
        </span>
      </div>

      <div className="flex h-24 items-end gap-2">
        {moodPoints.map((point, index) => (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            whileInView={{ height: `${Math.max(24, (point / max) * 96)}%` }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04, duration: 0.35 }}
            className={cn(
              'flex-1 rounded-full',
              index === moodPoints.length - 1 ? 'bg-[#22C55E]' : 'bg-[#DCFCE7]'
            )}
          />
        ))}
      </div>
    </GlassCard>
  );
}

export function HabitsPreviewCard() {
  return (
    <GlassCard className="h-full" delay={0.25}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-[#22C55E]" />
          <span className="text-sm font-medium text-foreground">Habits</span>
        </div>
        <span className="text-xs text-muted-foreground">This Week</span>
      </div>

      <div className="space-y-4">
        {habits.map((habit, index) => (
          <motion.div
            key={habit.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="flex items-center gap-3"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F3FAF4]">
              <Leaf className="h-4 w-4 text-[#22C55E]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-foreground">{habit.name}</span>
                <span className="text-xs text-muted-foreground">{habit.streak}/7 days</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, dot) => (
                  <span
                    key={dot}
                    className={cn('h-3 w-3 rounded-full', dot < habit.streak ? 'bg-[#22C55E]' : 'bg-[#EEF7EF]')}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

export function JournalPreviewCard() {
  return (
    <GlassCard className="h-full" delay={0.35}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookHeart className="h-4 w-4 text-[#22C55E]" />
          <span className="text-sm font-medium text-foreground">Journal</span>
        </div>
        <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-medium text-[#22C55E]">
          Preview
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <h4 className="mb-2 text-base font-semibold text-foreground">A calmer evening</h4>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            Took a few minutes to breathe, reset, and notice what felt lighter today.
          </p>
          <p className="text-xs text-muted-foreground/70">Today · 8:30 PM</p>
        </div>

        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#DCFCE7] to-[#A7F3A0] shadow-lg shadow-green-500/10"
        >
          <BookHeart className="h-7 w-7 text-[#22C55E]" />
        </motion.div>
      </div>
    </GlassCard>
  );
}

