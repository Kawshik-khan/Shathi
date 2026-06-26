'use client';

import { Sidebar } from './sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { Header } from './header';
import { SafetyBanner } from './safety-banner';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    // h-screen + flex row pins the shell to the viewport so the sidebar (fixed,
    // child of <body>) and the scrolling main pane stay visually aligned at the
    // same height. overflow-hidden on the wrapper prevents the layout itself
    // from scrolling; main owns its own scroll.
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar slot — kept as a flex sibling with the same width as
          the fixed sidebar (w-64 = 16rem). Hidden on small screens. On lg+
          this reserves gutter space so main never overlaps the floating fixed
          sidebar. */}
      <div
        aria-hidden="true"
        className="hidden lg:block shrink-0 w-72 pl-4 pt-4 pb-4"
      >
        <div className="h-full w-64">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        </div>
      </div>

      {/* Mobile Sidebar (drawer + fixed top header + bottom nav). No flow
          contribution on desktop — its visible parts are lg:hidden. */}
      <Suspense fallback={null}>
        <MobileSidebar />
      </Suspense>

      {/* Main scroll container. flex-1 fills remaining width after the sidebar
          gutter; overflow-y-auto lets long content scroll inside main instead
          of stretching the page. */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-4 lg:px-6 py-6 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Header />

            <SafetyBanner />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pb-24"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

