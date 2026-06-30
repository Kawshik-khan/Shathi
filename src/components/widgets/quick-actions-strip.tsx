'use client';

import {
  Heart,
  BookOpen,
  ListChecks,
  Moon,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface QuickAction {
  href: string;
  i18nKey: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { href: '/mood', i18nKey: 'mood', icon: Heart },
  { href: '/journal', i18nKey: 'journal', icon: BookOpen },
  { href: '/habits', i18nKey: 'habits', icon: ListChecks },
  { href: '/sleep', i18nKey: 'sleep', icon: Moon },
  { href: '/insights', i18nKey: 'insight', icon: Sparkles },
];

export interface QuickActionsStripProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * QuickActionsStrip — Pattern 5 (HeroQuickAction) per UI plan §6.12.
 *
 * Horizontal pill strip pinned directly under the greeting. Pure
 * navigation — no data loading, no fake content.
 */
export function QuickActionsStrip({ className, style }: QuickActionsStripProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('dashboard.quickActions.sectionLabel')}
      className={cn(
        'flex h-16 items-center gap-2 overflow-x-auto rounded-card bg-bg-card/60 px-3 py-2',
        className,
      )}
      style={style}
    >
      {QUICK_ACTIONS.map((action) => {
        const label = t(`dashboard.quickActions.${action.i18nKey}`);
        return (
          <button
            key={action.href}
            type="button"
            onClick={() => router.push(action.href)}
            aria-label={label}
            className={cn(
              'inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated px-4 text-sm font-medium text-text-primary',
              'cursor-pointer transition-colors duration-150',
              'hover:bg-accent-energy hover:text-text-inverse hover:border-transparent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            )}
          >
            <Icon icon={action.icon} size={16} aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
