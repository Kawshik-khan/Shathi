'use client';

import { BookHeart, Leaf, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const moodPoints = [6.4, 7.1, 6.8, 7.6, 7.3, 8.1, 8.4];
const habits = [
  { name: 'Morning calm', streak: 5 },
  { name: 'Hydration', streak: 6 },
  { name: 'Evening journal', streak: 3 },
];

export function MoodPreviewCard() {
  const max = Math.max(...moodPoints);

  return (
    <Card variant="elevated" className="h-full" size="default">
      <CardContent className="flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon={TrendingUp}
              size={16}
              className="text-accent-sleep"
              aria-label="Mood trend"
            />
            <span className="text-sm font-medium text-text-secondary">
              Mood Overview
            </span>
          </div>
          <span className="rounded-pill bg-bg-hover px-2.5 py-0.5 text-xs font-medium text-accent-sleep">
            Demo
          </span>
        </div>

        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-display text-4xl font-medium tracking-tight text-text-primary">
            8.4
          </span>
          <span className="rounded-pill bg-bg-hover px-2.5 py-0.5 text-xs font-medium text-accent-sleep">
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
              transition={{
                delay: index * 0.04,
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                'flex-1 rounded-full',
                index === moodPoints.length - 1
                  ? 'bg-accent-sleep'
                  : 'bg-bg-hover'
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HabitsPreviewCard() {
  return (
    <Card variant="elevated" className="h-full" size="default">
      <CardContent className="flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon={Leaf}
              size={16}
              className="text-accent-sleep"
              aria-label="Habits"
            />
            <span className="text-sm font-medium text-text-primary">Habits</span>
          </div>
          <span className="text-xs text-text-secondary">This Week</span>
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
              <div className="grid size-8 shrink-0 place-items-center rounded-tile bg-bg-sunken">
                <Icon
                  icon={Leaf}
                  size={16}
                  className="text-accent-sleep"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {habit.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {habit.streak}/7 days
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 7 }, (_, dot) => (
                    <span
                      key={dot}
                      className={cn(
                        'size-3 rounded-full',
                        dot < habit.streak ? 'bg-accent-sleep' : 'bg-bg-sunken'
                      )}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function JournalPreviewCard() {
  return (
    <Card variant="elevated" className="h-full" size="default">
      <CardContent className="flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon={BookHeart}
              size={16}
              className="text-accent-sleep"
              aria-label="Journal"
            />
            <span className="text-sm font-medium text-text-primary">Journal</span>
          </div>
          <span className="rounded-pill bg-bg-hover px-2.5 py-0.5 text-[10px] font-medium text-accent-sleep">
            Preview
          </span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <h4 className="mb-2 font-display text-base font-medium text-text-primary">
              A calmer evening
            </h4>
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">
              Took a few minutes to breathe, reset, and notice what felt
              lighter today.
            </p>
            <p className="text-xs text-text-secondary/70">
              Today · 8:30 PM
            </p>
          </div>

          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-bg-hover),var(--color-accent-sleep))] shadow-card"
          >
            <Icon
              icon={BookHeart}
              size={24}
              className="text-text-inverse"
            />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

