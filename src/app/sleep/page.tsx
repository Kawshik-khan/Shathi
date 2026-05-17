'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { Moon, Clock, Star } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

export default function SleepPage() {
  const { sleepData } = useDashboardStore();

  return (
    <DashboardShell>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
            <Moon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sleep</h1>
            <p className="text-sm text-muted-foreground">Track and improve your rest</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-5">
          <GlassCard delay={0.1}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">Last Night</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{sleepData.duration}</p>
            <p className="text-xs text-[#22C55E]">{sleepData.qualityLabel} duration</p>
          </GlassCard>

          <GlassCard delay={0.15}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">Quality</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{sleepData.quality}%</p>
            <p className="text-xs text-muted-foreground">Deep sleep: 2h 15m</p>
          </GlassCard>

          <GlassCard delay={0.2}>
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-[#22C55E]" />
              <span className="text-sm text-muted-foreground">Average</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{sleepData.hours}h {sleepData.minutes}m</p>
            <p className="text-xs text-muted-foreground">This week</p>
          </GlassCard>
        </div>

        <GlassCard className="min-h-[300px]" delay={0.25}>
          <h3 className="text-lg font-medium text-foreground mb-4">Sleep Trends</h3>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Sleep analysis chart will appear here
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}

