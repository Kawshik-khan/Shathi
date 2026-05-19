'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import {
  createMoodLog,
  getMoodAnalytics,
  getMoodLogs,
  type MoodAnalytics,
  type MoodLog,
} from '@/lib/api';
import { Calendar, Clock, Loader2, Smile, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const moodOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export default function MoodPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
  const [mood, setMood] = useState(7);
  const [stress, setStress] = useState(4);
  const [energy, setEnergy] = useState(6);
  const [sleep, setSleep] = useState(7);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadMoodData() {
    setLoading(true);
    setError('');

    try {
      const [nextLogs, nextAnalytics] = await Promise.all([
        getMoodLogs(30),
        getMoodAnalytics(30),
      ]);
      setLogs(nextLogs);
      setAnalytics(nextAnalytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load mood data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getMoodLogs(30),
      getMoodAnalytics(30),
    ])
      .then(([nextLogs, nextAnalytics]) => {
        if (!mounted) return;
        setLogs(nextLogs);
        setAnalytics(nextAnalytics);
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

  const chartData = useMemo(() => {
    if (analytics?.daily_data?.length) {
      return analytics.daily_data.map((day) => ({
        date: formatDate(day.date),
        mood: Number(day.avg_mood.toFixed(1)),
        stress: day.avg_stress ? Number(day.avg_stress.toFixed(1)) : 0,
        energy: day.avg_energy ? Number(day.avg_energy.toFixed(1)) : 0,
      }));
    }

    return logs
      .slice()
      .reverse()
      .map((entry) => ({
        date: formatDate(entry.logged_at),
        mood: entry.mood,
        stress: entry.stress ?? 0,
        energy: entry.energy ?? 0,
      }));
  }, [analytics, logs]);

  const averageMood = analytics?.avg_mood_30d ?? 0;
  const trendIcon = analytics?.trend_direction === 'down' ? TrendingDown : TrendingUp;
  const TrendIcon = trendIcon;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createMoodLog({
        mood,
        stress,
        energy,
        sleep,
        note: note.trim() || undefined,
      });
      setNote('');
      setSuccess('Mood log saved.');
      await loadMoodData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save mood log.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
              <Smile className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Mood Tracking</h1>
              <p className="text-sm text-muted-foreground">Track and analyze your emotional patterns</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-[#A7F3A0]/60 bg-[#F3FAF4] px-4 py-3 text-sm text-[#22C55E]">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5 mb-5">
            <GlassCard delay={0.05} glowOnHover={false}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Log today</h2>
                  <p className="text-sm text-muted-foreground">Save a quick check-in for your wellbeing trend.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Mood</label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {moodOptions.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMood(value)}
                        className={`h-10 rounded-full text-sm font-semibold transition-colors ${
                          mood === value
                            ? 'bg-[#22C55E] text-white shadow-glow'
                            : 'bg-[#F3FAF4] text-muted-foreground hover:bg-[#EEF7EF]'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    ['Stress', stress, setStress],
                    ['Energy', energy, setEnergy],
                    ['Sleep', sleep, setSleep],
                  ].map(([label, value, setter]) => (
                    <label key={label as string} className="block">
                      <span className="text-sm font-medium text-foreground">{label as string}</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={value as number}
                        onChange={(event) => (setter as (next: number) => void)(Number(event.target.value))}
                        className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                      />
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">Note</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    placeholder="What influenced your mood today?"
                    className="mt-2 w-full resize-none rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full btn-primary-gradient px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save mood log
                </button>
              </form>
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <GlassCard delay={0.1}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendIcon className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-sm text-muted-foreground">Average Mood</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? '-' : averageMood ? averageMood.toFixed(1) : '0.0'}
                </p>
                <p className="text-xs text-[#22C55E] capitalize">{analytics?.trend_direction ?? 'stable'} trend</p>
              </GlassCard>

              <GlassCard delay={0.15}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-sm text-muted-foreground">This Month</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{loading ? '-' : logs.length}</p>
                <p className="text-xs text-muted-foreground">Entries tracked</p>
              </GlassCard>

              <GlassCard delay={0.2}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-sm text-muted-foreground">Streak</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{loading ? '-' : analytics?.current_streak ?? 0}</p>
                <p className="text-xs text-muted-foreground">Days in a row</p>
              </GlassCard>

              <GlassCard className="sm:col-span-3 min-h-[340px]" delay={0.25} glowOnHover={false}>
                <h3 className="text-lg font-medium text-foreground mb-4">Mood History</h3>
                {loading ? (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading mood data
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-center text-muted-foreground">
                    Your mood chart will appear after your first check-in.
                  </div>
                ) : (
                  <div className="h-64 min-h-[256px] min-w-0">
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart data={chartData}>
                        <CartesianGrid stroke="rgba(34,197,94,0.12)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip wrapperStyle={{ pointerEvents: 'none' }} />
                        <Line type="monotone" dataKey="mood" stroke="#22C55E" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="energy" stroke="#7ED957" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
            <GlassCard delay={0.3} glowOnHover={false}>
              <h3 className="text-lg font-medium text-foreground mb-4">Stress and Energy</h3>
              <div className="h-64 min-h-[256px] min-w-0">
                {chartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Stress and energy trends need at least one entry.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={chartData}>
                      <CartesianGrid stroke="rgba(34,197,94,0.12)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip wrapperStyle={{ pointerEvents: 'none' }} />
                      <Bar dataKey="stress" fill="#A7F3A0" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="energy" fill="#22C55E" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>

            <GlassCard delay={0.35} glowOnHover={false}>
              <h3 className="text-lg font-medium text-foreground mb-4">Recent Entries</h3>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mood logs yet. Start with today&apos;s check-in.</p>
              ) : (
                <div className="space-y-3">
                  {logs.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-[#F3FAF4]/70 p-4 dark:bg-secondary">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">Mood {entry.mood}/10</p>
                        <p className="text-xs text-muted-foreground">{formatDate(entry.logged_at)}</p>
                      </div>
                      {entry.note && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{entry.note}</p>}
                      {entry.emotion_detected && (
                        <p className="mt-2 text-xs text-[#22C55E]">Detected: {entry.emotion_detected}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
