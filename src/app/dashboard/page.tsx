'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AICompanionCard } from '@/components/widgets/ai-companion-card';
import { MoodOverview } from '@/components/widgets/mood-overview';
import { SleepTracking } from '@/components/widgets/sleep-tracking';
import { DailyGoals } from '@/components/widgets/daily-goals';
import { HabitsTracker } from '@/components/widgets/habits-tracker';
import { TrainingCalendar } from '@/components/widgets/training-calendar';
import { JournalPreview } from '@/components/widgets/journal-preview';
import { AIInsight } from '@/components/widgets/ai-insight';
import { DailyCheckIn } from '@/components/widgets/daily-check-in';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <DashboardContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user?.system_role === 'admin') {
      router.replace('/admin');
    }
  }, [router, user?.system_role]);

  if (user?.system_role === 'admin') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5 auto-rows-auto">
      <div className="sm:col-span-2 lg:col-span-6 order-1">
        <AICompanionCard />
      </div>

      <div className="sm:col-span-1 lg:col-span-3 order-2">
        <MoodOverview />
      </div>

      <div className="sm:col-span-1 lg:col-span-3 order-3">
        <SleepTracking />
      </div>

      <div className="sm:col-span-1 lg:col-span-4 order-4">
        <DailyGoals />
      </div>

      <div className="sm:col-span-1 lg:col-span-4 order-5">
        <HabitsTracker />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 order-6">
        <TrainingCalendar />
      </div>

      <div className="sm:col-span-1 lg:col-span-4 order-7">
        <JournalPreview />
      </div>

      <div className="sm:col-span-1 lg:col-span-4 order-8">
        <AIInsight />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 order-9">
        <DailyCheckIn />
      </div>
    </div>
  );
}
