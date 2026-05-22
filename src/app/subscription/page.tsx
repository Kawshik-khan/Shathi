'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import {
  createSubscriptionRequest,
  getHabits,
  getMySubscriptionRequests,
  getSubscription,
  type Habit,
  type SubscriptionRequest,
  type SubscriptionSummary,
} from '@/lib/api';
import {
  BarChart3,
  Brain,
  Check,
  Crown,
  Infinity as InfinityIcon,
  Loader2,
  Mic,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type RequestablePlan = 'premium' | 'family';

const planCards = [
  {
    key: 'free',
    name: 'Free',
    price: 'Starter',
    description: 'Core wellness tracking for getting started.',
    icon: Sparkles,
    features: ['50 AI messages/month', '3 active habits', 'Basic insights'],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 'Manual review',
    description: 'More personal guidance and deeper wellness insight.',
    icon: Crown,
    features: ['1000 AI messages/month', 'Unlimited habits', 'AI memory', 'Voice chat'],
  },
  {
    key: 'family',
    name: 'Family',
    price: 'Manual review',
    description: 'Shared wellness support for a small family group.',
    icon: Users,
    features: ['2000 AI messages/month', 'Family activities', 'Up to 6 members'],
  },
] as const;

const featureRows = [
  { label: 'AI memory', key: 'ai_memory', icon: Brain },
  { label: 'Voice chat', key: 'voice_chat', icon: Mic },
  { label: 'Advanced insights', key: 'advanced_insights', icon: BarChart3 },
  { label: 'Family accounts', key: 'family_accounts', icon: Users },
] as const;

function planLabel(plan?: string) {
  if (!plan) return 'Free';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function formatLimit(value: number | boolean | null | undefined) {
  if (value === null) return 'Unlimited';
  if (typeof value === 'boolean') return value ? 'Included' : 'Not included';
  if (typeof value === 'number') return value.toLocaleString();
  return 'Not included';
}

function formatDate(value?: string | null) {
  if (!value) return 'No end date set';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function latestRequest(requests: SubscriptionRequest[]) {
  return requests[0] ?? null;
}

export default function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <SubscriptionContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function SubscriptionContent() {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RequestablePlan>('premium');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
        getSubscription(),
        getMySubscriptionRequests(),
        getHabits(),
      ])
      .then(([subscriptionResponse, requestResponse, habitResponse]) => {
        if (cancelled) return;
        setSummary(subscriptionResponse);
        setRequests(requestResponse);
        setHabits(habitResponse);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load subscription details.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingRequest = useMemo(
    () => requests.find((request) => request.status === 'pending') ?? null,
    [requests],
  );
  const recentRequest = latestRequest(requests);
  const activeHabitCount = habits.filter((habit) => habit.is_active).length;
  const aiLimit = summary?.limits.ai_messages_per_month;
  const aiUsed = summary?.usage.ai_messages_this_month ?? 0;
  const habitLimit = summary?.limits.habits_limit;
  const canRequest = summary?.effective_plan !== selectedPlan && !pendingRequest;

  async function handleRequestSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canRequest) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const request = await createSubscriptionRequest({
        requested_plan: selectedPlan,
        message: message.trim() || null,
      });
      setRequests((current) => [request, ...current]);
      setMessage('');
      setSuccess('Upgrade request submitted. An admin can review it from the backend workflow.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit upgrade request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center shadow-lg shadow-green-500/20">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Subscription</h1>
            <p className="text-sm text-muted-foreground">Plan access, usage, and manual upgrade requests.</p>
          </div>
        </div>
        <div className="rounded-full border border-[#A7F3A0]/50 bg-[#F3FAF4] px-4 py-2 text-sm font-medium text-[#166534]">
          {planLabel(summary?.effective_plan)} access
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard delay={0.05} className="lg:col-span-2">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#22C55E]">Current plan</p>
              <h2 className="mt-2 text-3xl font-semibold">{planLabel(summary?.plan)}</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Effective access is {planLabel(summary?.effective_plan)} with {summary?.subscription_status ?? 'active'} status.
              </p>
            </div>
            <div className="rounded-2xl border border-[#A7F3A0]/40 bg-[#DCFCE7]/70 px-4 py-3 text-sm">
              <p className="font-medium text-[#166534]">Plan window</p>
              <p className="mt-1 text-muted-foreground">
                Ends {formatDate(summary?.subscription_ends_at)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/55 p-4">
              <p className="text-xs uppercase text-muted-foreground">Status</p>
              <p className="mt-2 text-lg font-semibold capitalize">{summary?.subscription_status ?? 'active'}</p>
            </div>
            <div className="rounded-2xl bg-white/55 p-4">
              <p className="text-xs uppercase text-muted-foreground">Latest request</p>
              <p className="mt-2 text-lg font-semibold capitalize">{recentRequest?.status ?? 'None'}</p>
            </div>
            <div className="rounded-2xl bg-white/55 p-4">
              <p className="text-xs uppercase text-muted-foreground">Requested plan</p>
              <p className="mt-2 text-lg font-semibold">{planLabel(recentRequest?.requested_plan)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.1}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#22C55E]" />
            <h2 className="text-lg font-semibold">Usage</h2>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>AI messages</span>
                <span className="font-medium">
                  {aiUsed.toLocaleString()} / {formatLimit(aiLimit)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#DCFCE7]">
                <div
                  className="h-2 rounded-full bg-[#22C55E]"
                  style={{
                    width:
                      typeof aiLimit === 'number' && aiLimit > 0
                        ? `${Math.min(100, (aiUsed / aiLimit) * 100)}%`
                        : '100%',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Active habits</span>
                <span className="font-medium">
                  {activeHabitCount} / {formatLimit(habitLimit)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#DCFCE7]">
                <div
                  className="h-2 rounded-full bg-[#7ED957]"
                  style={{
                    width:
                      typeof habitLimit === 'number' && habitLimit > 0
                        ? `${Math.min(100, (activeHabitCount / habitLimit) * 100)}%`
                        : '100%',
                  }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {planCards.map((plan, index) => {
          const Icon = plan.icon;
          const isCurrent = summary?.effective_plan === plan.key;
          const isSelected = selectedPlan === plan.key;
          const requestable = plan.key === 'premium' || plan.key === 'family';

          return (
            <GlassCard key={plan.key} delay={0.12 + index * 0.04}>
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#22C55E]" />
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-[#22C55E] px-3 py-1 text-xs font-medium text-white">
                    Current
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm font-medium text-[#22C55E]">{plan.price}</p>
              <p className="mt-2 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              {requestable && (
                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`mt-6 w-full rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#22C55E] text-white shadow-lg shadow-green-500/20'
                      : 'bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]'
                  }`}
                >
                  Select {plan.name}
                </button>
              )}
            </GlassCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard delay={0.2} className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#22C55E]" />
            <h2 className="text-lg font-semibold">Plan features</h2>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featureRows.map((feature) => {
              const Icon = feature.icon;
              const enabled = Boolean(summary?.entitlements[feature.key]);

              return (
                <div key={feature.key} className="flex items-center justify-between rounded-2xl bg-white/55 p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#22C55E]" />
                    <span className="font-medium">{feature.label}</span>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      enabled ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {enabled ? 'Included' : 'Locked'}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-2xl bg-white/55 p-4">
              <div className="flex items-center gap-3">
                <InfinityIcon className="w-5 h-5 text-[#22C55E]" />
                <span className="font-medium">Habit limit</span>
              </div>
              <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium text-[#166534]">
                {formatLimit(summary?.limits.habits_limit)}
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.24}>
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#22C55E]" />
            <h2 className="text-lg font-semibold">Request upgrade</h2>
          </div>

          {pendingRequest ? (
            <div className="mt-5 rounded-2xl border border-[#A7F3A0]/50 bg-[#F3FAF4] p-4">
              <p className="font-medium text-[#166534]">Request pending</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {planLabel(pendingRequest.requested_plan)} request sent on {formatDate(pendingRequest.created_at)}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(['premium', 'family'] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      selectedPlan === plan
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-white/60 text-foreground hover:bg-[#DCFCE7]'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Optional note for the admin"
                className="w-full resize-none rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30"
              />
              <button
                type="submit"
                disabled={!canRequest || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#22C55E] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-green-500/20 transition-colors hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Request {planLabel(selectedPlan)}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
