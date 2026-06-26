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
  const profilePlanLabel = user.plan === 'free'
    ? 'Free Plan'
    : `${user.plan.charAt(0).toUpperCase()}${user.plan.slice(1)} Plan`;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed left-4 top-4 bottom-4 w-64 glass-card-strong z-50 flex flex-col py-6 px-4"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] flex items-center justify-center shadow-lg shadow-[#4A90A4]/20">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="font-semibold text-lg text-foreground">Shathi</span>
      </div>

      {/* Navigation — no scroll container: the sidebar is a fixed column that
         lays out top-to-bottom; if it overflows the viewport, the bottom
         section is clipped rather than scrollable. Scrolling is reserved for
         the page content. */}
      <nav className="space-y-1">
        {navigationItems.map((item, index) => {
          const isActive = isAdmin
            ? pathname === '/admin' && item.key === activeAdminTab
            : pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#E3F0F3] text-[#4A90A4] shadow-sm shadow-[#4A90A4]/10'
                    : 'text-muted-foreground hover:bg-[#F1F5F7] hover:text-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-[#4A90A4]')} />
                <span>{item.label ?? t(`navigation.${item.key}`)}</span>
                {!isAdmin && item.key === 'aiCompanion' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#4A90A4] animate-pulse" />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {!isAdmin && <SidebarPlanCard fallbackPlan={user.plan} />}

      {/* User Profile */}
      <Link
        href="/profile"
        className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-[#F1F5F7] transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A8D0D9] to-[#6FA8C7] flex items-center justify-center text-white font-medium">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrator' : profilePlanLabel}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </Link>
    </motion.aside>
  );
}

