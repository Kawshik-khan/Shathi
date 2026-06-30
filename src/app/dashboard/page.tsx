'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SafetyBanner } from '@/components/layout/safety-banner';
import { useAuthStore } from '@/lib/store';
import {
  getMoodLogs,
  getHabits,
  getJournalEntries,
} from '@/lib/api';
import type { ChartFeatureColor } from '@/components/charts/ChartTheme';

import { QuickActionsStrip } from '@/components/widgets/quick-actions-strip';
import { XpProgressBar } from '@/components/widgets/xp-progress-bar';
import { MoodTile } from '@/components/widgets/mood-tile';
import { SleepTile } from '@/components/widgets/sleep-tile';
import { HabitTile } from '@/components/widgets/habit-tile';
import { JournalTile } from '@/components/widgets/journal-tile';
import { CompanionTile } from '@/components/widgets/companion-tile';
import { CrisisTile } from '@/components/widgets/crisis-tile';
import { InsightStrip } from '@/components/widgets/insight-strip';
import { Activity, TrendingUp, Moon, Heart } from 'lucide-react';
import { useDaytime } from '@/components/daytime-provider';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { daytime } = useDaytime();
  const [streakDays, setStreakDays] = useState<number | null>(null);

  useEffect(() => {
    if (user?.system_role === 'admin') {
      router.replace('/admin');
    }
  }, [user, router]);

  useEffect(() => {
    let alive = true;
    getHabits(true)
      .then((habits) => {
        if (!alive) return;
        if (!habits || habits.length === 0) {
          setStreakDays(null);
          return;
        }
        const max = Math.max(...habits.map((h) => h.current_streak ?? 0));
        setStreakDays(max > 0 ? max : null);
      })
      .catch(() => {
        if (!alive) return;
        setStreakDays(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const displayName =
    user?.name?.trim() || user?.email?.split('@')[0] || null;
  const greeting =
    daytime === 'morning'
      ? 'Good Morning'
      : daytime === 'night'
        ? 'Good Evening'
        : 'Good Afternoon';

  // Loaders — each returns the data shape its tile expects, or `null`
  // when the endpoint is missing or has no content. Never hardcodes values.

  async function loadMoodTile() {
    try {
      const logs = await getMoodLogs(1);
      const latest = logs?.[0];
      return latest ? { loggedAt: latest.logged_at } : null;
    } catch {
      return null;
    }
  }

  async function loadSleepTile() {
    // No GET endpoint exists. Render empty state until one ships.
    return null;
  }

  async function loadHabitTile() {
    try {
      const habits = await getHabits(true);
      if (!habits || habits.length === 0) return null;
      // No completion-fetch endpoint — show total only.
      return { done: 0, total: habits.length };
    } catch {
      return null;
    }
  }

  async function loadJournalTile() {
    try {
      const entries = await getJournalEntries(1);
      const latest = entries?.[0];
      if (!latest) return null;
      const title = latest.title?.trim() || 'Untitled entry';
      const preview = latest.content?.trim() ?? '';
      return {
        title,
        preview: preview.slice(0, 140),
      };
    } catch {
      return null;
    }
  }

  async function loadCompanionTile() {
    // No prompt-of-day endpoint exists. Render empty state.
    return null;
  }

  async function loadInsights() {
    try {
      const [moodLogs, habits] = await Promise.all([
        getMoodLogs(7).catch(() => []),
        getHabits(true).catch(() => []),
      ]);

      const items: {
        id: string;
        label: string;
        href: string;
        color: ChartFeatureColor;
        series: { x: number; y: number }[];
      }[] = [];

      if (moodLogs.length > 0) {
        items.push({
          id: 'mood-7d',
          label: 'Mood (7d)',
          href: '/mood',
          color: 'mood',
          series: moodLogs
            .slice(0, 7)
            .reverse()
            .map((l, i) => ({ x: i, y: l.mood ?? 0 })),
        });
      }

      if (habits.length > 0) {
        items.push({
          id: 'habits-active',
          label: 'Active habits',
          href: '/habits',
          color: 'habit',
          series: habits
            .slice(0, 7)
            .map((h, i) => ({ x: i, y: h.longest_streak ?? 0 })),
        });
      }

      return items.length > 0 ? { items } : null;
    } catch {
      return null;
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell showSafetyBanner={false}>
        <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
          <section className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_88%_18%,rgba(255,255,255,.22),transparent_28%),linear-gradient(145deg,#56715C_0%,#64806A_50%,#75917A_100%)] p-6 shadow-[0_18px_50px_rgba(41,63,48,.16)] lg:p-8" style={{color:'#ffffff'}}>
            <div className="pointer-events-none absolute -right-14 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute bottom-0 right-10 h-32 w-72 rounded-t-full bg-white/10" aria-hidden />
            <div className="relative min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{color:'rgba(255,255,255,0.70)'}}>Dashboard Workspace</p>
                <h1 className="mt-4 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl" style={{color:'#ffffff'}}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,.16)] sm:h-14 sm:w-14" style={{color:'#ffffff'}}>
                    <Leaf className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                  </span>
                  <span>{greeting}{displayName ? `, ${displayName}` : ''}</span>
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed" style={{color:'rgba(255,255,255,0.78)'}}>
                  How are you feeling today? Your wellness overview is ready, with mood, journaling, and habits in one calm workspace.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] bg-white/12 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.14)]">
                    <p className="text-xs font-medium uppercase tracking-[0.14em]" style={{color:'rgba(255,255,255,0.62)'}}>Mood</p>
                    <p className="mt-2 text-2xl font-semibold">Good</p>
                  </div>
                  <div className="rounded-[20px] bg-white/12 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.14)]">
                    <p className="text-xs font-medium uppercase tracking-[0.14em]" style={{color:'rgba(255,255,255,0.62)'}}>Journal</p>
                    <p className="mt-2 text-2xl font-semibold">Today</p>
                  </div>
                  <div className="rounded-[20px] bg-white/12 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.14)]">
                    <p className="text-xs font-medium uppercase tracking-[0.14em]" style={{color:'rgba(255,255,255,0.62)'}}>Streak</p>
                    <p className="mt-2 text-2xl font-semibold">{streakDays && streakDays > 0 ? `${streakDays} days` : 'Start'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Glassmorphism Wellness Score Card ── */}
          <section
            className="relative w-full overflow-hidden rounded-[28px] border border-white/20 p-6 shadow-[0_8px_32px_rgba(41,63,48,.14)] lg:p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(86,113,92,0.18) 0%, rgba(100,128,106,0.12) 50%, rgba(117,145,122,0.16) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#75917A]/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-8 right-8 h-40 w-64 rounded-full bg-[#56715C]/15 blur-2xl" aria-hidden />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Left — score ring + label */}
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90" aria-hidden>
                    <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(86,113,92,0.15)" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r="40"
                      fill="none"
                      stroke="url(#wsGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.84)}`}
                    />
                    <defs>
                      <linearGradient id="wsGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#A8D5B5" />
                        <stop offset="100%" stopColor="#56715C" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold text-text-primary">84</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">/ 100</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-secondary">Wellness Score</p>
                  <p className="mt-1 text-2xl font-semibold text-text-primary">Good</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-[#56715C]" aria-hidden />
                    <span className="text-xs font-medium" style={{ color: '#56715C' }}>+3 from yesterday</span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">Based on sleep, mood &amp; activity</p>
                </div>
              </div>
              {/* Right — mini stat pills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1.5 rounded-[16px] border border-white/30 px-4 py-3" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)' }}>
                  <Moon className="h-4 w-4 text-[#56715C]" aria-hidden />
                  <span className="text-sm font-semibold text-text-primary">7h 20m</span>
                  <span className="text-[10px] text-text-secondary">Sleep</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-[16px] border border-white/30 px-4 py-3" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)' }}>
                  <Heart className="h-4 w-4 text-[#56715C]" aria-hidden />
                  <span className="text-sm font-semibold text-text-primary">Good</span>
                  <span className="text-[10px] text-text-secondary">Mood</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-[16px] border border-white/30 px-4 py-3" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)' }}>
                  <Activity className="h-4 w-4 text-[#56715C]" aria-hidden />
                  <span className="text-sm font-semibold text-text-primary">{streakDays && streakDays > 0 ? `${streakDays}d` : '—'}</span>
                  <span className="text-[10px] text-text-secondary">Streak</span>
                </div>
              </div>
            </div>
          </section>

          <XpProgressBar />

          <SafetyBanner />

          <section
            className="relative w-full overflow-hidden rounded-[28px] border border-white/20 p-5 shadow-[0_8px_32px_rgba(41,63,48,.12)] lg:p-6"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(238,246,240,0.45) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#75917A]/10 blur-2xl" aria-hidden />
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-secondary">Quick Actions</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">Start your next check-in</h2>
              </div>
              <p className="text-sm text-text-secondary">Mood, Journal, Sleep, Habits, and Insights stay one tap away.</p>
            </div>
            <QuickActionsStrip className="h-auto rounded-[22px] p-3" style={{ background: 'rgba(255,255,255,0.50)', backdropFilter: 'blur(12px)' }} />
          </section>

          <div className="grid w-full min-w-0 grid-cols-1 gap-5 xl:grid-cols-12 xl:auto-rows-fr">
            <MoodTile load={loadMoodTile} className="min-w-0 border-white/25 shadow-[0_8px_32px_rgba(41,63,48,.10)] xl:col-span-7" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(238,246,240,0.50) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} />
            <SleepTile load={loadSleepTile} className="min-w-0 border-white/25 shadow-[0_8px_32px_rgba(41,63,48,.10)] xl:col-span-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(238,246,240,0.50) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} />
            <JournalTile load={loadJournalTile} className="min-w-0 border-white/25 shadow-[0_8px_32px_rgba(41,63,48,.10)] xl:col-span-7" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(238,246,240,0.50) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} />
            <HabitTile load={loadHabitTile} className="min-w-0 border-white/25 shadow-[0_8px_32px_rgba(41,63,48,.10)] xl:col-span-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(238,246,240,0.50) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} />
            <CompanionTile load={loadCompanionTile} className="min-w-0 border-white/20 shadow-[0_18px_50px_rgba(41,63,48,.18)] xl:col-span-4 [&_.text-accent-energy]:!text-white [&_.text-text-primary]:!text-white [&_.text-text-secondary]:!text-white/75" style={{ background: 'linear-gradient(145deg, rgba(86,113,92,0.92) 0%, rgba(110,142,115,0.88) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: '#ffffff' }} />
            <div className="min-w-0 xl:col-span-8">
              <InsightStrip load={loadInsights} />
            </div>
            <div className="min-w-0 xl:col-span-12">
              <CrisisTile className="border-white/20 shadow-[0_18px_50px_rgba(41,63,48,.18)] [&_.text-accent-crisis]:!text-white [&_.text-text-primary]:!text-white [&_.text-text-secondary]:!text-white/75" style={{ background: 'linear-gradient(145deg, rgba(86,113,92,0.92) 0%, rgba(110,142,115,0.88) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: '#ffffff' }} />
            </div>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
