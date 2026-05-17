import { DashboardShell } from '@/components/layout/dashboard-shell';
import { InsightsContent } from './InsightsContent';

export const metadata = {
  title: 'Insights — Sathi',
};

export default function InsightsPage() {
  return (
    <DashboardShell>
      <InsightsContent />
    </DashboardShell>
  );
}

