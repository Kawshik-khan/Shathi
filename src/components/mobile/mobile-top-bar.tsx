'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Library,
  Moon,
  MoreVertical,
  Settings,
  Smile,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/mobile/bottom-sheet';

const TAB_ROOTS = new Set([
  '/dashboard',
  '/ai-companion',
  '/journal',
  '/insights',
  '/profile',
  '/mood',
]);

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'navigation.home',
  '/ai-companion': 'navigation.companion',
  '/journal': 'navigation.journal',
  '/insights': 'navigation.insights',
  '/profile': 'navigation.profile',
  '/mood': 'navigation.mood',
  '/habits': 'navigation.habits',
  '/sleep': 'navigation.sleep',
  '/settings': 'navigation.settings',
  '/resources': 'navigation.resources',
  '/subscription': 'navigation.subscription',
  '/admin': 'navigation.admin',
};

const OVERFLOW_LINKS = [
  { key: 'mood', href: '/mood', icon: Smile },
  { key: 'habits', href: '/habits', icon: CheckCircle2 },
  { key: 'sleep', href: '/sleep', icon: Moon },
  { key: 'resources', href: '/resources', icon: Library },
  { key: 'settings', href: '/settings', icon: Settings },
] as const;

export function MobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const titleKey = PAGE_TITLES[pathname] ?? 'navigation.dashboard';
  const title = t(titleKey, pathname.replace('/', '') || 'Home');
  const showBack = !TAB_ROOTS.has(pathname);

  const overflowLinks = useMemo(
    () => OVERFLOW_LINKS.filter((item) => item.href !== pathname),
    [pathname],
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card-strong pt-safe">
        <div className="flex h-11 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {showBack ? (
              <button
                type="button"
                onClick={() => router.back()}
                className="focus-ring btn-haptic touch-target inline-flex shrink-0 items-center justify-center rounded-xl text-foreground"
                aria-label={t('mobile.goBack', 'Go back')}
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="flex shrink-0 items-center gap-2"
                aria-label="Sereni home"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] shadow-md shadow-[#4A90A4]/20">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
              </Link>
            )}
            <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="focus-ring btn-haptic touch-target inline-flex shrink-0 items-center justify-center rounded-xl text-foreground"
            aria-label={t('mobile.moreOptions', 'More options')}
            aria-haspopup="dialog"
          >
            <MoreVertical className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('mobile.moreOptions', 'More options')}
      >
        <nav className="space-y-1">
          {overflowLinks.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'density-list-row focus-ring btn-haptic flex min-h-14 items-center gap-3 rounded-2xl px-4 text-base font-medium transition-colors',
                  active
                    ? 'bg-[#E3F0F3] text-[#4A90A4]'
                    : 'text-foreground hover:bg-[#F1F5F7] dark:hover:bg-white/5',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {t(`navigation.${item.key}`)}
              </Link>
            );
          })}
        </nav>
      </BottomSheet>

      {/* Spacer: status bar + compact title bar */}
      <div className="lg:hidden h-14 pt-safe" aria-hidden="true" />
    </>
  );
}
