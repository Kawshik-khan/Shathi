import { DashboardShell } from '@/components/layout/dashboard-shell';
import Sidebar from '@/components/settings/Sidebar';
import SettingsGrid from '@/components/settings/SettingsGrid';

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="min-h-[72vh] flex gap-8">
        <aside className="w-[280px]">
          <Sidebar />
        </aside>

        <section className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 7l1.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Settings</h1>
              <p className="text-sm text-slate-500">Calm, premium controls for your Shathi experience</p>
            </div>
          </div>

          <SettingsGrid />
        </section>
      </div>
    </DashboardShell>
  );
}

