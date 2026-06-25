'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { getAuthToken, getJournalEntries, type JournalEntry } from '@/lib/api';
import { BookHeart, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function JournalPreview() {
  const router = useRouter();
  const [latestEntry, setLatestEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const token = getAuthToken();

    if (!token) {
      Promise.resolve().then(() => {
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }

    getJournalEntries(1)
      .then((entries) => {
        if (mounted) setLatestEntry(entries[0] ?? null);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load journal.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GlassCard className="h-full" delay={0.35}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookHeart className="w-4 h-4 text-[#4A90A4]" />
          <span className="text-sm font-medium text-foreground">Journal</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-[#E3F0F3] text-[#4A90A4] text-[10px] font-medium">
          Latest Entry
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          {loading ? (
            <div className="flex h-24 items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading latest entry
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : latestEntry ? (
            <>
              <h4 className="text-base font-semibold text-foreground mb-2 flex items-center gap-1">
                {latestEntry.title || 'Untitled entry'}
                <BookHeart className="h-4 w-4 text-[#4A90A4]" />
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {latestEntry.content}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(latestEntry.written_at))}
              </p>
            </>
          ) : (
            <>
              <h4 className="text-base font-semibold text-foreground mb-2">No entries yet</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                Start documenting your wellness journey. Your latest entry will appear here.
              </p>
            </>
          )}
        </div>

        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E3F0F3] to-[#A8D0D9] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#4A90A4]/10"
        >
          <BookHeart className="w-7 h-7 text-[#4A90A4]" />
        </motion.div>
      </div>

      <button
        className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-[#4A90A4] transition-colors"
        onClick={() => router.push('/journal')}
      >
        View all entries
        <ArrowRight className="w-3 h-3" />
      </button>
    </GlassCard>
  );
}
