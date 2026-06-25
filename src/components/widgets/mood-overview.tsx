'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { getAuthToken, getMoodAnalytics, type MoodAnalytics } from '@/lib/api';
import { TrendingUp, ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts';

export function MoodOverview() {
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
  const trendLabel = analytics?.trend_direction === 'down' ? 'Lower' : analytics?.trend_direction === 'up' ? 'Rising' : 'Stable';

  return (
    <GlassCard className="h-full" delay={0.1}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#4A90A4]" />
          <span className="text-sm font-medium text-muted-foreground">Mood Overview</span>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          type="button"
          disabled
        >
          Weekly
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Score Display */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-4xl font-bold text-foreground">
          {loading ? '-' : currentScore ? currentScore.toFixed(1) : '0.0'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[#E3F0F3] text-[#4A90A4] text-xs font-medium">
          {trendLabel}
        </span>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1 mb-6">
        <TrendingUp className="w-3.5 h-3.5 text-[#4A90A4]" />
        <span className="text-xs text-[#4A90A4] font-medium capitalize">{analytics?.trend_direction ?? 'stable'}</span>
        <span className="text-xs text-muted-foreground">this week</span>
      </div>

      {/* Chart */}
      <div className="h-24 min-h-[96px] -mx-2 relative">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-red-500">{error}</div>
        ) : weeklyData.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Log your first mood to see a trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={96}>
            <LineChart data={weeklyData}>
              <YAxis domain={[0, 10]} hide />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#4A90A4"
                strokeWidth={2.5}
                dot={{ fill: '#4A90A4', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#4A90A4', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Days Labels */}
      <div className="flex justify-between mt-2 px-1">
        {(weeklyData.length ? weeklyData : ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => ({ day, score: 0 }))).map((day, i) => (
          <span 
            key={i} 
            className={`text-xs ${i === 6 ? 'text-[#4A90A4] font-medium' : 'text-muted-foreground'}`}
          >
            {day.day}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

