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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        {/* Responsive Bento Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5 auto-rows-auto">
          {/* AI Companion - Full width on mobile, 6 cols on desktop */}
          <div className="sm:col-span-2 lg:col-span-6 order-1">
            <AICompanionCard />
          </div>

          {/* Mood Overview - 3 cols on desktop */}
          <div className="sm:col-span-1 lg:col-span-3 order-2">
            <MoodOverview />
          </div>

          {/* Sleep Tracking - 3 cols on desktop */}
          <div className="sm:col-span-1 lg:col-span-3 order-3">
            <SleepTracking />
          </div>

          {/* Daily Goals - 4 cols on desktop */}
          <div className="sm:col-span-1 lg:col-span-4 order-4">
            <DailyGoals />
          </div>

          {/* Habits Tracker - 4 cols on desktop */}
          <div className="sm:col-span-1 lg:col-span-4 order-5">
            <HabitsTracker />
          </div>

          {/* Training Calendar - 4 cols on desktop */}
          <div className="sm:col-span-2 lg:col-span-4 order-6">
            <TrainingCalendar />
          </div>

          {/* Journal Preview - 4 cols on desktop */}
          <div className="sm:col-span-1 lg:col-span-4 order-7">
            <JournalPreview />
          </div>

          {/* AI Insight - 4 cols on desktop */}
          <div className="sm:col-span-1 lg:col-span-4 order-8">
            <AIInsight />
          </div>

          {/* Daily Check-in - 4 cols on desktop */}
          <div className="sm:col-span-2 lg:col-span-4 order-9">
            <DailyCheckIn />
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
