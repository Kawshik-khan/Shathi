'use client';

import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/lib/store';
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
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Companion', href: '/ai-companion', icon: Sparkles },
  { name: 'Mood', href: '/mood', icon: Smile },
  { name: 'Journal', href: '/journal', icon: BookHeart },
  { name: 'Habits', href: '/habits', icon: CheckCircle2 },
  { name: 'Workouts', href: '/workouts', icon: Dumbbell },
  { name: 'Sleep', href: '/sleep', icon: Moon },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Resources', href: '/resources', icon: Library },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useDashboardStore();

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
        <span className="font-semibold text-lg text-foreground">Be.run</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.name}
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
                <span>{item.name}</span>
                {item.name === 'AI Companion' && (
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
          <span className="font-semibold text-sm text-foreground">Upgrade to Pro</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Unlock personalized insights and more wellness tools.
        </p>
        <button className="w-full py-2 px-4 rounded-full bg-[#22C55E] text-white text-sm font-medium hover:bg-[#16A34A] transition-colors shadow-lg shadow-green-500/20">
          Upgrade Now
        </button>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-[#F3FAF4] transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A7F3A0] to-[#7ED957] flex items-center justify-center text-white font-medium">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground">Premium Plan</p>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.aside>
  );
}

