'use client';

/**
 * Dashboard shell (PR3 redesign).
 *
 * - Layout: `flex h-screen overflow-hidden` so the (fixed) sidebar
 *   rail and the scrolling `<main>` pane stay visually aligned at the
 *   same height. `main` owns its own scroll.
 * - The desktop sidebar wrapper reserves gutter space so content never
 *   overlaps the floating fixed rail.
 * - OfflineBanner (from PR2 `ui/states`) is mounted once here so it
 *   survives route changes without re-registering listeners.
 * - Safety banner + header + children live inside a max-w-6xl
 *   container with consistent gutter (px-4 lg:px-6).
 */
import { Suspense } from 'react';
import { motion } from 'framer-motion';

import { Sidebar } from './sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { Header } from './header';
import { SafetyBanner } from './safety-banner';
import { OfflineBanner } from '@/components/ui/states/OfflineBanner';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  showSafetyBanner?: boolean;
}

export function DashboardShell({ children, fullWidth = true, showSafetyBanner = true }: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-app">
      {/* Desktop sidebar gutter. Hidden on small screens. On lg+ the inner
          Sidebar mounts as a fixed floating rail (~250px + left inset), so
          the gutter reserves room for it without wasting dashboard space. */}
      <div
        aria-hidden="true"
        className="hidden w-[260px] shrink-0 pl-4 lg:block"
      >
        <div className="h-full w-[250px]">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        </div>
      </div>

      {/* Mobile sidebar (drawer + fixed top header + bottom nav).
          Hidden on desktop — its visible parts are lg:hidden. */}
      <Suspense fallback={null}>
        <MobileSidebar />
      </Suspense>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="px-4 py-4 lg:px-8 lg:py-8">
          <div className={cn('w-full', !fullWidth && 'mx-auto max-w-6xl')}>
            <OfflineBanner />

            <Header />

            {showSafetyBanner ? <SafetyBanner /> : null}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pb-24 lg:pb-8"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

