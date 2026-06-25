'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { BentoGrid, BentoCard } from '@/components/shared/bento-grid';
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
    <BentoGrid>
      <BentoCard colSpan={6} smColSpan={2} glowOnHover={false} className="order-1" delay={0}>
        <AICompanionCard />
      </BentoCard>

      <BentoCard colSpan={3} smColSpan={1} glowOnHover={false} className="order-2" delay={0.05}>
        <MoodOverview />
      </BentoCard>

      <BentoCard colSpan={3} smColSpan={1} glowOnHover={false} className="order-3" delay={0.1}>
        <SleepTracking />
      </BentoCard>

      <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} className="order-4" delay={0.15}>
        <DailyGoals />
      </BentoCard>

      <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} className="order-5" delay={0.2}>
        <HabitsTracker />
      </BentoCard>

      <BentoCard colSpan={4} smColSpan={2} glowOnHover={false} className="order-6" delay={0.25}>
        <TrainingCalendar />
      </BentoCard>

      <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} className="order-7" delay={0.3}>
        <JournalPreview />
      </BentoCard>

      <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} className="order-8" delay={0.35}>
        <AIInsight />
      </BentoCard>

      <BentoCard colSpan={4} smColSpan={2} glowOnHover={false} className="order-9" delay={0.4}>
        <DailyCheckIn />
      </BentoCard>
    </BentoGrid>
  );
}
