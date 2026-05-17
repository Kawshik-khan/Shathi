'use client';

import { Sidebar } from './sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { Header } from './header';
import { motion } from 'framer-motion';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Content - responsive margins */}
      <main className="lg:ml-72 lg:mr-4 px-4 lg:px-0 py-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
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

