'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/mobile/bottom-sheet';
import { StickyActionBar } from '@/components/mobile/sticky-action-bar';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { createActivityEvent } from '@/lib/api';
import { useTranslation } from 'react-i18next';

const MOOD_EMOJIS = [
  { id: 'great', emoji: '😊', label: 'Great', labelBn: 'দারুণ' },
  { id: 'good', emoji: '🙂', label: 'Good', labelBn: 'ভালো' },
  { id: 'okay', emoji: '😐', label: 'Okay', labelBn: 'ঠিকঠাক' },
  { id: 'low', emoji: '😔', label: 'Low', labelBn: 'কম' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', labelBn: 'উদ্বিগ্ন' },
  { id: 'tired', emoji: '😴', label: 'Tired', labelBn: 'ক্লান্ত' },
] as const;

const STORAGE_KEY = 'sathi_mood_today';

type StoredMood = {
  id: string;
  emoji: string;
  label: string;
  loggedAt: string;
};

function readTodayMood(): StoredMood | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMood;
    const logged = new Date(parsed.loggedAt);
    const now = new Date();
    if (
      logged.getFullYear() === now.getFullYear() &&
      logged.getMonth() === now.getMonth() &&
      logged.getDate() === now.getDate()
    ) {
      return parsed;
    }
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

interface MoodCheckInProps {
  className?: string;
  compact?: boolean;
}

export function MoodCheckIn({ className, compact = false }: MoodCheckInProps) {
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState<StoredMood | null>(null);
  const [pending, setPending] = useState<(typeof MOOD_EMOJIS)[number] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLogged(readTodayMood());
    setLoading(false);
  }, []);

  function pickMood(mood: (typeof MOOD_EMOJIS)[number]) {
    setPending(mood);
    setConfirmOpen(true);
    setError('');
  }

  async function confirmMood() {
    if (!pending) return;
    setSaving(true);
    setError('');

    const entry: StoredMood = {
      id: pending.id,
      emoji: pending.emoji,
      label: isBn ? pending.labelBn : pending.label,
      loggedAt: new Date().toISOString(),
    };

    try {
      await createActivityEvent({
        event_type: 'mood_logged',
        event_metadata: { mood: pending.id, source: 'mood_check_in' },
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
      setLogged(entry);
      setConfirmOpen(false);
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mobile.saveFailed', 'Unable to save'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <SkeletonCard rows={2} hasHeader className={className} />;
  }

  if (logged && !confirmOpen) {
    return (
      <div className={cn('glass-card p-4 sm:p-5', className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">
              {logged.emoji}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">
                {t('mobile.moodLoggedToday', 'Logged for today')}
              </p>
              <p className="text-sm text-muted-foreground">{logged.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setLogged(null);
              window.localStorage.removeItem(STORAGE_KEY);
            }}
            className="focus-ring btn-haptic touch-target rounded-full px-4 py-2 text-sm font-medium text-[#4A90A4]"
          >
            {t('mobile.edit', 'Edit')}
          </button>
        </div>
        {!compact && <WeekStrip />}
      </div>
    );
  }

  return (
    <>
      <div className={cn('glass-card p-4 sm:p-5', className)}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t('mobile.howFeeling', 'How are you feeling?')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('mobile.moodTwoTap', 'Pick an emoji — just 2 taps to log.')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {MOOD_EMOJIS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => pickMood(mood)}
              className="focus-ring btn-haptic touch-target flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-white/70 p-3 transition-colors hover:border-[#4A90A4]/40 hover:bg-[#F1F5F7] dark:bg-secondary"
              aria-label={isBn ? mood.labelBn : mood.label}
            >
              <span className="text-[2rem] leading-none" aria-hidden="true">
                {mood.emoji}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {isBn ? mood.labelBn : mood.label}
              </span>
            </button>
          ))}
        </div>

        {!compact && <WeekStrip />}
      </div>

      <BottomSheet
        open={confirmOpen}
        onClose={() => {
          if (!saving) {
            setConfirmOpen(false);
            setPending(null);
          }
        }}
        title={t('mobile.confirmMood', 'Confirm your mood')}
      >
        {pending && (
          <div className="flex flex-col items-center py-4">
            <span className="text-5xl" aria-hidden="true">
              {pending.emoji}
            </span>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {isBn ? pending.labelBn : pending.label}
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => void confirmMood()}
              className="btn-haptic touch-target mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full btn-primary-gradient text-base font-semibold text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-5 w-5" aria-hidden="true" />
              )}
              {t('mobile.saveMood', 'Save mood')}
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

function WeekStrip() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <div className="mt-5 flex justify-between gap-1 border-t border-border pt-4">
      {days.map((label, index) => (
        <div
          key={`${label}-${index}`}
          className={cn(
            'flex h-10 w-10 flex-col items-center justify-center rounded-full text-xs font-medium',
            index === today
              ? 'bg-[#E3F0F3] text-[#4A90A4]'
              : 'text-muted-foreground',
          )}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

/** Sticky daily check-in CTA for dashboard scroll */
export function DailyCheckInStickyCTA() {
  const { t } = useTranslation();

  return (
    <StickyActionBar>
      <a
        href="/mood"
        className="btn-haptic touch-target flex min-h-13 w-full items-center justify-center rounded-full btn-primary-gradient text-base font-semibold text-white"
      >
        {t('mobile.dailyCheckIn', 'Daily check-in')}
      </a>
    </StickyActionBar>
  );
}
