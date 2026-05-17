'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { useDashboardStore } from '@/lib/store';
import { Moon, ChevronDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function SleepTracking() {
  const { sleepData } = useDashboardStore();
  const router = useRouter();

  // Calculate stroke dasharray for circular progress
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = (sleepData.hours + sleepData.minutes / 60) / 10; // Assuming 10 hours is max
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <GlassCard className="h-full" delay={0.15}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-[#22C55E]" />
          <span className="text-sm font-medium text-muted-foreground">Sleep</span>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => alert('Period selection coming soon!')}
        >
          Tonight
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        {/* Circular Progress */}
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background Circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#EEF7EF"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#22C55E"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{sleepData.duration}</span>
            <span className="text-xs text-[#22C55E] font-medium">{sleepData.qualityLabel}</span>
          </div>
        </div>

        {/* Right Info */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Sleep quality</p>
          <p className="text-2xl font-bold text-foreground">{sleepData.quality}%</p>
          
          {/* Quality Bars */}
          <div className="flex gap-0.5 mt-2 justify-end">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-4 rounded-full ${
                  i < sleepData.quality / 10 
                    ? 'bg-[#22C55E]' 
                    : 'bg-[#EEF7EF]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-[#22C55E] transition-colors"
        onClick={() => router.push('/sleep')}
      >
        View details
        <ArrowRight className="w-3 h-3" />
      </button>
    </GlassCard>
  );
}

