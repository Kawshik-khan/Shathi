'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BookHeart, ArrowRight, Loader2, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthToken, getJournalEntries, type JournalEntry } from '@/lib/api';
import { cn } from '@/lib/utils';

export function JournalPreview() {
  const reducedMotion = useReducedMotion();
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
    <div className="card card-interactive h-full">
      <header className="mb-3 flex items-center justify-between">
        <span className="card-eyebrow flex items-center gap-1.5">
          <BookHeart className="h-3.5 w-3.5 text-goals-purple" aria-hidden="true" />
          Journal
        </span>
        <span className="status-pill status-pill--info">Latest</span>
      </header>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex h-24 items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Loading latest entry
            </div>
          ) : error ? (
            <p className="text-sm text-error">{error}</p>
          ) : latestEntry ? (
            <>
              <h4 className="card-title truncate">
                {latestEntry.title || 'Untitled entry'}
              </h4>
              <p className="card-body mt-1 line-clamp-2">{latestEntry.content}</p>
              <p className="card-caption mt-2">
                {new Intl.DateTimeFormat('en', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).format(new Date(latestEntry.written_at))}
              </p>
            </>
          ) : (
            <>
              <h4 className="card-title">No entries yet</h4>
              <p className="card-body mt-1 line-clamp-2">
                Start documenting your wellness journey. Your latest entry will appear here.
              </p>
              <button
                type="button"
                onClick={() => router.push('/journal/new')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-goals-purple hover:text-goals-purple/80 focus-ring rounded-md px-2 py-1 transition-colors"
              >
                <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
                Write your first entry
              </button>
            </>
          )}
        </div>

        <motion.div
          animate={reducedMotion ? undefined : { rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-goals-purple/10',
            'bg-linear-to-br from-goals-purple-soft to-goals-purple/40',
          )}
        >
          <BookHeart className="h-6 w-6 text-goals-purple" aria-hidden="true" />
        </motion.div>
      </div>

      <button
        type="button"
        onClick={() => router.push('/journal')}
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-goals-purple focus-ring rounded-md px-2 py-1 transition-colors"
      >
        View all entries
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}