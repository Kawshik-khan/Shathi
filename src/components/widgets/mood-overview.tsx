'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { useDashboardStore } from '@/lib/store';
import { TrendingUp, ChevronDown } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts';

export function MoodOverview() {
  const { moodOverview } = useDashboardStore();

  return (
    <GlassCard className="h-full" delay={0.1}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#22C55E]" />
          <span className="text-sm font-medium text-muted-foreground">Mood Overview</span>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => alert('Period selection coming soon!')}
        >
          Weekly
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Score Display */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-4xl font-bold text-foreground">
          {moodOverview.currentScore}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#22C55E] text-xs font-medium">
          Great
        </span>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1 mb-6">
        <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />
        <span className="text-xs text-[#22C55E] font-medium">+{moodOverview.trend}%</span>
        <span className="text-xs text-muted-foreground">from last week</span>
      </div>

      {/* Chart */}
      <div className="h-24 min-h-[96px] -mx-2 relative">
        <ResponsiveContainer width="100%" height={96}>
          <LineChart data={moodOverview.weeklyData}>
            <YAxis domain={[5, 9]} hide />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#22C55E"
              strokeWidth={2.5}
              dot={{ fill: '#22C55E', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Days Labels */}
      <div className="flex justify-between mt-2 px-1">
        {moodOverview.weeklyData.map((day, i) => (
          <span 
            key={i} 
            className={`text-xs ${i === 6 ? 'text-[#22C55E] font-medium' : 'text-muted-foreground'}`}
          >
            {day.day}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

