'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { useDashboardStore } from '@/lib/store';
import { BookHeart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function JournalPreview() {
  const { latestEntry } = useDashboardStore();
  const router = useRouter();

  return (
    <GlassCard className="h-full" delay={0.35}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookHeart className="w-4 h-4 text-[#22C55E]" />
          <span className="text-sm font-medium text-foreground">Journal</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#22C55E] text-[10px] font-medium">
          Latest Entry
        </span>
      </div>

      <div className="flex gap-4">
        {/* Left Content */}
        <div className="flex-1">
          <h4 className="text-base font-semibold text-foreground mb-2 flex items-center gap-1">
            {latestEntry.title}
            <span className="text-green-500">💚</span>
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {latestEntry.content}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {latestEntry.date}
          </p>
        </div>

        {/* Right Decorative */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DCFCE7] to-[#A7F3A0] flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/10"
        >
          <BookHeart className="w-7 h-7 text-[#22C55E]" />
        </motion.div>
      </div>

      <button
        className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-[#22C55E] transition-colors"
        onClick={() => router.push('/journal')}
      >
        View all entries
        <ArrowRight className="w-3 h-3" />
      </button>
    </GlassCard>
  );
}

