'use client';

import { cn } from '@/lib/utils';
import { useAuthStore, useDashboardStore } from '@/lib/store';
import { SidebarPlanCard } from '@/components/layout/sidebar-plan-card';
import { adminNavigationItems } from '@/components/layout/admin-navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  X,
  Menu,
  LogOut,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/language-toggle';

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

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useDashboardStore();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();
  const isAdmin = authUser?.system_role === 'admin';
  const activeAdminTab = searchParams.get('tab') ?? 'overview';
  const navigationItems = isAdmin ? adminNavigationItems : userNavigation;
  const profilePlanLabel = user.plan === 'free'
    ? 'Free Plan'
    : `${user.plan.charAt(0).toUpperCase()}${user.plan.slice(1)} Plan`;

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    router.push('/landing');
  };

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card-strong px-4 py-3 flex items-center justify-between">
        <Link
          href="/landing"
          className="flex items-center gap-3"
          aria-label="Go to landing page"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] flex items-center justify-center shadow-lg shadow-[#4A90A4]/20">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="font-semibold text-foreground">Shathi</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A8D0D9] to-[#6FA8C7] flex items-center justify-center text-white text-sm font-medium overflow-hidden"
            aria-label="Open profile"
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </Link>
          
          {/* Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg hover:bg-[#F1F5F7] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 glass-card-strong z-50 flex flex-col py-6 px-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/landing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3"
                aria-label="Go to landing page"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] flex items-center justify-center shadow-lg shadow-[#4A90A4]/20">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-semibold text-lg text-foreground">Shathi</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-[#F1F5F7] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
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
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
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

            {!isAdmin && <SidebarPlanCard fallbackPlan={user.plan} onNavigate={() => setIsOpen(false)} />}

            {/* User Profile */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
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

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 px-2 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('header.logout')}</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-14" />
    </>
  );
}

