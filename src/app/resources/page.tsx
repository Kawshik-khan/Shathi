'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { Library, BookOpen, Video, Headphones } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <DashboardShell>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
            <Library className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Resources</h1>
            <p className="text-sm text-muted-foreground">Wellness guides and tools</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <GlassCard delay={0.1} className="text-center cursor-pointer" onClick={() => alert('Articles section coming soon!')}>
            <div className="w-14 h-14 rounded-xl bg-[#F3FAF4] flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-[#22C55E]" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Articles</h3>
            <p className="text-sm text-muted-foreground">Wellness tips & guides</p>
          </GlassCard>

          <GlassCard delay={0.15} className="text-center cursor-pointer" onClick={() => alert('Videos section coming soon!')}>
            <div className="w-14 h-14 rounded-xl bg-[#F3FAF4] flex items-center justify-center mx-auto mb-3">
              <Video className="w-6 h-6 text-[#22C55E]" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Videos</h3>
            <p className="text-sm text-muted-foreground">Guided meditations</p>
          </GlassCard>

          <GlassCard delay={0.2} className="text-center cursor-pointer" onClick={() => alert('Audio section coming soon!')}>
            <div className="w-14 h-14 rounded-xl bg-[#F3FAF4] flex items-center justify-center mx-auto mb-3">
              <Headphones className="w-6 h-6 text-[#22C55E]" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Audio</h3>
            <p className="text-sm text-muted-foreground">Sleep sounds & podcasts</p>
          </GlassCard>
        </div>
      </div>
    </DashboardShell>
  );
}

