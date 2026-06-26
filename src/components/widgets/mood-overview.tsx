'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import { getAuthToken, getMoodAnalytics, type MoodAnalytics } from '@/lib/api';
import { cn } from '@/lib/utils';

export function MoodOverview() {
  const reducedMotion = useReducedMotion();
  const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
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

    getMoodAnalytics(7)
      .then((data) => {
        if (mounted) setAnalytics(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load mood data.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const weeklyData = useMemo(() => {
    if (!analytics?.daily_data?.length) return [];
    return analytics.daily_data.slice(-7).map((day) => ({
      day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(day.date)).slice(0, 1),
      score: Number(day.avg_mood.toFixed(1)),
    }));
  }, [analytics]);

  const currentScore = analytics?.avg_mood_7d ?? 0;
  const direction = analytics?.trend_direction ?? 'stable';
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const trendLabel = direction === 'down' ? 'Lower' : direction === 'up' ? 'Rising' : 'Stable';
  const tone = direction === 'down' ? 'text-mood-red' : 'text-mood-green';

  return (
    <div className="card card-interactive h-full tile-mood">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="card-eyebrow">Mood Overview</span>
        </div>
        <button
          type="button"
          disabled
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-ring rounded-md px-2 py-1 transition-colors"
        >
          Weekly
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>
      </header>

      <div className="flex items-baseline gap-2">
        <span className="card-value text-3xl">
          {loading ? '–' : currentScore ? currentScore.toFixed(1) : '0.0'}
        </span>
        <span className="card-caption">/10</span>
      </div>

      <div className="mt-1 flex items-center gap-1.5">
        <TrendIcon className={cn('h-3.5 w-3.5', tone)} aria-hidden="true" />
        <span className={cn('text-xs font-medium capitalize', tone)}>{trendLabel} this week</span>
      </div>

      <div className="-mx-2 mt-4 h-24 min-h-24">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Loading
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-error">
            {error}
          </div>
        ) : weeklyData.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Log your first mood to see a trend.
          </div>
        ) : (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height={96}>
              <LineChart data={weeklyData}>
                <YAxis domain={[0, 10]} hide />
                <Line
                  type="monotone"
                  dataKey="score"
                  className="text-mood-green"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  dot={{ fill: 'currentColor', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: 'currentColor', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      <div className="mt-2 flex justify-between px-1">
        {(weeklyData.length ? weeklyData : ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => ({ day: d, score: 0 }))).map(
          (day, i) => (
            <span
              key={i}
              className={cn(
                'text-[11px]',
                i === weeklyData.length - 1 && weeklyData.length
                  ? 'font-semibold text-mood-green'
                  : 'text-muted-foreground',
              )}
            >
              {day.day}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

