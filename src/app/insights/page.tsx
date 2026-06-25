import { DashboardShell } from '@/components/layout/dashboard-shell';
import { InsightsContent } from './InsightsContent';

export const metadata = {
  title: 'Insights — Shathi',
};

export default function InsightsPage() {
  return (
    <DashboardShell>
      <InsightsContent />
    </DashboardShell>
  );
}

