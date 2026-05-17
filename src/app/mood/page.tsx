'use client';

'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { Smile, TrendingUp, Calendar, Clock } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function MoodPage() {
  const { moodOverview } = useDashboardStore();

  return (
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

        <div className="grid grid-cols-3 gap-5 mb-5">
          <GlassCard delay={0.1}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">Average Mood</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{moodOverview.currentScore}</p>
            <p className="text-xs text-[#22C55E]">+{moodOverview.trend}% from last month</p>
          </GlassCard>

          <GlassCard delay={0.15}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">This Month</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{moodOverview.weeklyData.length}</p>
            <p className="text-xs text-muted-foreground">Days tracked</p>
          </GlassCard>

          <GlassCard delay={0.2}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">Streak</span>
            </div>
            <p className="text-3xl font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Days in a row</p>
          </GlassCard>
        </div>

        <GlassCard className="min-h-[400px]" delay={0.25}>
          <h3 className="text-lg font-medium text-foreground mb-4">Mood History</h3>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Detailed mood analytics chart will appear here
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}

