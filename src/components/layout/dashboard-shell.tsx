'use client';

import { Sidebar } from './sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { Header } from './header';
import { Suspense } from 'react';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    // Outer flex container fills the viewport and lays the fixed sidebar
    // (desktop) and scrollable main column side-by-side at lg+.
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile. The fixed-position <Sidebar/>
          is removed from flow, so this wrapper contributes 0 width. */}
      <div className="hidden lg:block" aria-hidden="true">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile drawer + top bar */}
      <Suspense fallback={null}>
        <MobileSidebar />
      </Suspense>

      {/* Main column: fills remaining width (flex-1), is its own scroll
          container so the dashboard starts at the top of the column and
          scrolls independently of the fixed sidebar. ml-72 reserves room
          for the fixed w-64 sidebar plus its 16px left offset. */}
      <main className="flex-1 min-w-0 lg:ml-72 lg:mr-4 overflow-y-auto">
        <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
          <Header />

          <div className="pb-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

