'use client';

import { cn } from '@/lib/utils';
import { useAuthStore, useDashboardStore } from '@/lib/store';
import { SidebarPlanCard } from '@/components/layout/sidebar-plan-card';
import { adminNavigationItems } from '@/components/layout/admin-navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  Smile,
  BookHeart,
  CheckCircle2,
  Moon,
  BarChart3,
  Library,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type NavigationItem = {
  key: string;
  label?: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const userNavigation: NavigationItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'aiCompanion', href: '/ai-companion', icon: Sparkles },
  { key: 'mood', href: '/mood', icon: Smile },
  { key: 'journal', href: '/journal', icon: BookHeart },
  { key: 'habits', href: '/habits', icon: CheckCircle2 },
  { key: 'sleep', href: '/sleep', icon: Moon },
  { key: 'insights', href: '/insights', icon: BarChart3 },
  { key: 'resources', href: '/resources', icon: Library },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useDashboardStore();
  const authUser = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const isAdmin = authUser?.system_role === 'admin';
  const activeAdminTab = searchParams.get('tab') ?? 'overview';
  const navigationItems = isAdmin ? adminNavigationItems : userNavigation;
  const profilePlanLabel =
    user.plan === 'free'
      ? 'Free Plan'
      : `${user.plan.charAt(0).toUpperCase()}${user.plan.slice(1)} Plan`;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="glass-card-strong fixed bottom-4 left-4 top-4 z-50 flex w-64 flex-col px-4 py-5"
    >
      {/* Logo */}
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
          <span className="text-lg font-bold text-white">S</span>
        </div>
        <span className="text-lg font-semibold text-foreground">Shathi</span>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Primary"
        className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto pr-1"
      >
        {navigationItems.map((item, index) => {
          const isActive = isAdmin
            ? pathname === '/admin' && item.key === activeAdminTab
            : pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
            >
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 focus-ring',
                  isActive
                    ? 'bg-primary-soft text-primary shadow-sm shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label ?? t(`navigation.${item.key}`)}</span>
                {!isAdmin && item.key === 'aiCompanion' && (
                  <span
                    aria-hidden="true"
                    className="ml-auto h-2 w-2 animate-pulse rounded-full bg-primary"
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {!isAdmin && <SidebarPlanCard fallbackPlan={user.plan} />}

      {/* User Profile (pinned) */}
      <Link
        href="/profile"
        className="focus-ring mt-3 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-white">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? 'Administrator' : profilePlanLabel}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </Link>
    </motion.aside>
  );
}

