'use client';

import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import { OfflineBanner } from '@/components/mobile/offline-banner';
import { MobileBottomNav } from './mobile-bottom-nav';
import { Header } from './header';
import { Suspense } from 'react';

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Dashboard layout.
 *
 * The desktop `Sidebar` was removed in favour of:
 *  - Mobile bottom tab bar (5 primary routes) for one-handed navigation.
 *  - Profile page "Quick Links" section (Mood / Habits / Sleep / Resources /
 *    Settings) for everything else, so users always know where to find them.
 *  - Desktop top header (greeting, search, notifications, profile menu) for
 *    the wide-viewport experience.
 *
 * Layout is now a single full-width main column; no left rail.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Suspense fallback={null}>
        <MobileTopBar />
      </Suspense>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <Suspense fallback={null}>
          <OfflineBanner />
        </Suspense>

        <div className="mx-auto w-full max-w-[1600px] px-4 py-4 mobile-gutter lg:px-6 lg:py-6">
          <div className="hidden lg:block">
            <Header />
          </div>

          {/* Bottom padding: tab bar (64) + sticky CTA (~80) + safe area (>=16) = ~160px.
             On lg the sticky CTA is hidden so we only need tab/FAB clearance (~32px). */}
          <div className="pb-40 lg:pb-8">{children}</div>
        </div>
      </main>

      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </div>
  );
}
