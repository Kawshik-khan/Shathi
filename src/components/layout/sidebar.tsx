'use client';

/**
 * Desktop sidebar (PR3 redesign).
 *
 * - Fixed-position column at lg+, mirrors `mobile-sidebar.tsx` styling.
 * - Uses nav-config + adminNavigationItems as the single source of items.
 * - Surfaces the redesigned `Icon` facade, `motion-slide-right`, the
 *   `surface-card-elevated` shell, and the new sage/sand palette.
 *
 * The previous implementation hardcoded the brand teal gradient; PR3
 * pulls both the active marker and the inactive chip from semantic
 * tokens (`--color-bg-selected`, `--color-accent-energy`, etc.).
 */
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useAuthStore, useDashboardStore } from '@/lib/store';
import { Icon } from '@/components/ui/icon';
import { userNavigation, type NavItem } from '@/components/layout/nav-config';
import {
  adminNavigationItems,
  type AdminNavigationItem,
} from '@/components/layout/admin-navigation';
import { SidebarPlanCard } from '@/components/layout/sidebar-plan-card';

type RailItem =
  | (NavItem & { admin: false })
  | (AdminNavigationItem & { admin: true; key: string });

function planLabel(plan: string): string {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan`;
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useDashboardStore();
  const authUser = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const isAdmin = authUser?.system_role === 'admin';
  const activeAdminTab = searchParams.get('tab') ?? 'overview';
  const items: RailItem[] = isAdmin
    ? adminNavigationItems.map((i) => ({ ...i, admin: true as const }))
    : userNavigation.map((i) => ({ ...i, admin: false as const }));
  const profilePlanLabel = planLabel(user.plan);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      data-slot="sidebar"
      className="shell-rail fixed left-4 top-0 bottom-0 z-40 flex w-[250px] flex-col rounded-r-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3.5 py-6 shadow-card"
    >
      {/* Logo / brand */}
      <Link
        href={isAdmin ? '/admin' : '/dashboard'}
        className="mb-7 flex items-center gap-3 rounded-lg px-2 focus-ring"
        aria-label="Shathi home"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#55715B] to-[#6E8E73] text-base font-bold text-white shadow-card"
        >
          S
        </span>
        <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
          Shathi
        </span>
      </Link>

      {/* Navigation */}
      <nav
        aria-label={t('navigation.main', 'Main navigation')}
        className="flex-1 space-y-2"
      >
        {items.map((item, index) => {
          const isActive = isAdmin
            ? pathname === '/admin' &&
              (item as AdminNavigationItem).key === activeAdminTab
            : pathname === (item as NavItem).href;

          const label = isAdmin
            ? (item as AdminNavigationItem).label
            : (item as NavItem).label ?? t(`navigation.${item.key}`);

          const href = item.href;
          const showBadge = !isAdmin && (item as NavItem).badge === true;
          const IconComponent = item.icon;

          return (
            <motion.div
              key={`${item.admin ? 'a' : 'u'}-${item.key}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: Math.min(index * 0.03, 0.3),
                duration: 0.25,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <Link
                href={href}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors',
                  'focus-ring',
                  isActive
                    ? 'bg-gradient-to-br from-[#55715B] to-[#6E8E73] text-white shadow-lg shadow-[#55715B]/20'
                    : 'bg-transparent text-text-secondary hover:bg-[var(--color-bg-hover)] hover:text-text-primary',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-transparent group-hover:bg-white/60',
                  )}
                >
                  <Icon
                    icon={IconComponent}
                    size={20}
                    className={cn(
                      'transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-text-secondary group-hover:text-text-primary',
                    )}
                  />
                </div>
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

      {!isAdmin ? <SidebarPlanCard fallbackPlan={user.plan} /> : null}

      {/* User profile link */}
      <Link
        href="/profile"
        className={cn(
          'mt-2 flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/55 px-2 py-3 transition-colors',
          'hover:bg-[var(--color-bg-hover)] focus-ring',
        )}
      >
        <div className="relative">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#55715B] to-[#6E8E73] text-sm font-semibold text-white shadow-sm"
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="flex min-w-0 flex-1 flex-col text-left">
          <span className="truncate text-sm font-medium text-text-primary">
            {user.name}
          </span>
          <span className="truncate text-xs text-text-secondary">
            {isAdmin ? 'Administrator' : profilePlanLabel}
          </span>
        </span>
      </Link>
    </motion.aside>
  );
}

