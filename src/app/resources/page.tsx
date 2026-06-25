'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { apiFetch } from '@/lib/api';
import { Library, BookOpen, Video, Headphones, Phone, MapPin } from 'lucide-react';

interface LocalizedContent {
  id: string;
  content_type: string;
  title: string;
  body: string;
  region?: string | null;
}

interface CrisisResource {
  id: string;
  name: string;
  phone?: string | null;
  region?: string | null;
  type: string;
  is_24_7: boolean;
}

const fallbackContent: LocalizedContent[] = [
  {
    id: 'bd-stress-factors',
    content_type: 'article',
    title: 'Bangladesh wellness guide',
    body: 'Practical coping strategies for academic pressure, family expectations, city stress, and daily uncertainty.',
    region: 'Bangladesh',
  },
];

export default function ResourcesPage() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'bn' ? 'bn' : 'en';
  const [content, setContent] = useState<LocalizedContent[]>(fallbackContent);
  const [crisisResources, setCrisisResources] = useState<CrisisResource[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadResources() {
      try {
        const [localizedContent, resources] = await Promise.all([
          apiFetch<LocalizedContent[]>(`/api/v1/content/localized?language=${language}`, {}, 0),
          apiFetch<CrisisResource[]>(`/api/v1/crisis/resources?language=${language}`, {}, 0),
        ]);

        if (!mounted) {
          return;
        }

        setContent(localizedContent.length > 0 ? localizedContent : fallbackContent);
        setCrisisResources(resources);
      } catch {
        if (mounted) {
          setContent(fallbackContent);
        }
      }
    }

    loadResources();
    return () => {
      mounted = false;
    };
  }, [language]);

  return (
    <DashboardShell>
      <div className="max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] flex items-center justify-center">
            <Library className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Resources</h1>
            <p className="text-sm text-muted-foreground">Wellness guides and Bangladesh support options</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <GlassCard delay={0.1} className="text-center cursor-pointer" onClick={() => alert('Articles section coming soon!')}>
            <div className="w-14 h-14 rounded-xl bg-[#F1F5F7] flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-[#4A90A4]" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Articles</h3>
            <p className="text-sm text-muted-foreground">Wellness tips & guides</p>
          </GlassCard>

          <GlassCard delay={0.15} className="text-center cursor-pointer" onClick={() => alert('Videos section coming soon!')}>
            <div className="w-14 h-14 rounded-xl bg-[#F1F5F7] flex items-center justify-center mx-auto mb-3">
              <Video className="w-6 h-6 text-[#4A90A4]" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Videos</h3>
            <p className="text-sm text-muted-foreground">Guided meditations</p>
          </GlassCard>

          <GlassCard delay={0.2} className="text-center cursor-pointer" onClick={() => alert('Audio section coming soon!')}>
            <div className="w-14 h-14 rounded-xl bg-[#F1F5F7] flex items-center justify-center mx-auto mb-3">
              <Headphones className="w-6 h-6 text-[#4A90A4]" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Audio</h3>
            <p className="text-sm text-muted-foreground">Sleep sounds & podcasts</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GlassCard delay={0.25}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[#4A90A4]" />
              <h2 className="font-semibold text-foreground">Local content</h2>
            </div>
            <div className="space-y-3">
              {content.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-[#F1F5F7]">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    {item.region && <span className="text-xs text-muted-foreground">{item.region}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard delay={0.3}>
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-[#4A90A4]" />
              <h2 className="font-semibold text-foreground">Crisis support</h2>
            </div>
            <div className="space-y-3">
              {crisisResources.map((resource) => (
                <div key={resource.id} className="p-3 rounded-xl bg-[#F1F5F7]">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="font-medium text-foreground">{resource.name}</h3>
                    {resource.is_24_7 && <span className="text-xs text-[#4A90A4]">24/7</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {resource.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{resource.phone}</span>}
                    {resource.region && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{resource.region}</span>}
                    <span>{resource.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardShell>
  );
}
