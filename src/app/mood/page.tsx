'use client';

import { useEffect, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import {
  createActivityEvent,
  createMoodReflection,
  createSleepTiming,
  getMoodInference,
  type MoodInference,
} from '@/lib/api';
import {
  Activity,
  Bed,
  Brain,
  CheckCircle2,
  Loader2,
  MessageCircleHeart,
  Moon,
  RefreshCcw,
  Send,
} from 'lucide-react';

const reflectionPrompts = [
  'আজ দিনটা কেমন গেল?',
  'আজ কী আপনার শক্তি কমিয়ে দিয়েছে?',
  'কিছু কি আপনাকে চিন্তিত করছে?',
  'আজ আপনার মাথায় সবচেয়ে বেশি কী ঘুরছে?',
];

const behaviorActions = [
  {
    eventType: 'routine_missed',
    label: 'রুটিন মিস হয়েছে',
    icon: RefreshCcw,
  },
  {
    eventType: 'social_withdrawal',
    label: 'মানুষের সাথে কম কথা হয়েছে',
    icon: MessageCircleHeart,
  },
  {
    eventType: 'productivity_missed',
    label: 'ফোকাস কম ছিল',
    icon: Brain,
  },
  {
    eventType: 'productivity_completed',
    label: 'কাজ শেষ হয়েছে',
    icon: CheckCircle2,
  },
];

function confidenceLabel(confidence: MoodInference['confidence']) {
  if (confidence === 'high') return 'উচ্চ';
  if (confidence === 'medium') return 'মাঝারি';
  return 'কম';
}

function stateLabel(state: string) {
  const labels: Record<string, string> = {
    low_energy: 'কম শক্তি',
    stress: 'চাপ',
    sadness: 'মন খারাপ',
    burnout: 'বার্নআউট',
    frustration: 'বিরক্তি',
    anxiety: 'উদ্বেগ',
    positive: 'ইতিবাচক',
    neutral: 'স্থিতিশীল',
  };
  return labels[state] ?? state.replace(/_/g, ' ');
}

export default function MoodPage() {
  const [inference, setInference] = useState<MoodInference | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState(reflectionPrompts[0]);
  const [answer, setAnswer] = useState('');
  const [sleptAt, setSleptAt] = useState('');
  const [wokeAt, setWokeAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activitySubmitting, setActivitySubmitting] = useState('');
  const [sleepSubmitting, setSleepSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const didLogOpen = useRef(false);

  async function loadInference() {
    setError('');
    try {
      const nextInference = await getMoodInference(14);
      setInference(nextInference);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load mood insight.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getMoodInference(14)
      .then((nextInference) => setInference(nextInference))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load mood insight.');
      })
      .finally(() => setLoading(false));

    if (!didLogOpen.current) {
      didLogOpen.current = true;
      void createActivityEvent({
        event_type: 'app_open',
        event_metadata: { page: 'mood' },
      }).catch(() => undefined);
    }
  }, []);

  async function handleReflectionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) {
      setError('আপনার দিনের কথা কয়েকটি শব্দে লিখুন।');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createMoodReflection({
        prompt: selectedPrompt,
        answer: trimmed,
      });
      setAnswer('');
      setSuccess('রিফ্লেকশন সেভ হয়েছে।');
      await loadInference();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save reflection.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBehavior(eventType: string) {
    setActivitySubmitting(eventType);
    setError('');
    setSuccess('');

    try {
      await createActivityEvent({
        event_type: eventType,
        event_metadata: { source: 'mood_page_quick_action' },
      });
      setSuccess('সিগন্যাল সেভ হয়েছে।');
      await loadInference();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save signal.');
    } finally {
      setActivitySubmitting('');
    }
  }

  async function handleSleepSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sleptAt) {
      setError('ঘুমানোর সময় দিন।');
      return;
    }

    setSleepSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createSleepTiming({
        slept_at: new Date(sleptAt).toISOString(),
        woke_at: wokeAt ? new Date(wokeAt).toISOString() : null,
      });
      setSleptAt('');
      setWokeAt('');
      setSuccess('ঘুমের সময় সেভ হয়েছে।');
      await loadInference();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save sleep timing.');
    } finally {
      setSleepSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-6xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E]">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Mood Insight</h1>
              <p className="text-sm text-muted-foreground">মুড নম্বর ছাড়াই লেখা, রুটিন ও ঘুম থেকে সিগন্যাল বোঝা</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-[#A7F3A0]/60 bg-[#F3FAF4] px-4 py-3 text-sm text-[#166534]">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
            <GlassCard delay={0.05} glowOnHover={false}>
              <form onSubmit={handleReflectionSubmit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">আজকের রিফ্লেকশন</h2>
                  <p className="text-sm text-muted-foreground">মুড রেটিং নয়, নিজের ভাষায় দিনটা লিখুন।</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {reflectionPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                        selectedPrompt === prompt
                          ? 'border-[#22C55E] bg-[#F3FAF4] text-[#166534]'
                          : 'border-border bg-white/70 text-muted-foreground hover:bg-[#F8FCF8] dark:bg-secondary'
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">{selectedPrompt}</span>
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    rows={7}
                    placeholder="যেমন: আজ ফোকাস করতে পারছি না, সবকিছু ক্লান্তিকর লাগছে..."
                    className="mt-2 w-full resize-none rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full btn-primary-gradient px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  রিফ্লেকশন সেভ করুন
                </button>
              </form>
            </GlassCard>

            <div className="grid grid-cols-1 gap-5">
              <GlassCard delay={0.1} glowOnHover={false}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">AI mood prediction</h2>
                    <p className="text-sm text-muted-foreground">শেষ ১৪ দিনের নিরাপদ সিগন্যাল থেকে</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      void loadInference();
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/70 text-muted-foreground hover:text-foreground dark:bg-secondary"
                    aria-label="Refresh mood prediction"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex min-h-44 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    সিগন্যাল পড়া হচ্ছে
                  </div>
                ) : inference ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-[#F3FAF4]/80 p-4 dark:bg-secondary">
                        <p className="text-xs text-muted-foreground">ইনফার্ড স্টেট</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">{stateLabel(inference.state)}</p>
                      </div>
                      <div className="rounded-2xl bg-[#F3FAF4]/80 p-4 dark:bg-secondary">
                        <p className="text-xs text-muted-foreground">কনফিডেন্স</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">{confidenceLabel(inference.confidence)}</p>
                      </div>
                      <div className="rounded-2xl bg-[#F3FAF4]/80 p-4 dark:bg-secondary">
                        <p className="text-xs text-muted-foreground">সাপোর্ট টোন</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">{inference.support_tone.replace(/_/g, ' ')}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#A7F3A0]/60 bg-[#F8FCF8] p-4 dark:bg-secondary">
                      <p className="text-sm leading-6 text-foreground">{inference.reason_bn}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        এটি মেডিক্যাল ডায়াগনসিস নয়; Sathi শুধু উত্তর দেওয়ার টোন মানিয়ে নেয়।
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-foreground">কেন এমন মনে হচ্ছে</h3>
                      {inference.evidence.length === 0 ? (
                        <p className="text-sm text-muted-foreground">আরও কয়েকটি রিফ্লেকশন, চ্যাট বা রুটিন সিগন্যাল দিলে ইনসাইট ভালো হবে।</p>
                      ) : (
                        <div className="space-y-2">
                          {inference.evidence.map((item, index) => (
                            <div key={`${item.category}-${index}`} className="flex gap-3 rounded-2xl bg-white/70 p-3 dark:bg-background/40">
                              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
                              <div>
                                <p className="text-sm text-foreground">{item.reason_bn}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{item.category.replace(/_/g, ' ')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">ইনসাইট পাওয়া যায়নি।</p>
                )}
              </GlassCard>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
            <GlassCard delay={0.15} glowOnHover={false}>
              <h2 className="text-lg font-semibold text-foreground">দ্রুত আচরণগত সিগন্যাল</h2>
              <p className="mt-1 text-sm text-muted-foreground">স্কোর ছাড়াই দিনের প্যাটার্ন যোগ করুন।</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {behaviorActions.map((action) => {
                  const Icon = action.icon;
                  const pending = activitySubmitting === action.eventType;
                  return (
                    <button
                      key={action.eventType}
                      type="button"
                      onClick={() => void handleBehavior(action.eventType)}
                      disabled={Boolean(activitySubmitting)}
                      className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-[#F8FCF8] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-secondary"
                    >
                      {pending ? <Loader2 className="h-4 w-4 animate-spin text-[#22C55E]" /> : <Icon className="h-4 w-4 text-[#22C55E]" />}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard delay={0.2} glowOnHover={false}>
              <form onSubmit={handleSleepSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-[#22C55E]" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">ঘুমের সময়</h2>
                    <p className="text-sm text-muted-foreground">দেরি করে ঘুম বা কম ঘুম ইনসাইটে ধরা হবে।</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">ঘুমানোর সময়</span>
                    <input
                      type="datetime-local"
                      value={sleptAt}
                      onChange={(event) => setSleptAt(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">ঘুম থেকে ওঠা</span>
                    <input
                      type="datetime-local"
                      value={wokeAt}
                      onChange={(event) => setWokeAt(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={sleepSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#A7F3A0]/70 bg-[#F3FAF4] px-5 py-2.5 text-sm font-medium text-[#166534] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sleepSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bed className="h-4 w-4" />}
                  ঘুমের সিগন্যাল সেভ করুন
                </button>
              </form>
            </GlassCard>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
