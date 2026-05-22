'use client';

import { cn } from '@/lib/utils';
import { useAuthStore, useDashboardStore } from '@/lib/store';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  Smile,
  BookHeart,
  CheckCircle2,
  Dumbbell,
  Moon,
  BarChart3,
  Library,
  Settings,
  Crown,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type NavigationItem = {
  key: string;
  label?: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const navigation: NavigationItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'aiCompanion', href: '/ai-companion', icon: Sparkles },
  { key: 'mood', href: '/mood', icon: Smile },
  { key: 'journal', href: '/journal', icon: BookHeart },
  { key: 'habits', href: '/habits', icon: CheckCircle2 },
  { key: 'workouts', href: '/workouts', icon: Dumbbell },
  { key: 'sleep', href: '/sleep', icon: Moon },
  { key: 'insights', href: '/insights', icon: BarChart3 },
  { key: 'resources', href: '/resources', icon: Library },
  { key: 'settings', href: '/settings', icon: Settings },
];

const adminNavigation: NavigationItem[] = [
  { key: 'admin', label: 'Admin', href: '/admin', icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useDashboardStore();
  const authUser = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const navigationItems = authUser?.system_role === 'admin'
    ? [...navigation, ...adminNavigation]
    : navigation;
  const planLabel = user.plan === 'free'
    ? t('plan.upgradeToPro')
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center shadow-lg shadow-green-500/20">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="font-semibold text-lg text-foreground">Sathi</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item, index) => {
          const isActive = pathname === item.href;
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
                    ? 'bg-[#DCFCE7] text-[#22C55E] shadow-sm shadow-green-500/10'
                    : 'text-muted-foreground hover:bg-[#F3FAF4] hover:text-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-[#22C55E]')} />
                <span>{item.label ?? t(`navigation.${item.key}`)}</span>
                {item.key === 'aiCompanion' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Upgrade Card */}
      <div className="mt-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#DCFCE7] to-[#EEF7EF] border border-[#A7F3A0]/30">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-[#22C55E]" />
          <span className="font-semibold text-sm text-foreground">{planLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {t('plan.unlock')}
        </p>
        <Link
          href="/subscription"
          className="block w-full py-2 px-4 rounded-full bg-[#22C55E] text-center text-white text-sm font-medium hover:bg-[#16A34A] transition-colors shadow-lg shadow-green-500/20"
        >
          {user.plan === 'free' ? t('actions.upgradeNow') : 'View plan'}
        </Link>
      </div>

      {/* User Profile */}
      <Link
        href="/profile"
        className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-[#F3FAF4] transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A7F3A0] to-[#7ED957] flex items-center justify-center text-white font-medium">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.plan === 'free' ? 'Free Plan' : planLabel}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </Link>
    </motion.aside>
  );
}

