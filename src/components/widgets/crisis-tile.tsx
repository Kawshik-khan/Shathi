'use client';

import { LifeBuoy, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';

export interface CrisisTileProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * CrisisTile — ReminderCard per UI plan §6.12.
 *
 * Static safety tile. Always visible (not gated by a feature flag or
 * empty state) per the Sathi product policy. Links to /resources/crisis.
 */
export function CrisisTile({ className, style }: CrisisTileProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn('group/card flex flex-col gap-8 overflow-hidden rounded-card border py-8 text-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lift', className)}
      style={style}
      onClick={() => router.push('/resources/crisis')}
      onKeyDown={(e) => e.key === 'Enter' && router.push('/resources/crisis')}
    >
      <div className="flex items-start gap-4 px-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent-crisis">
          <Icon
            icon={LifeBuoy}
            size={20}
            aria-hidden
            className="text-accent-crisis"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-heading text-sm font-semibold text-text-primary">
            {t('dashboard.tile.crisis.title')}
          </span>
          <span className="text-xs text-text-secondary">
            {t('dashboard.tile.crisis.subtitle')}
          </span>
          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-sm text-xs font-semibold text-accent-crisis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-crisis">
            {t('dashboard.tile.crisis.open')}
            <Icon icon={ArrowUpRight} size={12} aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}
