'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { Dumbbell, Play, Calendar } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function WorkoutsPage() {
  const { trainingDays } = useDashboardStore();

  return (
    <DashboardShell>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Workouts</h1>
            <p className="text-sm text-muted-foreground">Your fitness journey</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <GlassCard delay={0.1}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{trainingDays.length}</p>
            <p className="text-xs text-muted-foreground">Workouts completed</p>
          </GlassCard>

          <GlassCard delay={0.15}>
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-3xl font-bold text-foreground">142</p>
            <p className="text-xs text-muted-foreground">Workouts this year</p>
          </GlassCard>
        </div>

        <GlassCard delay={0.2}>
          <h3 className="text-lg font-medium text-foreground mb-4">Today&apos;s Workout</h3>
          <div className="p-4 rounded-xl bg-[#F3FAF4] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#A7F3A0] to-[#7ED957] flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Full Body Strength</h4>
                <p className="text-sm text-muted-foreground">45 min • Intermediate</p>
              </div>
            </div>
            <button
              className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center hover:bg-[#16A34A] transition-colors"
              onClick={() => alert('Workout functionality coming soon!')}
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </button>
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}

