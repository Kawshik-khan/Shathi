'use client';

import { cn } from '@/lib/utils';

interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

/** Primary CTA bar pinned above the bottom tab bar on mobile.
 *  Tab bar = 64pt; this bar sits at bottom: calc(4rem + env(safe-area)) so it stacks
 *  above the tab bar without overlapping it. Content padding must clear this height
 *  (DashboardShell uses pb-24 on dashboard route).
 */
export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        'lg:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0))] left-0 right-0 z-30 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-[#1A202C]/95',
        className,
      )}
    >
      {children}
    </div>
  );
}
