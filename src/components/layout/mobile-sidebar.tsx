'use client';

/**
 * Mobile sidebar / drawer (PR3 redesign).
 *
 * Composed of:
 *   - Fixed top-bar (logo + profile + menu trigger)
 *   - Drawer (slides in from left on demand)
 *   - Spacer for the top-bar height
 *
 * Mirrors the desktop `Sidebar.tsx` styling but renders only below the
 * `lg` breakpoint. Both share `nav-config.ts` so adding a page updates
 * every nav surface.
 */
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LogOut, Menu, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore, useDashboardStore } from '@/lib/store';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/language-toggle';
import { SidebarPlanCard } from '@/components/layout/sidebar-plan-card';
import { userNavigation } from '@/components/layout/nav-config';
import {
  adminNavigationItems,
  type AdminNavigationItem,
} from '@/components/layout/admin-navigation';

function planLabel(plan: string): string {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan`;
}

export function MobileSidebar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useDashboardStore();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();
  const isAdmin = authUser?.system_role === 'admin';
  const activeAdminTab = searchParams.get('tab') ?? 'overview';

  const handleLogout = React.useCallback(() => {
    setIsOpen(false);
    logout();
    router.push('/landing');
  }, [logout, router]);

  // Prevent body scroll when the drawer is open.
  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  return (
    <>
      {/* Top bar — fixed, only visible on small screens */}
      <header
        data-slot="mobile-top-bar"
        className="top-bar-shell fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border-subtle bg-bg-card/85 px-4 backdrop-blur-xl lg:hidden"
      >
        <Link
          href="/landing"
          className="flex items-center gap-2 focus-ring rounded-lg"
          aria-label="Go to landing page"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-sage-300 to-sage-500 text-sm font-bold text-white shadow-flat"
          >
            S
          </span>
          <span className="font-display text-base font-semibold text-text-primary">
            Shathi
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/profile"
            aria-label="Open profile"
            className="focus-ring flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-sand-100 to-sage-300 text-xs font-semibold text-white"
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            className="h-10 w-10 rounded-full"
          >
            <Icon icon={Menu} size={20} aria-hidden />
          </Button>
        </div>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen ? (
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-text-primary/20 backdrop-blur-sm lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            data-slot="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="shell-rail fixed inset-y-0 left-0 z-50 flex w-72 flex-col rounded-r-[28px] border border-border-subtle bg-bg-card/95 px-4 py-6 shadow-overlay backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t('navigation.main', 'Main navigation')}
          >
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/landing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 focus-ring rounded-lg"
                aria-label="Go to landing page"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-sage-300 to-sage-500 text-base font-bold text-white shadow-card"
                >
                  S
                </span>
                <span className="font-display text-lg font-semibold text-text-primary">
                  Shathi
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="h-10 w-10 rounded-full"
              >
                <Icon icon={X} size={20} aria-hidden />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {(isAdmin
                ? adminNavigationItems
                : userNavigation
              ).map((item, index) => {
                const adminItem = isAdmin
                  ? (item as AdminNavigationItem)
                  : null;
                const isActive = adminItem
                  ? pathname === '/admin' && adminItem.key === activeAdminTab
                  : pathname === item.href;
                const label = adminItem
                  ? adminItem.label
                  : item.label ?? t(`navigation.${item.key}`);
                const showBadge =
                  !isAdmin && (item as { badge?: boolean }).badge === true;

                return (
                  <motion.div
                    key={`${isAdmin ? 'a' : 'u'}-${item.key}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.025, 0.25) }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-pill px-3 py-3 text-sm font-medium transition-colors',
                        'focus-ring',
                        isActive
                          ? 'sidebar-active-marker bg-bg-selected text-text-primary shadow-flat'
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon
                        icon={item.icon}
                        size={20}
                        className={cn(
                          'transition-colors',
                          isActive
                            ? 'text-accent-energy'
                            : 'text-text-secondary group-hover:text-text-primary',
                        )}
                      />
                      <span className="truncate">{label}</span>
                      {showBadge ? (
                        <span
                          aria-hidden="true"
                          className="ml-auto h-2 w-2 animate-pulse rounded-full bg-accent-energy"
                        />
                      ) : null}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {!isAdmin ? (
              <SidebarPlanCard
                fallbackPlan={user.plan}
                onNavigate={() => setIsOpen(false)}
              />
            ) : null}

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="mt-2 flex items-center gap-3 rounded-pill px-2 py-3 transition-colors hover:bg-bg-hover focus-ring"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-sand-100 to-sage-300 text-sm font-semibold text-white shadow-flat"
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="truncate text-sm font-medium text-text-primary">
                  {user.name}
                </span>
                <span className="truncate text-xs text-text-secondary">
                  {isAdmin ? 'Administrator' : planLabel(user.plan)}
                </span>
              </span>
            </Link>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="mt-2 w-full justify-start gap-3 rounded-pill px-3 py-3 text-sm font-medium text-accent-crisis hover:bg-feedback-danger/10"
            >
              <Icon icon={LogOut} size={20} aria-hidden />
              <span>{t('header.logout')}</span>
            </Button>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* Spacer for fixed top bar */}
      <div aria-hidden="true" className="h-14 lg:hidden" />
    </>
  );
}

