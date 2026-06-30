'use client';

import { type BadgeOut } from '@/lib/api/gamification';

const BADGE_META: Record<string, { label: string; emoji: string; hint: string }> = {
  first_mood:    { label: 'First Mood Log',     emoji: '😊', hint: 'Log your first mood' },
  first_journal: { label: 'First Journal',      emoji: '📝', hint: 'Write your first journal entry' },
  first_sleep:   { label: 'First Sleep Log',    emoji: '🌙', hint: 'Log your first sleep' },
  first_habit:   { label: 'First Habit Done',   emoji: '✅', hint: 'Complete your first habit' },
  streak_3:      { label: '3-Day Streak',        emoji: '🔥', hint: 'Maintain a 3-day streak' },
  streak_7:      { label: '7-Day Streak',        emoji: '⚡', hint: 'Maintain a 7-day streak' },
  streak_30:     { label: '30-Day Streak',       emoji: '🏆', hint: 'Maintain a 30-day streak' },
  journal_10:    { label: '10 Journal Entries',  emoji: '📖', hint: 'Write 10 journal entries' },
  habit_50:      { label: '50 Habits Done',      emoji: '💪', hint: 'Complete 50 habits' },
  level_bloom:   { label: 'Bloom Level',         emoji: '🌸', hint: 'Reach the Bloom level' },
  level_radiant: { label: 'Radiant Level',       emoji: '✨', hint: 'Reach the Radiant level' },
};

const ALL_BADGE_KEYS = Object.keys(BADGE_META);

interface AchievementsGalleryProps {
  badges: BadgeOut[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AchievementsGallery({ badges }: AchievementsGalleryProps) {
  const earnedKeys = new Set(badges.map((b) => b.badge_key));
  const earnedMap = new Map(badges.map((b) => [b.badge_key, b.earned_at]));

  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] border border-white/20 p-6 shadow-[0_8px_32px_rgba(41,63,48,.12)] lg:p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(238,246,240,0.50) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-[#75917A]/10 blur-3xl" aria-hidden />

      <div className="relative mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-secondary">Achievements</p>
        <h2 className="mt-1 text-xl font-semibold text-text-primary">Your Badges</h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          {earnedKeys.size} of {ALL_BADGE_KEYS.length} unlocked
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {ALL_BADGE_KEYS.map((key) => {
          const meta = BADGE_META[key]!;
          const earned = earnedKeys.has(key);
          const earnedAt = earnedMap.get(key);

          return (
            <div
              key={key}
              className="flex flex-col items-center gap-2 rounded-[20px] border p-4 text-center transition-all duration-200"
              style={
                earned
                  ? {
                      background: 'linear-gradient(145deg, rgba(86,113,92,0.12) 0%, rgba(117,145,122,0.08) 100%)',
                      borderColor: 'rgba(86,113,92,0.25)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.30)',
                      borderColor: 'rgba(86,113,92,0.10)',
                      opacity: 0.45,
                    }
              }
            >
              {/* Icon circle */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                style={
                  earned
                    ? { background: 'linear-gradient(145deg, #56715C, #75917A)' }
                    : { background: 'rgba(86,113,92,0.12)' }
                }
              >
                {meta.emoji}
              </div>

              <span className="text-xs font-semibold leading-tight text-text-primary">{meta.label}</span>

              {earned && earnedAt ? (
                <span className="text-[10px] text-text-secondary">{formatDate(earnedAt)}</span>
              ) : (
                <span className="text-[10px] text-text-secondary">{meta.hint}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
