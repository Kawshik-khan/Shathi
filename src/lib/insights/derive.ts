/**
 * Pure metric helpers for the Insights dashboard.
 *
 * All functions here are deterministic, side-effect free, and safe to unit test.
 * They consume the typed shapes already exported from `@/lib/api`.
 */

import type {
  DailyMood,
  Habit,
  JournalEntry,
  MoodAnalytics,
  MoodLog,
} from '@/lib/api';

export type InsightsRange = '7d' | '30d' | '90d';

export const RANGE_DAYS: Record<InsightsRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const mean = (values: Array<number | null | undefined>): number | null => {
  const valid = values.filter(
    (v): v is number => typeof v === 'number' && !Number.isNaN(v),
  );
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

const stddev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const pearson = (xs: number[], ys: number[]): number | null => {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const mx = mean(xs) ?? 0;
  const my = mean(ys) ?? 0;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  if (denom === 0) return null;
  return clamp(num / denom, -1, 1);
};

// ─── Wellness score ──────────────────────────────────────────────────────────

export interface WellnessScore {
  score: number;
  tier: 'Excellent' | 'Good' | 'Steady' | 'Building';
  delta: number | null;
}

export function computeWellnessScore(input: {
  moodAnalytics: MoodAnalytics | null;
  habitConsistency: number;
  sleepConsistency: number;
  journalCadence: number;
  prevScore: number | null;
}): WellnessScore {
  const mood = input.moodAnalytics?.avg_mood_7d ?? 0;
  const moodScore = (mood / 10) * 50; // up to 50 pts
  const habitScore = input.habitConsistency * 0.25; // up to 25 pts (0-1)
  const sleepScore = input.sleepConsistency * 15; // up to 15 pts (0-1)
  const journalScore = clamp(input.journalCadence, 0, 7) * (10 / 7); // up to 10 pts
  const raw = moodScore + habitScore + sleepScore + journalScore;
  const score = clamp(Math.round(raw), 0, 100);

  const tier: WellnessScore['tier'] =
    score >= 85
      ? 'Excellent'
      : score >= 70
        ? 'Good'
        : score >= 55
          ? 'Steady'
          : 'Building';

  const delta =
    input.prevScore !== null
      ? Math.round(((score - input.prevScore) / Math.max(input.prevScore, 1)) * 100)
      : null;

  return { score, tier, delta };
}

// ─── Mood stability ─────────────────────────────────────────────────────────

export interface MoodStability {
  points: Array<{ name: string; value: number }>;
  variation: number; // ±% rounded
  trend: 'up' | 'down' | 'stable' | string;
  status: 'Stable' | 'Improving' | 'Shaky' | 'Quiet';
}

export function computeMoodStability(
  mood: MoodAnalytics | null,
  days: number,
): MoodStability {
  const daily: DailyMood[] = mood?.daily_data ?? [];
  const points = daily
    .slice(-Math.min(7, daily.length || 7))
    .map((d, i) => {
      const dt = new Date(d.date);
      const name = Number.isNaN(dt.getTime())
        ? String(i + 1)
        : dt.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
      return { name, value: Math.round((d.avg_mood ?? 0) * 10) };
    });

  if (points.length === 0) {
    return {
      points: [],
      variation: 0,
      trend: 'stable',
      status: 'Quiet',
    };
  }

  const variation = Math.round(stddev(points.map((p) => p.value)));
  const trend = (mood?.trend_direction ?? 'stable') as MoodStability['trend'];

  const status: MoodStability['status'] =
    trend === 'up'
      ? 'Improving'
      : trend === 'down'
        ? 'Shaky'
        : variation <= 8
          ? 'Stable'
          : 'Shaky';

  return { points, variation, trend, status };
}

// ─── Sleep summary ──────────────────────────────────────────────────────────

export interface SleepSummary {
  avgMinutes: number | null;
  avgFormatted: string;
  consistency: number; // 0-1
  samples: number;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m}m`;
}

export function computeSleepSummary(
  logs: MoodLog[],
  days: number,
): SleepSummary {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = logs.filter((l) => {
    const ts = new Date(l.logged_at ?? l.created_at ?? '').getTime();
    return l.sleep != null && ts >= since;
  });

  const values = recent
    .map((l) => (l.sleep ?? 0) * 60) // backend stores sleep in hours
    .filter((v) => v > 0);

  if (!values.length) {
    return {
      avgMinutes: null,
      avgFormatted: '—',
      consistency: 0,
      samples: 0,
    };
  }

  const avg = mean(values) ?? 0;
  const within = values.filter((v) => Math.abs(v - avg) <= 60).length;
  return {
    avgMinutes: Math.round(avg),
    avgFormatted: formatMinutes(avg),
    consistency: within / values.length,
    samples: values.length,
  };
}

// ─── Habit consistency ──────────────────────────────────────────────────────

export interface HabitConsistency {
  rate: number; // 0-1
  bestStreak: number;
  currentStreak: number;
  totalActive: number;
}

export function computeHabitConsistency(
  habits: Habit[],
  days: number,
): HabitConsistency {
  if (!habits.length) {
    return {
      rate: 0,
      bestStreak: 0,
      currentStreak: 0,
      totalActive: 0,
    };
  }

  const totalTargets = habits.reduce(
    (acc, h) => acc + Math.max(1, h.target_count ?? 1) * days,
    0,
  );
  const observed = habits.reduce(
    (acc, h) => acc + Math.min(h.total_completions ?? 0, totalTargets),
    0,
  );
  const rate = totalTargets === 0 ? 0 : clamp(observed / totalTargets, 0, 1);

  const currentStreak = habits.reduce(
    (a, h) => Math.max(a, h.current_streak ?? 0),
    0,
  );
  const bestStreak = habits.reduce(
    (a, h) => Math.max(a, h.longest_streak ?? 0),
    0,
  );

  return {
    rate,
    bestStreak,
    currentStreak,
    totalActive: habits.length,
  };
}

// ─── Stress vs sleep correlation ────────────────────────────────────────────

export interface StressSleepInsight {
  avgStress: number | null;
  avgSleepHours: number | null;
  correlation: number | null;
  copy: string;
}

export function computeStressSleep(
  logs: MoodLog[],
  days: number,
): StressSleepInsight {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = logs.filter((l) => {
    const ts = new Date(l.logged_at ?? l.created_at ?? '').getTime();
    return ts >= since && (l.stress != null || l.sleep != null);
  });

  const stressValues = recent.map((l) => l.stress ?? null);
  const sleepValues = recent.map((l) => (l.sleep ?? null) as number | null);

  const stressSeries: number[] = [];
  const sleepSeries: number[] = [];
  for (let i = 0; i < recent.length; i += 1) {
    if (stressValues[i] != null && sleepValues[i] != null) {
      stressSeries.push(stressValues[i] as number);
      sleepSeries.push(sleepValues[i] as number);
    }
  }

  const correlation = pearson(stressSeries, sleepSeries);

  const avgStress = mean(stressValues);
  const avgSleepHours = mean(sleepValues);

  let copy = 'Add sleep and stress check-ins to unlock this insight.';
  if (correlation !== null && correlation <= -0.4) {
    copy =
      'Your stress drops measurably after nights above 7 hours. Sleep is your strongest lever right now.';
  } else if (correlation !== null && correlation >= 0.4) {
    copy = 'Higher-stress days tend to coincide with longer sleep — consider a wind-down routine earlier in the evening.';
  } else if (avgStress !== null && avgStress >= 6) {
    copy = 'Stress is running hot this week. Try a short breathing exercise between tasks.';
  } else if (avgSleepHours !== null && avgSleepHours < 7) {
    copy = 'Sleep is averaging below 7 hours — small bedtime adjustments can compound quickly.';
  }

  return {
    avgStress: avgStress !== null ? Math.round(avgStress * 10) / 10 : null,
    avgSleepHours:
      avgSleepHours !== null ? Math.round(avgSleepHours * 10) / 10 : null,
    correlation,
    copy,
  };
}

// ─── Burnout score ──────────────────────────────────────────────────────────

export type BurnoutRisk = 'low' | 'moderate' | 'high';

export interface BurnoutScore {
  score: number; // 0-100, higher = more at risk
  risk: BurnoutRisk;
  workloadBalance: number; // 0-100 (habit completion)
  description: string;
}

export function computeBurnout(input: {
  stressSleep: StressSleepInsight;
  habitConsistency: HabitConsistency;
  mood: MoodAnalytics | null;
}): BurnoutScore {
  const stress = input.stressSleep.avgStress ?? 0;
  const sleep = input.stressSleep.avgSleepHours ?? 8;
  const completion = input.habitConsistency.rate * 100;
  const moodPenalty = input.mood && input.mood.trend_direction === 'down' ? 10 : 0;

  const raw = clamp(
    stress * 9 + (8 - sleep) * 6 + (100 - completion) * 0.25 + moodPenalty,
    0,
    100,
  );
  const score = Math.round(raw);
  const risk: BurnoutRisk =
    score >= 60 ? 'high' : score >= 35 ? 'moderate' : 'low';

  const description =
    risk === 'high'
      ? 'You\'re carrying a heavy load. Schedule one full rest block in the next 48 hours.'
      : risk === 'moderate'
        ? 'Watch for creeping exhaustion — a small daily reset keeps this in check.'
        : 'You\'re managing stress well. Keep the routines that are working.';

  return {
    score,
    risk,
    workloadBalance: Math.round(completion),
    description,
  };
}

// ─── Habit impact (for the bar chart) ───────────────────────────────────────

export interface HabitImpactRow {
  label: string;
  value: number;
  color: string;
}

const HABIT_PALETTE: Record<string, string> = {
  meditate: '#22C55E',
  meditation: '#22C55E',
  breathing: '#22C55E',
  breath: '#22C55E',
  run: '#7ED957',
  exercise: '#7ED957',
  workout: '#7ED957',
  gym: '#7ED957',
  walk: '#7ED957',
  yoga: '#7ED957',
  sleep: '#6366F1',
  bedtime: '#6366F1',
  journal: '#86EFAC',
  write: '#86EFAC',
  reflect: '#86EFAC',
  gratitude: '#86EFAC',
  water: '#A7F3D0',
  hydration: '#A7F3D0',
  read: '#22C55E',
  default: '#A7F3D0',
};

function pickHabitColor(name: string): string {
  const key = name.toLowerCase();
  for (const hint of Object.keys(HABIT_PALETTE)) {
    if (key.includes(hint)) return HABIT_PALETTE[hint];
  }
  return HABIT_PALETTE.default;
}

export function computeHabitImpact(
  habits: Habit[],
  days: number,
): HabitImpactRow[] {
  if (!habits.length) return [];
  const maxCompletions = Math.max(
    1,
    ...habits.map((h) => h.total_completions ?? 0),
  );
  return habits
    .map<HabitImpactRow>((h) => {
      const observed = Math.min(h.total_completions ?? 0, days);
      const value = Math.round((observed / Math.max(days, 1)) * 100);
      return {
        label: h.name,
        value: clamp(value, 0, 100),
        color: pickHabitColor(h.name),
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

// ─── Heatmap data ───────────────────────────────────────────────────────────

export interface HeatmapDay {
  week: number; // 0-indexed
  day: number; // 0-6 (Mon..Sun)
  intensity: 0 | 1 | 2 | 3 | 4;
  mood: number | null;
}

export function computeHeatmap(logs: MoodLog[], weeks = 4): HeatmapDay[] {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7 + 1);
  since.setHours(0, 0, 0, 0);

  const buckets = new Map<string, number[]>();
  for (const log of logs) {
    if (log.mood == null) continue;
    const dt = new Date(log.logged_at ?? log.created_at ?? '');
    if (Number.isNaN(dt.getTime()) || dt < since) continue;
    const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    const arr = buckets.get(key) ?? [];
    arr.push(log.mood);
    buckets.set(key, arr);
  }

  const result: HeatmapDay[] = [];
  for (let w = 0; w < weeks; w += 1) {
    for (let d = 0; d < 7; d += 1) {
      const cell = new Date(since);
      cell.setDate(since.getDate() + w * 7 + d);
      const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
      const samples = buckets.get(key);
      if (!samples || !samples.length) {
        result.push({ week: w, day: d, intensity: 0, mood: null });
        continue;
      }
      const avg = mean(samples) ?? 0;
      // Map 1-10 mood to 0-4 intensity buckets
      const intensity = (clamp(Math.round(avg / 2), 1, 5) - 1) as HeatmapDay['intensity'];
      result.push({
        week: w,
        day: d,
        intensity,
        mood: Math.round(avg * 10) / 10,
      });
    }
  }
  return result;
}

// ─── Recommendation engine ─────────────────────────────────────────────────

export type RecKey =
  | 'breathing'
  | 'sleep'
  | 'journal'
  | 'mindfulness'
  | 'hydration'
  | 'energy'
  | 'movement';

export interface Recommendation {
  id: RecKey;
  title: string;
  description: string;
  benefit: string;
  iconKey: RecKey;
}

interface RecommendationContext {
  stressSleep: StressSleepInsight;
  sleep: SleepSummary;
  habitConsistency: HabitConsistency;
  journalCount30d: number;
}

export function buildRecommendations(
  ctx: RecommendationContext,
): Recommendation[] {
  const out: Recommendation[] = [];

  if ((ctx.stressSleep.avgStress ?? 0) >= 6) {
    out.push({
      id: 'breathing',
      title: 'Calm Breathing',
      description: '4-7-8 breathing technique for 5 minutes',
      benefit: 'Lowers acute stress',
      iconKey: 'breathing',
    });
  }
  if ((ctx.sleep.avgMinutes ?? 0) < 7 * 60 || (ctx.sleep.consistency ?? 0) < 0.7) {
    out.push({
      id: 'sleep',
      title: 'Sleep Wind-Down',
      description: 'Lights out at the same time for 7 nights',
      benefit: 'Stabilizes sleep schedule',
      iconKey: 'sleep',
    });
  }
  if (ctx.journalCount30d < 3) {
    out.push({
      id: 'journal',
      title: 'Gratitude Journal',
      description: 'Write 3 gratitudes before bed',
      benefit: 'Builds emotional resilience',
      iconKey: 'journal',
    });
  }
  if (ctx.habitConsistency.rate < 0.5) {
    out.push({
      id: 'mindfulness',
      title: 'Anchor Habit',
      description: 'Pair one habit with an existing routine',
      benefit: 'Lifts adherence',
      iconKey: 'mindfulness',
    });
  } else if (ctx.habitConsistency.currentStreak >= 7) {
    out.push({
      id: 'movement',
      title: 'Gentle Movement',
      description: '10-minute walk between deep-work blocks',
      benefit: 'Sustains your streak',
      iconKey: 'movement',
    });
  }
  if (out.length < 4) {
    out.push({
      id: 'hydration',
      title: 'Hydration Reminder',
      description: '8 glasses of water across the day',
      benefit: 'Sharper focus',
      iconKey: 'hydration',
    });
  }
  if (out.length < 5) {
    out.push({
      id: 'energy',
      title: 'Energy Reset',
      description: '90-minute focus blocks with 10-min breaks',
      benefit: 'Prevents burnout',
      iconKey: 'energy',
    });
  }
  return out.slice(0, 6);
}

// ─── Reflection & milestones ────────────────────────────────────────────────

export interface AiReflection {
  headline: string;
  copy: string;
  delta: { mood: number | null; sleepMinutes: number | null; habitPct: number | null };
  highlight: string;
}

export function computeReflection(input: {
  mood: MoodAnalytics | null;
  journals: JournalEntry[];
  sleep: SleepSummary;
  habitConsistency: HabitConsistency;
}): AiReflection | null {
  if (
    !input.mood &&
    !input.journals.length &&
    input.habitConsistency.totalActive === 0
  ) {
    return null;
  }

  const latestJournal = input.journals[0];
  const headline = latestJournal
    ? `🌱 ${latestJournal.title || 'Your latest reflection'}`
    : input.mood?.trend_direction === 'up'
      ? '🌱 A positive week'
      : '🌱 Steady as you go';

  const copy =
    latestJournal?.ai_insights ||
    latestJournal?.emotion_summary ||
    (input.mood?.avg_mood_7d
      ? `Your average mood this week is ${input.mood.avg_mood_7d.toFixed(1)} / 10.`
      : 'Keep checking in to unlock deeper reflection.');

  const moodDelta =
    input.mood && input.mood.avg_mood_7d && input.mood.avg_mood_30d
      ? Math.round((input.mood.avg_mood_7d - input.mood.avg_mood_30d) * 10)
      : null;

  return {
    headline,
    copy,
    delta: {
      mood: moodDelta,
      sleepMinutes:
        input.sleep.avgMinutes !== null
          ? Math.round(input.sleep.avgMinutes - 7.5 * 60)
          : null,
      habitPct: Math.round(input.habitConsistency.rate * 100),
    },
    highlight: latestJournal?.title || 'Latest journal entry',
  };
}

export function buildMilestones(journals: JournalEntry[]): Array<{
  title: string;
  description: string;
  date: string;
  type: 'achievement' | 'reflection' | 'breakthrough';
  trend: 'up' | 'down';
}> {
  if (!journals.length) return [];
  return journals.slice(0, 3).map((j, idx) => {
    const dt = new Date(j.written_at ?? j.created_at);
    const days = Math.max(
      0,
      Math.floor((Date.now() - dt.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const sentiment = j.sentiment_score ?? 0;
    const type: 'achievement' | 'reflection' | 'breakthrough' =
      idx === 0 && sentiment > 0.4
        ? 'breakthrough'
        : j.ai_insights
          ? 'achievement'
          : 'reflection';
    return {
      title: j.title || j.emotion_summary || 'Journal entry',
      description:
        j.ai_insights || j.emotion_summary || 'Captured a moment of reflection.',
      date:
        days === 0
          ? 'Today'
          : days === 1
            ? 'Yesterday'
            : `${days} days ago`,
      type,
      trend: sentiment >= 0 ? 'up' : 'down',
    };
  });
}

// ─── Mood line (timeline) ───────────────────────────────────────────────────

export function computeTimeline(
  mood: MoodAnalytics | null,
  days: number,
): Array<{ name: string; value: number }> {
  const daily = mood?.daily_data ?? [];
  const slice = daily.slice(-Math.min(days, daily.length));
  return slice.map((d, i) => {
    const dt = new Date(d.date);
    const name = Number.isNaN(dt.getTime())
      ? String(i + 1)
      : dt.toLocaleDateString('en-US', { weekday: 'short' });
    return { name, value: Math.round((d.avg_mood ?? 0) * 10) };
  });
}

// ─── Formatting helpers ─────────────────────────────────────────────────────

export function formatSignedDelta(delta: number | null, suffix = '%') {
  if (delta === null || Number.isNaN(delta)) return '—';
  if (delta === 0) return `0${suffix}`;
  return `${delta > 0 ? '+' : ''}${delta}${suffix}`;
}

export function formatDuration(min: number | null) {
  if (min === null) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
