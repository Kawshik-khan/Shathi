'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Crown, Sparkles } from 'lucide-react';

import { getHabits, getSubscription, type SubscriptionSummary } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { UserPlan } from '@/types';

interface SidebarPlanCardProps {
  fallbackPlan: UserPlan;
  onNavigate?: () => void;
}

function planLabel(plan: UserPlan) {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan`;
}

function formatLimit(value: number | boolean | null | undefined) {
  if (value === null) return 'Unlimited';
  if (typeof value === 'boolean') return value ? 'Included' : 'Not included';
  if (typeof value === 'number') return value.toLocaleString();
  return 'Not included';
}

function usageText(used: number, limit: number | boolean | null | undefined) {
  if (limit === null) return `${used.toLocaleString()} / Unlimited`;
  if (typeof limit === 'number') return `${used.toLocaleString()} / ${limit.toLocaleString()}`;
  return `${used.toLocaleString()} used`;
}

function usagePercent(used: number, limit: number | boolean | null | undefined) {
  if (limit === null) return used > 0 ? 100 : 0;
  if (typeof limit !== 'number' || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function syncStoredPlan(summary: SubscriptionSummary) {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser) return;

  const nextUser = {
    ...currentUser,
    plan: summary.effective_plan,
    subscription_status: summary.subscription_status,
    subscription_started_at: summary.subscription_started_at,
    subscription_ends_at: summary.subscription_ends_at,
  };

  if (
    currentUser.plan === nextUser.plan &&
    currentUser.subscription_status === nextUser.subscription_status &&
    currentUser.subscription_started_at === nextUser.subscription_started_at &&
    currentUser.subscription_ends_at === nextUser.subscription_ends_at
  ) {
    return;
  }

  useAuthStore.getState().setUser(nextUser);
}

export function SidebarPlanCard({ fallbackPlan, onNavigate }: SidebarPlanCardProps) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [activeHabitCount, setActiveHabitCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getSubscription(),
      getHabits(),
    ])
      .then(([subscriptionResult, habitResult]) => {
        if (cancelled) return;

        if (subscriptionResult.status === 'fulfilled') {
          setSummary(subscriptionResult.value);
          syncStoredPlan(subscriptionResult.value);
        } else {
          setSummary(null);
        }

        if (habitResult.status === 'fulfilled') {
          setActiveHabitCount(habitResult.value.filter((habit) => habit.is_active).length);
        } else {
          setActiveHabitCount(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSummary(null);
        setActiveHabitCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const effectivePlan = summary?.effective_plan ?? fallbackPlan;
  const isFree = effectivePlan === 'free';
  const aiUsed = summary?.usage.ai_messages_this_month ?? 0;
  const aiLimit = summary?.limits.ai_messages_per_month;
  const habitLimit = summary?.limits.habits_limit;

  const usageRows = useMemo(() => {
    if (isFree || !summary) return [];

    const rows = [
      {
        label: 'AI messages',
        value: usageText(aiUsed, aiLimit),
        percent: usagePercent(aiUsed, aiLimit),
        icon: Sparkles,
      },
    ];

    if (activeHabitCount !== null) {
      rows.push({
        label: 'Active habits',
        value: usageText(activeHabitCount, habitLimit),
        percent: usagePercent(activeHabitCount, habitLimit),
        icon: BarChart3,
      });
    }

    return rows;
  }, [activeHabitCount, aiLimit, aiUsed, habitLimit, isFree, summary]);

  if (isFree) {
    return (
      <div className="mb-3 mt-auto rounded-2xl border border-primary/20 bg-linear-to-br from-primary-soft to-muted p-4">
        <div className="mb-2 flex items-center gap-2">
          <Crown className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">{t('plan.upgradeToPro')}</span>
        </div>
        <p className="card-caption mb-3">{t('plan.unlock')}</p>
        <Link
          href="/subscription"
          onClick={onNavigate}
          className="block w-full rounded-full bg-primary px-4 py-2 text-center text-sm font-medium text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-ring"
        >
          {t('actions.upgradeNow')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-3 mt-auto rounded-2xl border border-primary/25 bg-linear-to-br from-primary-soft via-muted to-background p-4 shadow-sm shadow-primary/10">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <Crown className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{planLabel(effectivePlan)}</p>
            <p className="text-[11px] text-muted-foreground">Current access</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-primary/30 bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {summary?.subscription_status ?? 'active'}
        </span>
      </div>

      {summary && (
        <>
          <div className="space-y-3">
            {usageRows.map((row) => {
              const Icon = row.icon;

              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {row.label}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{row.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/80" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-primary-light to-primary"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div className="rounded-xl bg-white/60 px-2 py-2">
              <p className="font-medium text-foreground">AI limit</p>
              <p>{formatLimit(aiLimit)}</p>
            </div>
            <div className="rounded-xl bg-white/60 px-2 py-2">
              <p className="font-medium text-foreground">Habit limit</p>
              <p>{formatLimit(habitLimit)}</p>
            </div>
          </div>
        </>
      )}

      <Link
        href="/subscription"
        onClick={onNavigate}
        className="mt-3 block w-full rounded-full bg-primary px-4 py-2 text-center text-sm font-medium text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-ring"
      >
        View plan
      </Link>
    </div>
  );
}
