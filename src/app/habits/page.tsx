'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { CheckCircle2, Plus, Flame } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function HabitsPage() {
  const { habits } = useDashboardStore();

  return (
    <DashboardShell>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Habits</h1>
              <p className="text-sm text-muted-foreground">Build and track healthy routines</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full btn-primary-gradient text-sm font-medium"
            onClick={() => alert('Add Habit functionality coming soon!')}
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {habits.map((habit, index) => (
            <GlassCard key={habit.id} delay={0.1 + index * 0.05}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#F3FAF4] flex items-center justify-center">
                  <Flame className="w-6 h-6 text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{habit.name}</h3>
                  <p className="text-sm text-muted-foreground">{habit.streak}/{habit.targetDays} days this week</p>
                </div>
              </div>
              <div className="h-2 w-full bg-[#EEF7EF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#22C55E] rounded-full transition-all duration-300"
                  style={{ width: `${(habit.streak / habit.targetDays) * 100}%` }}
                />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

