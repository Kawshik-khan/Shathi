'use client';

/**
 * Compact dashboard header (PR3 redesign).
 *
 * Layout:
 *   - Left: greeting + date (font-display, scale 22-26px).
 *   - Center: WellnessScoreHero KPI (dashboard only).
 *   - Right: search, notifications, theme toggle, profile menu.
 *
 * - Uses the redesigned `Icon` facade, `Button` variants, and the
 *   `surface-card-elevated` shell for the profile menu.
 * - Theme toggle now uses the Radix `Toggle` primitive as the
 *   outer pill (sunken track + thumb), and a small dropdown for
 *   Light/Dark/System is rendered via the `surface-card-elevated`
 *   shell token.
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bell, LogOut, Search, Settings, UserCircle } from 'lucide-react';

import { useAuthStore } from '@/lib/store';
import { useDaytime } from '@/components/daytime-provider';
import { useTheme } from '@/components/theme-provider';

type ThemeApi = ReturnType<typeof useTheme>;
function useThemeSafe(): ThemeApi | null {
  try {
    return useTheme();
  } catch {
    return null;
  }
}
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { formatBangladeshDateTime, toBengaliCalendarDate } from '@/lib/dateLocale';

function greetingKey(hour: number, t: (k: string) => string): string {
  if (hour < 5) return t('header.goodNight');
  if (hour < 12) return t('header.goodMorning');
  if (hour < 17) return t('header.goodAfternoon');
  if (hour < 21) return t('header.goodEvening');
  return t('header.goodNight');
}

/**
 * The greeting string is time-of-day aware. With `data-daytime` on
 * `<body>` (wired in layout.tsx in PR3), the surface hue shifts
 * automatically; we expose the resolved `daytime` so the greeting can
 * also follow the same cycle (e.g. "Good afternoon" maps to
 * daytime="afternoon").
 */
function useTimeAwareGreeting(): { greeting: string; daytime: string } {
  const { t } = useTranslation();
  const { daytime } = useDaytime();
  const today = React.useMemo(() => new Date(), []);
  const hour = today.getHours();
  const greeting = React.useMemo(() => greetingKey(hour, t), [hour, t]);
  return { greeting, daytime };
}

export function Header() {
  const { user } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const { greeting } = useTimeAwareGreeting();
  const language = i18n.language === 'bn' ? 'bn' : 'en';
  const today = React.useMemo(() => new Date(), []);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);

  const dateLabel = React.useMemo(
    () =>
      language === 'bn'
        ? toBengaliCalendarDate(today)
        : formatBangladeshDateTime(today, language),
    [language, today],
  );

  // Close profile menu on outside click.
  const profileRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    router.push('/landing');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      data-slot="header"
      data-daytime={greeting ? undefined : undefined}
      className="header-shell mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="min-w-0">
        <h1 className="font-display truncate text-[22px] font-semibold leading-tight tracking-tight text-text-primary lg:text-[26px]">
          {greeting}
          {user?.name ? `, ${user.name}` : ''}
          <span aria-hidden="true" className="ml-1">
            👋
          </span>
        </h1>
        <p className="mt-0.5 truncate text-small text-text-secondary">{dateLabel}</p>
      </div>

      <div className="flex items-center gap-2">
        <label className="relative hidden sm:block">
          <span className="sr-only">{t('header.search')}</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <Icon icon={Search} size={16} aria-hidden />
          </span>
          <input
            type="text"
            placeholder={t('header.search')}
            className="input-sunken h-10 w-48 rounded-pill pl-10 pr-4 text-small transition-[width,box-shadow] duration-200 focus:w-64 focus:outline-none lg:w-56"
          />
        </label>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('header.notifications')}
          className="relative h-10 w-10 rounded-pill"
        >
          <Icon icon={Bell} size={20} aria-hidden />
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-energy ring-2 ring-bg-card"
          />
        </Button>

        <ThemeControl />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-sand-100 to-sage-300 font-semibold text-white shadow-card ring-2 ring-bg-card transition"
            aria-label="Open profile menu"
            aria-haspopup="menu"
            {...(isProfileMenuOpen ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
          >
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() ?? 'U'
            )}
          </button>
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent-energy ring-2 ring-bg-card"
          />

          <AnimatePresence>
            {isProfileMenuOpen ? (
              <div
                key="menu"
                role="menu"
                aria-label="Profile menu"
                className="shell-rail absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-card border border-border-subtle bg-bg-card/95 p-2 shadow-overlay backdrop-blur-xl"
              >
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col"
                >
                <div className="px-3 pb-2 pt-1">
                  <p className="truncate text-small font-semibold text-text-primary">
                    {user?.name ?? 'Guest'}
                  </p>
                  <p className="truncate text-micro text-text-secondary">
                    {user?.email ?? ''}
                  </p>
                </div>
                <div className="my-1 h-px bg-border-subtle" />

                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs font-medium text-text-secondary">
                    Language
                  </span>
                  <LanguageToggle />
                </div>

                <div className="my-1 h-px bg-border-subtle" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    router.push('/profile');
                  }}
                  className="focus-ring flex w-full items-center gap-2 rounded-pill px-3 py-2 text-left text-small transition-colors hover:bg-bg-hover"
                >
                  <Icon icon={UserCircle} size={16} aria-hidden />
                  Profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="focus-ring flex w-full items-center gap-2 rounded-pill px-3 py-2 text-left text-small transition-colors hover:bg-bg-hover"
                >
                  <Icon icon={Settings} size={16} aria-hidden />
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="focus-ring flex w-full items-center gap-2 rounded-pill px-3 py-2 text-left text-small text-accent-crisis transition-colors hover:bg-feedback-danger/10"
                >
                  <Icon icon={LogOut} size={16} aria-hidden />
                  {t('header.logout')}
                </button>
                </motion.div>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

/**
 * Theme control — compact icon-only toggle for the header.
 *
 * Uses the redesigned `Toggle` primitive as the outer pill and swaps
 * the inner icon between sun/moon based on resolved theme.
 *
 * (Kept as a self-contained subcomponent so the header file stays
 * readable; the full dropdown lives in `ThemeToggle` for the
 * settings page where more space is available.)
 */
function ThemeControl() {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  // useTheme may throw during the SSR pass because the ThemeProvider
  // defers its context until the client has mounted. Guard the call so
  // prerendering doesn't crash.
  const theme = mounted ? useThemeSafe() : null;
  if (!theme) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 items-center justify-center rounded-pill"
      />
    );
  }
  const { resolvedTheme, setTheme } = theme;
  const isDark = resolvedTheme === 'dark';
  return (
    <Toggle
      pressed={isDark}
      onPressedChange={(pressed) => setTheme(pressed ? 'dark' : 'light')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-10 w-10 rounded-pill"
    >
      <span aria-hidden="true" className="relative inline-flex h-5 w-5 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ duration: 0.18 }}
              className="absolute inline-flex text-accent-sleep"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.18 }}
              className="absolute inline-flex text-accent-energy"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </Toggle>
  );
}
