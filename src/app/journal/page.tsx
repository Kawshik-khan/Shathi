'use client'

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { BookHeart, Plus } from 'lucide-react';

export default function JournalPage() {
  return (
    <DashboardShell>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
              <BookHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
              <p className="text-sm text-muted-foreground">Document your thoughts and reflections</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full btn-primary-gradient text-sm font-medium"
            onClick={() => alert('Journal entry functionality coming soon!')}
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>

        <GlassCard className="min-h-[400px] flex flex-col items-center justify-center" delay={0.1}>
          <div className="w-20 h-20 rounded-2xl bg-[#F3FAF4] flex items-center justify-center mb-4">
            <BookHeart className="w-8 h-8 text-[#22C55E]" />
          </div>
          <h2 className="text-xl font-medium text-foreground mb-2">Your Journal</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Start documenting your wellness journey. Your journal entries will appear here.
          </p>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}

