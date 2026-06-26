'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Brain,
  Heart,
  Leaf,
  MessageCircleHeart,
  Moon,
  NotebookPen,
  Sparkles,
  Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Action = {
  label: string;
  description: string;
  icon: typeof Heart;
  tone: 'mood' | 'sleep' | 'goals' | 'habits' | 'insights' | 'journal';
};

const actions: Action[] = [
  {
    label: 'Log Mood',
    description: 'How do you feel?',
    icon: Heart,
    tone: 'mood',
  },
  {
    label: 'New Journal',
    description: 'Reflect today',
    icon: NotebookPen,
    tone: 'journal',
  },
  {
    label: 'Meditate',
    description: 'Start a session',
    icon: Brain,
    tone: 'goals',
  },
  {
    label: 'Talk to Sathi',
    description: 'AI companion',
    icon: MessageCircleHeart,
    tone: 'insights',
  },
  {
    label: 'Breathing',
    description: 'Calm in 1 min',
    icon: Wind,
    tone: 'habits',
  },
  {
    label: 'Water',
    description: 'Track a glass',
    icon: Leaf,
    tone: 'habits',
  },
  {
    label: 'Exercise',
    description: 'Log workout',
    icon: Sparkles,
    tone: 'insights',
  },
  {
    label: 'Sleep Log',
    description: 'Last night',
    icon: Moon,
    tone: 'sleep',
  },
];

const toneStyles: Record<Action['tone'], string> = {
  mood: 'bg-mood-green-soft text-mood-green',
  sleep: 'bg-sleep-blue-soft text-sleep-blue',
  goals: 'bg-goals-purple-soft text-goals-purple',
  habits: 'bg-habits-emerald-soft text-habits-emerald',
  insights: 'bg-insights-teal-soft text-insights-teal',
  journal: 'bg-goals-purple-soft text-goals-purple',
};

export function QuickActions() {
  const reducedMotion = useReducedMotion();

  return (
    <section aria-label="Quick actions">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="card-section-title">Quick Actions</h2>
        <p className="card-caption">One tap to log, reflect, or reset.</p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <li key={action.label}>
              <motion.button
                type="button"
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: reducedMotion ? 0 : i * 0.03,
                  ease: 'easeOut',
                }}
                whileHover={reducedMotion ? undefined : { y: -2 }}
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                className={cn(
                  'group flex h-22 w-full min-w-0 flex-col items-start justify-between gap-2 rounded-2xl border border-black/5 bg-white/70 p-3 text-left shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
                  'focus-ring touch-target',
                )}
                aria-label={`${action.label}. ${action.description}.`}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                    toneStyles[action.tone],
                  )}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-[13px] font-semibold text-foreground">
                    {action.label}
                  </span>
                  <span className="card-caption block truncate">{action.description}</span>
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}