'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { useDashboardStore } from '@/lib/store';
import { Sparkles, ArrowRight, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function AIInsight() {
  const { aiInsight } = useDashboardStore();
  const router = useRouter();

  return (
    <GlassCard className="h-full" delay={0.4}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4A90A4]" />
          <span className="text-sm font-medium text-foreground">AI Insight</span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Left Content */}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground mb-2">
            {aiInsight.title}
            <span className="inline-block ml-1">
              <Trophy className="w-4 h-4 text-amber-500 inline" />
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {aiInsight.message}
          </p>
        </div>

        {/* Right Decorative Blob */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#A8D0D9] to-[#6FA8C7] opacity-80 flex-shrink-0 blur-sm"
        />
      </div>

      <button
        className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-[#4A90A4] transition-colors"
        onClick={() => router.push('/insights')}
      >
        View insights
        <ArrowRight className="w-3 h-3" />
      </button>
    </GlassCard>
  );
}

