'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Droplets,
  Footprints,
  Heart,
  Moon,
  NotebookPen,
} from 'lucide-react';
import { useMemo } from 'react';
import { useDashboardStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type TileKey = 'mood' | 'sleep' | 'goals' | 'water' | 'exercise' | 'journal';

type Tile = {
  key: TileKey;
  label: string;
  value: string;
  caption: string;
  icon: typeof Heart;
  tileClass: string;
  iconClass: string;
};

export function SummaryStrip() {
  const reducedMotion = useReducedMotion();
  const { moodOverview, sleepData, goals, habits } = useDashboardStore();

  const completedGoals = useMemo(
    () => goals.filter((g) => g.completed).length,
    [goals],
  );
  const waterHabit = habits.find((h) => /water/i.test(h.name));
  const exerciseHabit = habits.find((h) => /workout|exercise/i.test(h.name));
  const waterPct = waterHabit
    ? Math.round((waterHabit.weeklyProgress.filter(Boolean).length / waterHabit.targetDays) * 100)
    : 0;
  const exerciseDone = exerciseHabit
    ? exerciseHabit.weeklyProgress[exerciseHabit.weeklyProgress.length - 1]
    : false;

  const moodPct = Math.round((moodOverview.currentScore / 10) * 100);

  const tiles: Tile[] = [
    {
      key: 'mood',
      label: 'Mood',
      value: `${moodOverview.currentScore.toFixed(1)}/10`,
      caption: `${moodPct}% today`,
      icon: Heart,
      tileClass: 'tile-mood',
      iconClass: 'text-mood-green',
    },
    {
      key: 'sleep',
      label: 'Sleep',
      value: sleepData.duration,
      caption: sleepData.qualityLabel,
      icon: Moon,
      tileClass: 'tile-sleep',
      iconClass: 'text-sleep-blue',
    },
    {
      key: 'goals',
      label: 'Goals',
      value: `${completedGoals}/${goals.length}`,
      caption: goals.length - completedGoals === 0 ? 'All done' : `${goals.length - completedGoals} left`,
      icon: Footprints,
      tileClass: 'tile-goals',
      iconClass: 'text-goals-purple',
    },
    {
      key: 'water',
      label: 'Water',
      value: `${waterPct}%`,
      caption: waterHabit ? `${waterHabit.streak}d streak` : 'No streak',
      icon: Droplets,
      tileClass: 'tile-habits',
      iconClass: 'text-habits-emerald',
    },
    {
      key: 'exercise',
      label: 'Exercise',
      value: exerciseDone ? 'Done' : 'Pending',
      caption: exerciseHabit ? `${exerciseHabit.streak}d streak` : 'Tap to log',
      icon: Activity,
      tileClass: 'tile-insights',
      iconClass: 'text-insights-teal',
    },
    {
      key: 'journal',
      label: 'Journal',
      value: 'Pending',
      caption: '2 min to reflect',
      icon: NotebookPen,
      tileClass: 'tile-journal',
      iconClass: 'text-goals-purple',
    },
  ];

  return (
    <section
      aria-label="Today's wellness summary"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {tiles.map((tile, i) => {
        const Icon = tile.icon;
        return (
          <motion.div
            key={tile.key}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: reducedMotion ? 0 : i * 0.04, ease: 'easeOut' }}
            className={cn('card card-tight hover-calm group', tile.tileClass)}
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-black/5 dark:bg-white/5',
                )}
              >
                <Icon className={cn('h-4.5 w-4.5', tile.iconClass)} aria-hidden="true" />
              </div>
              <span className="card-eyebrow">{tile.label}</span>
            </div>
            <div className="mt-2">
              <p className="card-value text-xl">{tile.value}</p>
              <p className="card-caption mt-0.5">{tile.caption}</p>
            </div>
          </motion.div>
        );
      })}
    </section>
  );
}