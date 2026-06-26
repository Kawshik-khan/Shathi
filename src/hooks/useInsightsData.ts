'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getHabits,
  getJournalEntries,
  getMoodAnalytics,
  getMoodInference,
  getMoodLogs,
  type Habit,
  type JournalEntry,
  type MoodAnalytics,
  type MoodInference,
  type MoodLog,
} from '@/lib/api';
import {
  RANGE_DAYS,
  type InsightsRange,
} from '@/lib/insights/derive';

export interface InsightsData {
  mood: MoodAnalytics | null;
  moodLogs: MoodLog[];
  inference: MoodInference | null;
  habits: Habit[];
  journals: JournalEntry[];
}

export type InsightsSlice =
  | 'mood'
  | 'sleep'
  | 'habits'
  | 'journal';

export interface InsightsFilters {
  range: InsightsRange;
  visible: Set<InsightsSlice>;
}

export interface UseInsightsDataResult extends InsightsData {
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filters: InsightsFilters;
  setRange: (range: InsightsRange) => void;
  toggleSlice: (slice: InsightsSlice) => void;
  setVisible: (slices: InsightsSlice[]) => void;
  days: number;
}

const ALL_SLICES: InsightsSlice[] = ['mood', 'sleep', 'habits', 'journal'];

export function useInsightsData(initialRange: InsightsRange = '30d'): UseInsightsDataResult {
  const [range, setRangeState] = useState<InsightsRange>(initialRange);
  const [visible, setVisibleState] = useState<Set<InsightsSlice>>(
    () => new Set(ALL_SLICES),
  );
  const days = RANGE_DAYS[range];

  const [mood, setMood] = useState<MoodAnalytics | null>(null);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [inference, setInference] = useState<MoodInference | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setIsLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      getMoodAnalytics(days),
      getMoodLogs(90, 0),
      getMoodInference(Math.min(days, 90)),
      getHabits(true),
      getJournalEntries(20, 0),
    ]);

    if (id !== reqId.current) return;

    const failures: string[] = [];
    if (results[0].status === 'fulfilled') {
      setMood(results[0].value);
    } else {
      setMood(null);
      failures.push('mood');
    }
    if (results[1].status === 'fulfilled') {
      setMoodLogs(results[1].value);
    } else {
      setMoodLogs([]);
      failures.push('mood logs');
    }
    if (results[2].status === 'fulfilled') {
      setInference(results[2].value);
    } else {
      setInference(null);
    }
    if (results[3].status === 'fulfilled') {
      setHabits(results[3].value);
    } else {
      setHabits([]);
      failures.push('habits');
    }
    if (results[4].status === 'fulfilled') {
      setJournals(results[4].value);
    } else {
      setJournals([]);
      failures.push('journal');
    }

    setError(failures.length ? `Couldn’t load ${failures.join(', ')}.` : null);
    setIsLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  const setRange = useCallback((next: InsightsRange) => {
    setRangeState(next);
  }, []);

  const toggleSlice = useCallback((slice: InsightsSlice) => {
    setVisibleState((prev) => {
      const next = new Set(prev);
      if (next.has(slice)) next.delete(slice);
      else next.add(slice);
      // Never allow zero slices — fall back to all.
      if (next.size === 0) return new Set(ALL_SLICES);
      return next;
    });
  }, []);

  const setVisible = useCallback((slices: InsightsSlice[]) => {
    if (!slices.length) {
      setVisibleState(new Set(ALL_SLICES));
      return;
    }
    setVisibleState(new Set(slices));
  }, []);

  return {
    mood,
    moodLogs,
    inference,
    habits,
    journals,
    isLoading,
    error,
    refetch,
    filters: { range, visible },
    setRange,
    toggleSlice,
    setVisible,
    days,
  };
}