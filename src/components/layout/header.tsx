'use client';

import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Search, Bell, Calendar, LogOut } from 'lucide-react';
import { ThemeToggleSimple } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/landing");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0 mb-6 lg:mb-8"
    >
      {/* Greeting Section */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">
          Hi, {user?.name}! <span className="inline-block">👋</span>
        </h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          Let&apos;s make today another amazing step towards your best self.
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search Bar - Hidden on small mobile */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-48 lg:w-64 pl-10 pr-4 py-2 lg:py-2.5 rounded-full bg-white/80 border border-black/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]/30 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Action Icons - Hidden on mobile, show on tablet+ */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          <ThemeToggleSimple />
          
          <button className="relative p-2 lg:p-2.5 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-all" aria-label="Notifications">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22C55E] border-2 border-white dark:border-[#0F1A0F]" />
          </button>

          <button className="p-2 lg:p-2.5 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-all" aria-label="Calendar">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* User Avatar & Logout - Desktop only (mobile in sidebar) */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 lg:p-2.5 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-all"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="relative">
            <div className="w-9 lg:w-10 h-9 lg:h-10 rounded-full bg-gradient-to-br from-[#A7F3A0] to-[#7ED957] flex items-center justify-center text-white font-medium shadow-lg shadow-green-500/20 ring-2 ring-white">
              {user?.name.charAt(0)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-[#22C55E] border-2 border-white" />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

