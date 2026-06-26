'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  BookHeart,
  BarChart3,
  User,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { key: 'home', href: '/dashboard', icon: LayoutDashboard },
  { key: 'companion', href: '/ai-companion', icon: Sparkles },
  { key: 'journal', href: '/journal', icon: BookHeart },
  { key: 'insights', href: '/insights', icon: BarChart3 },
  { key: 'profile', href: '/profile', icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <>
      {/* Crisis pill — persistent above tab bar */}
      <div className="lg:hidden fixed bottom-[calc(4rem+0.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40">
        <Link
          href="/resources"
          className="btn-haptic touch-target flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-red-500/20 motion-safe:animate-pulse"
          aria-label={t('mobile.crisisHelp', 'Reach out now for crisis support')}
        >
          <span
            className="h-2 w-2 rounded-full bg-white motion-safe:animate-ping"
            aria-hidden="true"
          />
          <span>SOS / জরুরি সাহায্য</span>
        </Link>
      </div>

      {/* 64pt tab bar + center FAB */}
      <nav
        aria-label={t('mobile.mainNavigation', 'Main navigation')}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-end justify-between border-t border-black/5 bg-white/95 px-2 pb-safe backdrop-blur-md dark:border-white/10 dark:bg-[#1A202C]/95"
      >
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavTab key={item.key} item={item} pathname={pathname} />
        ))}

        <div className="w-14 shrink-0" aria-hidden="true" />

        {NAV_ITEMS.slice(2).map((item) => (
          <NavTab key={item.key} item={item} pathname={pathname} />
        ))}

        <div className="absolute left-1/2 top-0 z-50 -translate-x-1/2 -translate-y-3">
          <Link
            href="/mood"
            className="btn-haptic touch-target flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] text-white shadow-lg shadow-[#4A90A4]/30"
            aria-label={t('mobile.dailyCheckIn', 'Daily mood check-in')}
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </>
  );
}

function NavTab({
  item,
  pathname,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
}) {
  const { t } = useTranslation();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'btn-haptic touch-target flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
        isActive ? 'text-[#4A90A4]' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="max-w-[4.5rem] truncate">
        {t(`navigation.${item.key}`, item.key.charAt(0).toUpperCase() + item.key.slice(1))}
      </span>
    </Link>
  );
}
