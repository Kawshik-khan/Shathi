'use client';

import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Search, Bell, LogOut, Settings, UserCircle } from 'lucide-react';
import { ThemeToggleSimple } from '@/components/theme-toggle';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/language-toggle';
import { formatBangladeshDateTime, toBengaliCalendarDate } from '@/lib/dateLocale';
import { useMemo, useState } from 'react';
import { WellnessScoreHero } from '@/components/widgets/wellness-score-hero';
import { cn } from '@/lib/utils';

/**
 * Compact dashboard header (~40% shorter than the previous design).
 *
 * Left: greeting + date.
 * Center-right: Wellness Score KPI (the primary hero KPI).
 * Right: search, notifications, theme, profile (language lives inside profile menu).
 */
export function Header() {
  const { user } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const { i18n, t } = useTranslation();
  const language = i18n.language === 'bn' ? 'bn' : 'en';
  const today = useMemo(() => new Date(), []);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const isDashboardPage = pathname === '/dashboard';

  // Greeting varies by time-of-day for a warmer touch.
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 5) return t('header.goodNight');
    if (hour < 12) return t('header.goodMorning');
    if (hour < 17) return t('header.goodAfternoon');
    if (hour < 21) return t('header.goodEvening');
    return t('header.goodNight');
  }, [t, today]);

  const dateLabel = useMemo(
    () =>
      language === 'bn'
        ? toBengaliCalendarDate(today)
        : formatBangladeshDateTime(today, language),
    [language, today],
  );

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    router.push('/landing');
  };

  const openProfile = () => {
    setIsProfileMenuOpen(false);
    router.push('/profile');
  };

  const openSettings = () => {
    setIsProfileMenuOpen(false);
    router.push('/settings');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      {/* Left: greeting + date */}
      <div className="min-w-0">
        <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight text-foreground lg:text-[26px]">
          {greeting}
          {user?.name ? `, ${user.name}` : ''}
          <span aria-hidden="true" className="ml-1">
            👋
          </span>
        </h1>
        <p className="card-caption mt-0.5 truncate">{dateLabel}</p>
      </div>

      {/* Center: Wellness Score (only on dashboard for relevance) */}
      {isDashboardPage && (
        <div className="order-3 lg:order-2">
          <WellnessScoreHero
            score={84}
            delta={3}
            status="Good"
            context="Based on sleep, mood & activity"
          />
        </div>
      )}

      {/* Right: actions */}
      <div
        className={cn(
          'flex items-center gap-2',
          isDashboardPage ? 'order-2 lg:order-3' : '',
        )}
      >
        {/* Search */}
        <label className="relative hidden sm:block">
          <span className="sr-only">{t('header.search')}</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder={t('header.search')}
            className="focus-ring h-10 w-48 rounded-full border border-black/5 bg-white/80 pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 transition focus:w-64 focus:border-[#4A90A4]/30 focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/20 lg:w-56 dark:bg-white/10 dark:border-white/10"
          />
        </label>

        {/* Notifications */}
        <button
          type="button"
          className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/80 transition hover:bg-white dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20"
          aria-label={t('header.notifications')}
        >
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#4A90A4] ring-2 ring-white dark:ring-[#0F1419]"
          />
        </button>

        {/* Theme */}
        <ThemeToggleSimple />

        {/* Profile + (language inside menu) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#A8D0D9] to-[#6FA8C7] font-medium text-white shadow-lg shadow-[#4A90A4]/20 ring-2 ring-white transition dark:ring-[#0F1419]"
            aria-label="Open profile menu"
            aria-haspopup="menu"
          >
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user?.name?.charAt(0) ?? 'U'
            )}
          </button>
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#4A90A4] ring-2 ring-white dark:ring-[#0F1419]"
          />

          {isProfileMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-70 mt-2 w-56 overflow-hidden rounded-xl border border-black/5 bg-white py-2 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-[#0F1419]"
            >
              <div className="px-3 pb-2 pt-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user?.name ?? 'Guest'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email ?? ''}
                </p>
              </div>
              <div className="my-1 h-px bg-black/5 dark:bg-white/10" />

              {/* Language switcher (moved here per spec) */}
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Language
                </span>
                <LanguageToggle />
              </div>

              <div className="my-1 h-px bg-black/5 dark:bg-white/10" />

              <button
                type="button"
                role="menuitem"
                onClick={openProfile}
                className="focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[#F1F5F7] dark:hover:bg-white/10"
              >
                <UserCircle className="h-4 w-4" aria-hidden="true" />
                Profile
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={openSettings}
                className="focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[#F1F5F7] dark:hover:bg-white/10"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Settings
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t('header.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
