'use client';

import { Sidebar } from './sidebar';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import { OfflineBanner } from '@/components/mobile/offline-banner';
import { MobileBottomNav } from './mobile-bottom-nav';
import { Header } from './header';
import { Suspense } from 'react';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block" aria-hidden="true">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <MobileTopBar />
      </Suspense>

      <main className="flex-1 min-w-0 lg:ml-72 lg:mr-4 overflow-y-auto">
        <Suspense fallback={null}>
          <OfflineBanner />
        </Suspense>

        <div className="mx-auto w-full max-w-[1600px] px-4 py-4 mobile-gutter lg:px-6 lg:py-6">
          <div className="hidden lg:block">
            <Header />
          </div>

          {/* Bottom padding: tab bar (64) + FAB clearance + safe area */}
          <div className="pb-24 lg:pb-8">{children}</div>
        </div>
      </main>

      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </div>
  );
}
