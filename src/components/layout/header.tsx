'use client';

import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Search, Bell, Calendar, LogOut, Settings, UserCircle } from 'lucide-react';
import { ThemeToggleSimple } from '@/components/theme-toggle';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/language-toggle';
import { formatBangladeshDateTime, toBengaliCalendarDate } from '@/lib/dateLocale';
import { useState } from 'react';

export function Header() {
  const { user } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const { i18n, t } = useTranslation();
  const language = i18n.language === 'bn' ? 'bn' : 'en';
  const [today] = useState(() => new Date());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const isDashboardPage = pathname === '/dashboard';

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    router.push("/landing");
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
      className={`flex flex-col lg:flex-row lg:items-center ${isDashboardPage ? 'justify-between' : 'justify-end'} gap-4 lg:gap-0 mb-6 lg:mb-8`}
    >
      {isDashboardPage && (
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">
            {t('header.greeting', { name: user?.name ?? 'friend' })}
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            {t('header.subtitle')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'bn' ? toBengaliCalendarDate(today) : formatBangladeshDateTime(today, language)}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('header.search')}
            className="w-48 lg:w-64 pl-10 pr-4 py-2 lg:py-2.5 rounded-full bg-white/80 border border-black/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/20 focus:border-[#4A90A4]/30 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          <LanguageToggle />
          <ThemeToggleSimple />

          <button className="relative p-2 lg:p-2.5 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-all" aria-label={t('header.notifications')}>
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#4A90A4] border-2 border-white dark:border-[#0F1419]" />
          </button>

          <button className="p-2 lg:p-2.5 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-all" aria-label={t('header.calendar')}>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 lg:p-2.5 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-all"
            aria-label={t('header.logout')}
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              className="w-9 lg:w-10 h-9 lg:h-10 rounded-full bg-gradient-to-br from-[#A8D0D9] to-[#6FA8C7] flex items-center justify-center text-white font-medium shadow-lg shadow-[#4A90A4]/20 ring-2 ring-white"
              aria-label="Open profile menu"
              aria-expanded={isProfileMenuOpen}
            >
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.name.charAt(0)
              )}
            </button>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-[#4A90A4] border-2 border-white" />
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-xl bg-white dark:bg-[#0F1419] border border-black/5 dark:border-white/10 shadow-xl shadow-black/10 py-2 z-[70]">
                <button
                  type="button"
                  onClick={openProfile}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#F1F5F7] dark:hover:bg-white/10 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={openSettings}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#F1F5F7] dark:hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
