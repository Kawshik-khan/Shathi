'use client';

import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useDaytime } from '@/components/daytime-provider';

export interface GreetingStripProps {
  /** User's display name; `null` while loading. */
  displayName: string | null;
  /** Active habit streak in days; `null` if no streak data. */
  streakDays: number | null;
}

function daytimeToGreetingKey(
  daytime: 'morning' | 'noon' | 'afternoon' | 'night',
) {
  if (daytime === 'morning') return 'morning' as const;
  if (daytime === 'noon' || daytime === 'afternoon') return 'afternoon' as const;
  return 'evening' as const;
}

/**
 * GreetingStrip — header strip shown at the top of /dashboard.
 *
 * Pulls greeting text from the i18n `dashboard.greeting.*` namespace and
 * localizes the date via `Intl`. The streak chip is hidden when
 * `streakDays` is null or zero (no completed habits today).
 */
export function GreetingStrip({ displayName, streakDays }: GreetingStripProps) {
  const { t, i18n } = useTranslation();
  const { daytime } = useDaytime();
  const locale = i18n.language?.startsWith('bn') ? 'bn-BD' : 'en-US';

  const greetingKey = daytimeToGreetingKey(daytime);
  const greetingText = displayName
    ? t('dashboard.greeting.withName', {
        greeting: t(`dashboard.greeting.${greetingKey}`),
        name: displayName,
      })
    : t(`dashboard.greeting.${greetingKey}`);

  const today = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card variant="sunken" className="border-white/10 bg-gradient-to-br from-[#55715B] to-[#6E8E73] text-white shadow-lift">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/75">
            {today}
          </span>
          <h1 className="font-display truncate text-2xl font-medium leading-tight text-white">
            {greetingText}
          </h1>
        </div>

        {streakDays !== null && streakDays > 0 ? (
          <div
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white"
            role="status"
            aria-label={t('dashboard.greeting.streak', { count: streakDays })}
          >
            <Icon icon={Flame} size={12} aria-hidden />
            <span className="font-mono tabular-nums">{streakDays}</span>
            <span className="text-white/75">
              {t('dashboard.greeting.streakLabel')}
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}