'use client';

import { Sidebar } from './sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { Header } from './header';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile Sidebar */}
      <Suspense fallback={null}>
        <MobileSidebar />
      </Suspense>

      {/* Main Content - fills the available width after the sidebar so the
          dashboard cards sit close to the sidebar instead of being centered
          inside a max-w container (which produces an empty middle gap on
          wide viewports). */}
      <main className="lg:ml-72 lg:mr-4 px-4 lg:px-0 py-6 min-h-screen">
        <div className="w-full max-w-[1600px]">
          <Header />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pb-8"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

