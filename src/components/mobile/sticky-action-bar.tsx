'use client';

import { cn } from '@/lib/utils';

interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

/** Primary CTA bar pinned above the home indicator / bottom tab bar on mobile. */
export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        'lg:hidden fixed bottom-16 left-0 right-0 z-40 border-t border-black/5 bg-white/95 px-4 py-3 pb-safe backdrop-blur-md dark:border-white/10 dark:bg-[#1A202C]/95',
        className,
      )}
    >
      {children}
    </div>
  );
}
