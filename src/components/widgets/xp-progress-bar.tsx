'use client';

import { useEffect, useState } from 'react';
import { Flame, Star } from 'lucide-react';
import { getGamificationSummary, type GamificationSummary } from '@/lib/api/gamification';

const LEVEL_EMOJIS: Record<string, string> = {
  Seedling: '🌱',
  Sprout: '🌿',
  Bloom: '🌸',
  Flourish: '🌺',
  Radiant: '✨',
};

export function XpProgressBar() {
  const [data, setData] = useState<GamificationSummary | null>(null);

  useEffect(() => {
    getGamificationSummary()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const { total_xp, level_name, xp_to_next, streak } = data;

  // Compute fill %
  const LEVELS = [0, 100, 300, 700, 1500];
  const currentThreshold = LEVELS[data.level - 1] ?? 0;
  const nextThreshold = xp_to_next != null ? total_xp + xp_to_next : total_xp;
  const range = nextThreshold - currentThreshold;
  const filled = range > 0 ? Math.min(100, Math.round(((total_xp - currentThreshold) / range) * 100)) : 100;

  const emoji = LEVEL_EMOJIS[level_name] ?? '🌱';

  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] border border-white/20 p-5 shadow-[0_8px_32px_rgba(41,63,48,.12)] lg:p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(238,246,240,0.50) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#75917A]/10 blur-2xl" aria-hidden />
      <div className="flex flex-wrap items-center gap-4">
        {/* Level pill */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #56715C, #75917A)' }}
        >
          {emoji} {level_name}
        </span>

        {/* XP bar */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">
              {total_xp} XP
            </span>
            <span className="text-xs text-text-secondary">
              {xp_to_next != null ? `${xp_to_next} to next level` : 'Max Level'}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(86,113,92,.15)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${filled}%`,
                background: 'linear-gradient(90deg, #56715C, #75917A)',
              }}
            />
          </div>
        </div>

        {/* Streak pill */}
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(86,113,92,.20)] bg-[rgba(86,113,92,.08)] px-3 py-1.5 text-sm font-semibold text-[#56715C]">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            {streak}d streak
          </span>
        )}

        {/* XP star */}
        <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(86,113,92,.20)] bg-[rgba(86,113,92,.08)] px-3 py-1.5 text-sm font-semibold text-[#56715C]">
          <Star className="h-3.5 w-3.5" aria-hidden />
          Lv {data.level}
        </span>
      </div>
    </div>
  );
}
