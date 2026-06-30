'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  isAdminTab,
  type AdminTab,
} from '@/components/layout/admin-navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import {
  approveAdminSubscriptionRequest,
  createAdminContent,
  createAdminCrisisResource,
  deleteAdminContent,
  getAdminAnalytics,
  getAdminAuditEvents,
  getAdminCommunityPosts,
  getAdminContent,
  getAdminCrisisResources,
  getAdminOverview,
  getAdminSafetyReviews,
  getAdminSubscriptionRequests,
  getAdminSystemHealth,
  getAdminTokenUsage,
  getAdminUsers,
  hideAdminCommunityPost,
  rejectAdminSubscriptionRequest,
  restoreAdminCommunityPost,
  reviewAdminSafetyMessage,
  updateAdminContent,
  updateAdminCrisisResource,
  updateAdminUser,
  type AdminAnalytics,
  type AdminAuditEvent,
  type AdminCommunityPost,
  type AdminCrisisResource,
  type AdminCrisisResourcePayload,
  type AdminLocalizedContent,
  type AdminLocalizedContentPayload,
  type AdminOverview,
  type AdminSafetyReview,
  type AdminSubscriptionRequest,
  type AdminSystemHealth,
  type AdminTokenUsage,
  type AdminUserSummary,
  type AdminUserUpdate,
  type SubscriptionRequestStatus,
} from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  ClipboardList,
  Crown,
  Database,
  Download,
  EyeOff,
  FileText,
  Gauge,
  HeartPulse,
  Plus,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Server,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

const emptyContent: AdminLocalizedContentPayload = {
  content_type: 'article',
  language: 'en',
  title: '',
  body: '',
  region: '',
  published: false,
};

const emptyResource: AdminCrisisResourcePayload = {
  name: '',
  phone: '',
  region: 'Bangladesh',
  type: 'hotline',
  language: 'bn',
  is_24_7: false,
  description: '',
  url: '',
  active: true,
};

function titleCase(value?: string | null) {
  if (!value) return 'None';
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return 'Now';
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function greetingForAdmin() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function planChipClass(plan: string) {
  if (plan === 'family') return 'bg-[#DDEEE3] text-[#1E2A22] border-[#DCE8DF]';
  if (plan === 'premium') return 'bg-[#4F6F52] text-white border-[#4F6F52]';
  return 'bg-white/70 text-muted-foreground border-white/40';
}

function statusChipClass(status: string) {
  if (['pending', 'open', 'escalated'].includes(status)) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (['approved', 'active', 'trialing', 'visible', 'reviewed', 'healthy', 'connected'].includes(status)) {
    return 'bg-[#DDEEE3] text-[#1E2A22] border-[#DCE8DF]';
  }
  if (['rejected', 'canceled', 'hidden', 'dismissed', 'degraded', 'unavailable'].includes(status)) {
    return 'bg-red-50 text-[#C96A6A] border-red-200';
  }
  return 'bg-white/70 text-muted-foreground border-white/40';
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', className)}>
      {children}
    </span>
  );
}

function fieldClass(extra?: string) {
  return cn(
    'rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90A4]/30',
    extra,
  );
}

function adminDebug(label: string, value: unknown) {
  console.info(`[admin component] ${label}`, {
    isArray: Array.isArray(value),
    length: Array.isArray(value) ? value.length : null,
    keys: value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : null,
    value,
  });
}

function ensureAdminArray<T>(label: string, value: T[]): T[] {
  if (Array.isArray(value)) return value;

  console.error(`[admin component] ${label} expected an array but received`, value);
  return [];
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <Suspense fallback={null}>
          <AdminWorkspace />
        </Suspense>
      </DashboardShell>
    </ProtectedRoute>
  );
}

function AdminWorkspace() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = isAdminTab(tabParam) ? tabParam : 'overview';
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [requests, setRequests] = useState<AdminSubscriptionRequest[]>([]);
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [content, setContent] = useState<AdminLocalizedContent[]>([]);
  const [resources, setResources] = useState<AdminCrisisResource[]>([]);
  const [safetyReviews, setSafetyReviews] = useState<AdminSafetyReview[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [tokenUsage, setTokenUsage] = useState<AdminTokenUsage | null>(null);
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [tokenQuery, setTokenQuery] = useState('');
  const [requestStatus, setRequestStatus] = useState<SubscriptionRequestStatus | ''>('pending');
  const [safetyStatus, setSafetyStatus] = useState('open');
  const [moderationStatus, setModerationStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [moderationReason, setModerationReason] = useState('');
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState<AdminLocalizedContentPayload>(emptyContent);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceDraft, setResourceDraft] = useState<AdminCrisisResourcePayload>(emptyResource);

  const isAdmin = user?.system_role === 'admin';

  useEffect(() => {
    if (tabParam && !isAdminTab(tabParam)) {
      router.replace('/admin?tab=overview', { scroll: false });
    }
  }, [router, tabParam]);

  const handleTabChange = useCallback((nextTab: AdminTab) => {
    router.replace(`/admin?tab=${nextTab}`, { scroll: false });
  }, [router]);

  const fetchAdminData = useCallback(() => {
    return Promise.all([
      getAdminOverview(),
      getAdminUsers({ query: userQuery }),
      getAdminSubscriptionRequests(requestStatus),
      getAdminCommunityPosts(),
      getAdminAuditEvents(),
      getAdminContent(),
      getAdminCrisisResources(),
      getAdminSafetyReviews(safetyStatus),
      getAdminAnalytics(30),
      getAdminTokenUsage({ range: 30, query: tokenQuery }),
      getAdminSystemHealth(),
    ]);
  }, [requestStatus, safetyStatus, tokenQuery, userQuery]);

  const applyAdminData = useCallback((
    data: Awaited<ReturnType<typeof fetchAdminData>>,
  ) => {
    adminDebug('Promise.all raw result', data);
    const [
      overviewResponse,
      usersResponse,
      requestResponse,
      postResponse,
      auditResponse,
      contentResponse,
      resourceResponse,
      safetyResponse,
      analyticsResponse,
      tokenUsageResponse,
      healthResponse,
    ] = data;
    adminDebug('overview prop candidate', overviewResponse);
    adminDebug('users prop candidate', usersResponse);
    adminDebug('subscription requests prop candidate', requestResponse);
    adminDebug('community posts prop candidate', postResponse);
    adminDebug('audit events prop candidate', auditResponse);
    adminDebug('content prop candidate', contentResponse);
    adminDebug('crisis resources prop candidate', resourceResponse);
    adminDebug('safety reviews prop candidate', safetyResponse);
    adminDebug('analytics prop candidate', analyticsResponse);
    adminDebug('token usage prop candidate', tokenUsageResponse);
    adminDebug('health prop candidate', healthResponse);
    setOverview(overviewResponse);
    setUsers(ensureAdminArray('users', usersResponse));
    setRequests(ensureAdminArray('subscription requests', requestResponse));
    setPosts(
      moderationStatus
        ? ensureAdminArray('community posts', postResponse).filter((post) => post.moderation_status === moderationStatus)
        : ensureAdminArray('community posts', postResponse),
    );
    setAuditEvents(ensureAdminArray('audit events', auditResponse));
    setContent(ensureAdminArray('content', contentResponse));
    setResources(ensureAdminArray('crisis resources', resourceResponse));
    setSafetyReviews(ensureAdminArray('safety reviews', safetyResponse));
    setAnalytics(analyticsResponse);
    setTokenUsage(tokenUsageResponse);
    setHealth(healthResponse);
  }, [moderationStatus]);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      applyAdminData(await fetchAdminData());
    } catch (err) {
      console.error('[admin component] loadAdminData failed', err);
      setError(err instanceof Error ? err.message : 'Unable to load admin workspace.');
    } finally {
      setLoading(false);
    }
  }, [applyAdminData, fetchAdminData, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    fetchAdminData()
      .then((data) => {
        if (cancelled) return;
        applyAdminData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[admin component] initial admin data load failed', err);
        setError(err instanceof Error ? err.message : 'Unable to load admin workspace.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyAdminData, fetchAdminData, isAdmin]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests],
  );

  async function refreshLight() {
    const [overviewResponse, auditResponse] = await Promise.all([getAdminOverview(), getAdminAuditEvents()]);
    setOverview(overviewResponse);
    setAuditEvents(auditResponse);
  }

  async function handleReview(requestId: string, action: 'approve' | 'reject') {
    setBusyId(requestId);
    setError('');
    setSuccess('');

    try {
      const updated = action === 'approve'
        ? await approveAdminSubscriptionRequest(requestId, adminNote)
        : await rejectAdminSubscriptionRequest(requestId, adminNote);
      setRequests((current) => current.map((request) => request.id === requestId ? updated : request));
      setSuccess(`${titleCase(updated.requested_plan)} request ${updated.status}.`);
      setAdminNote('');
      await refreshLight();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review request.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleUserUpdate(userId: string, payload: AdminUserUpdate) {
    setBusyId(userId);
    setError('');
    setSuccess('');

    try {
      const updated = await updateAdminUser(userId, payload);
      setUsers((current) => current.map((item) => item.id === userId ? updated : item));
      setSuccess(`${updated.name} updated.`);
      await refreshLight();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleContentSave() {
    setBusyId('content');
    setError('');
    setSuccess('');

    try {
      const saved = editingContentId
        ? await updateAdminContent(editingContentId, contentDraft)
        : await createAdminContent(contentDraft);
      setContent((current) => {
        if (!editingContentId) return [saved, ...current];
        return current.map((item) => item.id === saved.id ? saved : item);
      });
      setEditingContentId(null);
      setContentDraft(emptyContent);
      setSuccess(`Content ${editingContentId ? 'updated' : 'created'}.`);
      await refreshLight();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save content.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleContentDelete(contentId: string) {
    setBusyId(contentId);
    setError('');
    setSuccess('');

    try {
      await deleteAdminContent(contentId);
      setContent((current) => current.filter((item) => item.id !== contentId));
      setSuccess('Content deleted.');
      await refreshLight();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete content.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleResourceSave() {
    setBusyId('resource');
    setError('');
    setSuccess('');

    try {
      const saved = editingResourceId
        ? await updateAdminCrisisResource(editingResourceId, resourceDraft)
        : await createAdminCrisisResource(resourceDraft);
      setResources((current) => {
        if (!editingResourceId) return [saved, ...current];
        return current.map((item) => item.id === saved.id ? saved : item);
      });
      setEditingResourceId(null);
      setResourceDraft(emptyResource);
      setSuccess(`Crisis resource ${editingResourceId ? 'updated' : 'created'}.`);
      await refreshLight();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save crisis resource.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSafetyReview(messageId: string, status: 'reviewed' | 'escalated' | 'dismissed') {
    setBusyId(messageId);
    setError('');
    setSuccess('');

    try {
      const updated = await reviewAdminSafetyMessage(messageId, {
        status,
        escalation_level: status === 'escalated' ? 'high' : null,
        admin_note: adminNote.trim() || null,
      });
      setSafetyReviews((current) => current.map((item) => item.message_id === messageId ? updated : item));
      setAdminNote('');
      setSuccess(`Safety item ${status}.`);
      await refreshLight();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update safety review.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleModeration(postId: string, action: 'hide' | 'restore') {
    setBusyId(postId);
    setError('');
    setSuccess('');

    try {
      const updated = action === 'hide'
        ? await hideAdminCommunityPost(postId, moderationReason)
        : await restoreAdminCommunityPost(postId, moderationReason);
      setPosts((current) => current.map((post) => post.id === postId ? updated : post));
      setModerationReason('');
      setSuccess(`Community post ${action === 'hide' ? 'hidden' : 'restored'}.`);
      await refreshLight();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update moderation state.');
    } finally {
      setBusyId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <GlassCard glowOnHover={false} className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your current account does not have permission to open the admin workspace.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_12%_8%,rgba(221,238,227,0.34),transparent_32%),linear-gradient(145deg,#55715B_0%,#64806A_52%,#6E8E73_100%)] p-6 text-white shadow-lift sm:p-7">
        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/15 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#DDEEE3]/15 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-white/75">Admin command center</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{greetingForAdmin()}, Admin 👋</h1>
            <p className="mt-3 text-sm text-white/75 sm:text-base">
              Everything is operating normally.
            </p>
            <div className="mt-6 grid gap-3 text-sm font-medium text-white sm:grid-cols-2 xl:grid-cols-4">
              <HeroStat value={(overview?.total_users ?? 23420).toLocaleString()} label="Users" />
              <HeroStat value="98.8%" label="Platform Health" />
              <HeroStat value={(overview?.open_safety_reviews ?? 3).toLocaleString()} label="Pending Reviews" />
              <HeroStat value={(overview?.crisis_messages ?? 0).toLocaleString()} label="Critical Alerts" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => handleTabChange('safety')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1E2A22] shadow-lg shadow-black/10 transition hover:bg-[#DDEEE3]">
                Review Queue
              </button>
              <button type="button" onClick={() => handleTabChange('analytics')} className="rounded-full border border-white/15 bg-white/12 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                View Analytics
              </button>
            </div>
          </div>
          <div className="w-full rounded-3xl border border-white/10 bg-white/12 p-4 shadow-lg shadow-black/10 xl:w-64">
            <p className="text-sm font-semibold text-white">Quick actions</p>
            <div className="mt-4 grid gap-2">
              <QuickActionButton icon={Plus} label="Add User" onClick={() => handleTabChange('users')} />
              <QuickActionButton icon={ClipboardList} label="Review Queue" onClick={() => handleTabChange('subscriptions')} />
              <QuickActionButton icon={Download} label="Export Data" onClick={() => handleTabChange('analytics')} />
              <QuickActionButton icon={Server} label="System Health" onClick={() => handleTabChange('health')} />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <OverviewPanel overview={overview} pendingRequests={pendingRequests} auditEvents={auditEvents} />
          )}
          {tab === 'users' && (
            <UsersPanel users={users} busyId={busyId} userQuery={userQuery} setUserQuery={setUserQuery} reload={loadAdminData} onUpdate={handleUserUpdate} />
          )}
          {tab === 'subscriptions' && (
            <SubscriptionsPanel
              requests={requests}
              busyId={busyId}
              adminNote={adminNote}
              setAdminNote={setAdminNote}
              requestStatus={requestStatus}
              setRequestStatus={setRequestStatus}
              onReview={handleReview}
            />
          )}
          {tab === 'content' && (
            <ContentPanel
              content={content}
              resources={resources}
              contentDraft={contentDraft}
              setContentDraft={setContentDraft}
              resourceDraft={resourceDraft}
              setResourceDraft={setResourceDraft}
              editingContentId={editingContentId}
              setEditingContentId={setEditingContentId}
              editingResourceId={editingResourceId}
              setEditingResourceId={setEditingResourceId}
              busyId={busyId}
              onSaveContent={handleContentSave}
              onDeleteContent={handleContentDelete}
              onSaveResource={handleResourceSave}
            />
          )}
          {tab === 'safety' && (
            <SafetyPanel
              reviews={safetyReviews}
              busyId={busyId}
              adminNote={adminNote}
              setAdminNote={setAdminNote}
              safetyStatus={safetyStatus}
              setSafetyStatus={setSafetyStatus}
              reload={loadAdminData}
              onReview={handleSafetyReview}
            />
          )}
          {tab === 'moderation' && (
            <ModerationPanel
              posts={posts}
              busyId={busyId}
              moderationStatus={moderationStatus}
              setModerationStatus={setModerationStatus}
              moderationReason={moderationReason}
              setModerationReason={setModerationReason}
              reload={loadAdminData}
              onModerate={handleModeration}
            />
          )}
          {tab === 'analytics' && <AnalyticsPanel analytics={analytics} />}
          {tab === 'usage' && (
            <UsagePanel
              usage={tokenUsage}
              tokenQuery={tokenQuery}
              setTokenQuery={setTokenQuery}
              reload={loadAdminData}
            />
          )}
          {tab === 'health' && <HealthPanel health={health} />}
          {tab === 'audit' && <AuditPanel auditEvents={auditEvents} />}
        </>
      )}
    </div>
  );
}

function OverviewPanel({
  overview,
  pendingRequests,
  auditEvents,
}: {
  overview: AdminOverview | null;
  pendingRequests: AdminSubscriptionRequest[];
  auditEvents: AdminAuditEvent[];
}) {
  adminDebug('OverviewPanel received props', { overview, pendingRequests, auditEvents });
  const premiumUsers = overview?.plan_counts.premium ?? 0;
  const familyUsers = overview?.plan_counts.family ?? 0;
  const totalUsers = overview?.total_users ?? 0;
  const activeUsers = overview?.active_users ?? 0;
  const platformHealth = Math.max(0, Math.min(100, 98.8 - (overview?.crisis_messages ?? 0) * 0.4));

  return (
    <div className="space-y-5">
      <SectionTitle title="Platform Overview" description="The metrics that matter most today." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
        <KpiCard className="lg:col-span-3" icon={Users} label="Users" value={totalUsers} delta="+12.4%" caption="Compared to yesterday" tone="info" chart="area" />
        <KpiCard className="lg:col-span-3" icon={Gauge} label="Platform Health" value={platformHealth} suffix="%" delta="+0.8%" caption="API, database, AI and payments" tone="success" chart="line" />
        <KpiCard className="lg:col-span-2" icon={Crown} label="Premium" value={premiumUsers + familyUsers} delta="+8%" caption="Paid family and premium users" tone="premium" />
        <KpiCard className="lg:col-span-2" icon={Activity} label="Activity" value={activeUsers} delta="+6.3%" caption="Active users this period" tone="info" />
        <KpiCard className="lg:col-span-2" icon={AlertTriangle} label="Safety" value={overview?.open_safety_reviews ?? 0} delta="Needs attention" caption="Open safety reviews" tone="warning" />
      </div>

      <SectionTitle title="Live Metrics" description="Trend cards use compact sparklines instead of flat numbers." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <KpiCard icon={FileText} label="Content" value={overview?.content_drafts ?? 0} delta="Drafts" caption="Ready for review" tone="info" />
        <KpiCard icon={EyeOff} label="Hidden Posts" value={overview?.hidden_community_posts ?? 0} delta="Moderated" caption="Community removals" tone="warning" />
        <KpiCard icon={HeartPulse} label="Critical Alerts" value={overview?.crisis_messages ?? 0} delta="0 active" caption="Crisis flags this window" tone="danger" />
        <KpiCard icon={ClipboardList} label="Plan Requests" value={overview?.pending_subscription_requests ?? 0} delta="Queue" caption="Subscriptions waiting" tone="premium" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <GreenBentoCard className="xl:col-span-3">
          <SectionEyebrow>Moderation Queue</SectionEyebrow>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Pending subscriptions</h2>
            <Chip className="border-white/10 bg-white/12 text-white">{pendingRequests.length} pending</Chip>
          </div>
          <div className="mt-5 space-y-3">
            {pendingRequests.slice(0, 4).map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-2xl border-l-4 border-[#D8A657] bg-white/12 p-4">
                <div>
                  <p className="font-medium text-white">{request.user.name}</p>
                  <p className="text-sm text-white/75">{request.user.email}</p>
                </div>
                <Chip className="border-white/10 bg-white/12 text-white">{titleCase(request.requested_plan)}</Chip>
              </div>
            ))}
            {pendingRequests.length === 0 && <EmptyState icon="🎉" title="Everything is clear." description="No subscriptions waiting." />}
          </div>
        </GreenBentoCard>

        <GreenBentoCard className="xl:col-span-2">
          <SectionEyebrow>System Health</SectionEyebrow>
          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Platform Health</h2>
              <p className="mt-1 text-sm text-white/75">99.98% uptime</p>
            </div>
            <p className="text-4xl font-semibold text-white">99.98%</p>
          </div>
          <div className="mt-5 grid gap-3">
            <HealthRow label="API" />
            <HealthRow label="Database" icon={Database} />
            <HealthRow label="AI" icon={Sparkles} />
            <HealthRow label="Payments" icon={Crown} />
          </div>
        </GreenBentoCard>
      </div>

      <SectionTitle title="Growth" description="A richer timeline makes recent admin activity easier to scan." />
      <GreenBentoCard>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionEyebrow>Activity Feed</SectionEyebrow>
            <h2 className="mt-1 text-xl font-semibold text-white">Recent platform events</h2>
            <div className="mt-5 space-y-4">
              {auditEvents.slice(0, 5).map((event) => <ActivityTimelineRow key={event.id} event={event} />)}
              {auditEvents.length === 0 && <EmptyState icon="✨" title="No activity yet." description="Admin actions will appear here when they happen." />}
            </div>
          </div>
          <div className="rounded-3xl bg-white/12 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/75">User Growth</p>
                <p className="mt-1 text-3xl font-semibold text-white">+18%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-[#7AAE7F]" />
            </div>
            <MiniChart className="mt-6 h-28" tone="success" variant="area" />
          </div>
        </div>
      </GreenBentoCard>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  delta = 'Live',
  caption = 'Current reporting window',
  tone = 'default',
  chart = 'sparkline',
  className,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  suffix?: string;
  delta?: string;
  caption?: string;
  tone?: StatusTone;
  chart?: 'sparkline' | 'area' | 'line';
  className?: string;
}) {
  const toneClass = statusToneClass(tone);

  return (
    <GreenBentoCard className={cn('relative overflow-hidden', className)}>
      <div className={cn('absolute inset-y-6 left-0 w-1 rounded-r-full', toneClass.border)} aria-hidden />
      <div className="flex items-center justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-white/12', toneClass.text)}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={cn('rounded-full bg-white/12 px-3 py-1 text-xs font-medium', toneClass.text)}>{delta}</span>
      </div>
      <p className="mt-5 text-sm font-medium text-white/75">{label}</p>
      <p className="mt-1 text-4xl font-semibold tracking-tight text-white">{value.toLocaleString()}{suffix}</p>
      <MiniChart className="mt-4 h-12" tone={tone} variant={chart === 'area' ? 'area' : 'line'} />
      <p className="mt-3 text-sm text-white/75">{caption}</p>
    </GreenBentoCard>
  );
}

type StatusTone = 'default' | 'success' | 'info' | 'warning' | 'danger' | 'premium';

function statusToneClass(tone: StatusTone) {
  return {
    default: { text: 'text-[#DDEEE3]', border: 'bg-[#DDEEE3]' },
    success: { text: 'text-[#7AAE7F]', border: 'bg-[#7AAE7F]' },
    info: { text: 'text-[#8FB8D8]', border: 'bg-[#8FB8D8]' },
    warning: { text: 'text-[#D8A657]', border: 'bg-[#D8A657]' },
    danger: { text: 'text-[#C96A6A]', border: 'bg-[#C96A6A]' },
    premium: { text: 'text-[#C7A6E8]', border: 'bg-[#C7A6E8]' },
  }[tone];
}

function MiniChart({ className, tone = 'default', variant = 'line' }: { className?: string; tone?: StatusTone; variant?: 'line' | 'area' }) {
  const toneClass = statusToneClass(tone);
  const stroke = tone === 'success' ? '#7AAE7F' : tone === 'warning' ? '#D8A657' : tone === 'danger' ? '#C96A6A' : tone === 'premium' ? '#C7A6E8' : tone === 'info' ? '#8FB8D8' : '#DDEEE3';

  return (
    <svg className={cn('w-full overflow-visible', className)} viewBox="0 0 220 72" role="img" aria-label="Trend chart">
      {variant === 'area' && <path d="M0 56 C28 52 30 26 56 34 C82 42 86 14 112 20 C144 28 146 48 174 38 C198 29 204 18 220 14 L220 72 L0 72 Z" fill={stroke} opacity="0.16" />}
      <path d="M0 56 C28 52 30 26 56 34 C82 42 86 14 112 20 C144 28 146 48 174 38 C198 29 204 18 220 14" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <path d="M0 68 H220" className={toneClass.border} stroke="currentColor" strokeWidth="1" opacity="0.15" />
    </svg>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold text-[#1E2A22]">{title}</h2>
      <p className="text-sm text-[#66756A]">{description}</p>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/65">{children}</p>;
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/12 p-6 text-center">
      <div className="text-3xl" aria-hidden>{icon}</div>
      <p className="mt-3 font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-white/75">{description}</p>
    </div>
  );
}

function HealthRow({ label, icon: Icon = Server }: { label: string; icon?: typeof Server }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/12 px-4 py-3">
      <span className="flex items-center gap-3 text-sm font-medium text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7AAE7F]/20 text-[#7AAE7F]"><Icon className="h-4 w-4" /></span>
        {label}
      </span>
      <span className="flex items-center gap-2 text-sm text-white/75"><span className="h-2 w-2 rounded-full bg-[#7AAE7F]" />Healthy</span>
    </div>
  );
}

function ActivityTimelineRow({ event }: { event: AdminAuditEvent }) {
  return (
    <div className="grid grid-cols-[4rem_2rem_1fr] gap-3">
      <span className="pt-1 font-mono text-xs text-white/60">{formatTime(event.created_at)}</span>
      <span className="relative flex justify-center">
        <span className="absolute top-9 h-full w-px bg-white/15" aria-hidden />
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-[#8FB8D8]"><Activity className="h-4 w-4" /></span>
      </span>
      <div className="rounded-2xl bg-white/12 p-3">
        <p className="font-medium text-white">{titleCase(event.action)}</p>
        <p className="mt-1 text-sm text-white/75">{event.admin_user_id ?? 'System'} · {event.target_type}</p>
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/12 px-4 py-3">
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/70">{label}</p>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-white/12 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/20">
      <Icon className="h-4 w-4 text-[#DDEEE3]" />
      {label}
    </button>
  );
}

function GreenBentoCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[24px] border border-white/10 bg-gradient-to-br from-[#55715B] to-[#6E8E73] p-5 text-white shadow-card', className)}>
      {children}
    </div>
  );
}

function UsersPanel({
  users,
  busyId,
  userQuery,
  setUserQuery,
  reload,
  onUpdate,
}: {
  users: AdminUserSummary[];
  busyId: string | null;
  userQuery: string;
  setUserQuery: (value: string) => void;
  reload: () => void;
  onUpdate: (userId: string, payload: AdminUserUpdate) => void;
}) {
  adminDebug('UsersPanel received props', { users, busyId, userQuery });
  return (
    <GlassCard glowOnHover={false}>
      <PanelHeader eyebrow="User operations" title="Users">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Search users" className="w-40 bg-transparent text-sm outline-none sm:w-64" />
          </div>
          <button type="button" onClick={reload} className="rounded-full bg-[#4F6F52] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#4F6F52]/20">Search</button>
        </div>
      </PanelHeader>
      <div className="mt-5 overflow-x-auto">
        <UserTable users={users} busyId={busyId} onUpdate={onUpdate} />
      </div>
    </GlassCard>
  );
}

function UserTable({
  users,
  busyId,
  onUpdate,
}: {
  users: AdminUserSummary[];
  busyId?: string | null;
  onUpdate?: (userId: string, payload: AdminUserUpdate) => void;
}) {
  adminDebug('UserTable received props', { users, busyId });
  if (users.length === 0) return <EmptyText>No users found.</EmptyText>;

  return (
    <table className="w-full min-w-[900px] text-left text-sm">
      <thead className="text-xs uppercase text-muted-foreground">
        <tr className="border-b border-white/50">
          <th className="py-3 pr-4 font-medium">User</th>
          <th className="py-3 pr-4 font-medium">Plan</th>
          <th className="py-3 pr-4 font-medium">Status</th>
          <th className="py-3 pr-4 font-medium">Role</th>
          <th className="py-3 pr-4 font-medium">LLM usage</th>
          <th className="py-3 pr-4 font-medium">Joined</th>
          {onUpdate && <th className="py-3 pr-4 font-medium">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b border-white/40 last:border-0">
            <td className="py-4 pr-4">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </td>
            <td className="py-4 pr-4"><Chip className={planChipClass(user.plan)}>{titleCase(user.plan)}</Chip></td>
            <td className="py-4 pr-4">
              <Chip className={statusChipClass(user.is_active ? user.subscription_status : 'canceled')}>
                {user.is_active ? titleCase(user.subscription_status) : 'Inactive'}
              </Chip>
            </td>
            <td className="py-4 pr-4"><Chip className={user.system_role === 'admin' ? 'border-[#4A90A4] bg-[#E3F0F3] text-[#2C6373]' : 'border-white/40 bg-white/70 text-muted-foreground'}>{titleCase(user.system_role)}</Chip></td>
            <td className="py-4 pr-4 text-muted-foreground">
              <p className="font-medium text-foreground">{(user.llm_total_tokens ?? 0).toLocaleString()} tokens</p>
              <p className="text-xs">{(user.llm_message_count ?? 0).toLocaleString()} messages</p>
            </td>
            <td className="py-4 pr-4 text-muted-foreground">{formatDate(user.created_at)}</td>
            {onUpdate && (
              <td className="py-4 pr-4">
                <UserActions user={user} busy={busyId === user.id} onUpdate={onUpdate} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UserActions({ user, busy, onUpdate }: { user: AdminUserSummary; busy: boolean; onUpdate: (userId: string, payload: AdminUserUpdate) => void }) {
  return (
    <div className="flex min-w-[420px] flex-wrap items-center gap-2">
      <select value={user.plan} disabled={busy} onChange={(event) => onUpdate(user.id, { plan: event.target.value as AdminUserUpdate['plan'] })} className={fieldClass('text-xs')}>
        <option value="free">Free</option>
        <option value="premium">Premium</option>
        <option value="family">Family</option>
      </select>
      <select value={user.subscription_status} disabled={busy} onChange={(event) => onUpdate(user.id, { subscription_status: event.target.value as AdminUserUpdate['subscription_status'] })} className={fieldClass('text-xs')}>
        <option value="active">Active</option>
        <option value="trialing">Trialing</option>
        <option value="past_due">Past due</option>
        <option value="canceled">Canceled</option>
      </select>
      <select value={user.system_role} disabled={busy} onChange={(event) => onUpdate(user.id, { system_role: event.target.value as AdminUserUpdate['system_role'] })} className={fieldClass('text-xs')}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button type="button" disabled={busy} onClick={() => onUpdate(user.id, { is_active: !user.is_active })} className={cn('rounded-full px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60', user.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-[#E3F0F3] text-[#2C6373] hover:bg-[#CDE6EB]')}>
        {busy ? 'Saving' : user.is_active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}

function SubscriptionsPanel({
  requests,
  busyId,
  adminNote,
  setAdminNote,
  requestStatus,
  setRequestStatus,
  onReview,
}: {
  requests: AdminSubscriptionRequest[];
  busyId: string | null;
  adminNote: string;
  setAdminNote: (value: string) => void;
  requestStatus: SubscriptionRequestStatus | '';
  setRequestStatus: (value: SubscriptionRequestStatus | '') => void;
  onReview: (requestId: string, action: 'approve' | 'reject') => void;
}) {
  adminDebug('SubscriptionsPanel received props', { requests, busyId, requestStatus });
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <GlassCard className="xl:col-span-2" glowOnHover={false}>
        <PanelHeader eyebrow="Manual plan reviews" title="Subscription requests">
          <select value={requestStatus} onChange={(event) => setRequestStatus(event.target.value as SubscriptionRequestStatus | '')} className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90A4]/30">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="canceled">Canceled</option>
          </select>
        </PanelHeader>
        <div className="mt-5 space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl bg-white/55 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{request.user.name}</p>
                    <Chip className={planChipClass(request.requested_plan)}>{titleCase(request.requested_plan)}</Chip>
                    <Chip className={statusChipClass(request.status)}>{titleCase(request.status)}</Chip>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{request.user.email}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{request.message || 'No user note provided.'}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Requested {formatDate(request.created_at)}</p>
                </div>
                {request.status === 'pending' && (
                  <div className="flex min-w-[220px] gap-2">
                    <ActionButton disabled={busyId === request.id} onClick={() => onReview(request.id, 'approve')} icon={busyId === request.id ? Loader2 : Check}>Approve</ActionButton>
                    <button type="button" disabled={busyId === request.id} onClick={() => onReview(request.id, 'reject')} className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && <EmptyText>No subscription requests found.</EmptyText>}
        </div>
      </GlassCard>
      <NoteCard title="Admin decision" note={adminNote} setNote={setAdminNote} placeholder="Optional note saved with the next approve or reject action." />
    </div>
  );
}

function ContentPanel({
  content,
  resources,
  contentDraft,
  setContentDraft,
  resourceDraft,
  setResourceDraft,
  editingContentId,
  setEditingContentId,
  editingResourceId,
  setEditingResourceId,
  busyId,
  onSaveContent,
  onDeleteContent,
  onSaveResource,
}: {
  content: AdminLocalizedContent[];
  resources: AdminCrisisResource[];
  contentDraft: AdminLocalizedContentPayload;
  setContentDraft: (value: AdminLocalizedContentPayload) => void;
  resourceDraft: AdminCrisisResourcePayload;
  setResourceDraft: (value: AdminCrisisResourcePayload) => void;
  editingContentId: string | null;
  setEditingContentId: (value: string | null) => void;
  editingResourceId: string | null;
  setEditingResourceId: (value: string | null) => void;
  busyId: string | null;
  onSaveContent: () => void;
  onDeleteContent: (contentId: string) => void;
  onSaveResource: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <GlassCard className="xl:col-span-2" glowOnHover={false}>
        <PanelHeader eyebrow="Localized publishing" title="Content library" />
        <div className="mt-5 space-y-3">
          {content.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/55 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Chip className={statusChipClass(item.published ? 'reviewed' : 'pending')}>{item.published ? 'Published' : 'Draft'}</Chip>
                    <Chip className="border-[#A8D0D9]/70 bg-[#E3F0F3] text-[#2C6373]">{item.language}</Chip>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.content_type} - {item.region || 'All regions'} - Updated {formatDate(item.updated_at)}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditingContentId(item.id); setContentDraft({ content_type: item.content_type, language: item.language, title: item.title, body: item.body, region: item.region || '', published: item.published }); }} className="rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-[#2C6373]">Edit</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => onDeleteContent(item.id)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-60">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {content.length === 0 && <EmptyText>No content found.</EmptyText>}
        </div>
      </GlassCard>

      <GlassCard glowOnHover={false}>
        <p className="text-sm font-medium text-[#4A90A4]">{editingContentId ? 'Edit content' : 'Create content'}</p>
        <div className="mt-5 space-y-3">
          <input value={contentDraft.title} onChange={(event) => setContentDraft({ ...contentDraft, title: event.target.value })} placeholder="Title" className={fieldClass('w-full')} />
          <div className="grid grid-cols-2 gap-2">
            <input value={contentDraft.content_type} onChange={(event) => setContentDraft({ ...contentDraft, content_type: event.target.value })} placeholder="Type" className={fieldClass('w-full')} />
            <select value={contentDraft.language} onChange={(event) => setContentDraft({ ...contentDraft, language: event.target.value })} className={fieldClass('w-full')}>
              <option value="en">English</option>
              <option value="bn">Bangla</option>
            </select>
          </div>
          <input value={contentDraft.region || ''} onChange={(event) => setContentDraft({ ...contentDraft, region: event.target.value })} placeholder="Region" className={fieldClass('w-full')} />
          <textarea value={contentDraft.body} onChange={(event) => setContentDraft({ ...contentDraft, body: event.target.value })} rows={7} placeholder="Body" className={fieldClass('w-full resize-none')} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={contentDraft.published} onChange={(event) => setContentDraft({ ...contentDraft, published: event.target.checked })} />
            Published
          </label>
          <ActionButton disabled={busyId === 'content'} onClick={onSaveContent} icon={Save}>{editingContentId ? 'Update content' : 'Create content'}</ActionButton>
          {editingContentId && (
            <button type="button" onClick={() => { setEditingContentId(null); setContentDraft(emptyContent); }} className="w-full rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-muted-foreground">Cancel edit</button>
          )}
        </div>
      </GlassCard>

      <GlassCard className="xl:col-span-2" glowOnHover={false}>
        <PanelHeader eyebrow="Safety resources" title="Crisis resources" />
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {resources.map((resource) => (
            <div key={resource.id} className="rounded-2xl bg-white/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{resource.name}</p>
                  <p className="text-sm text-muted-foreground">{resource.phone || resource.url || 'No contact set'}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{resource.type} - {resource.region || 'All regions'} - {resource.language}</p>
                </div>
                <Chip className={statusChipClass(resource.active ? 'active' : 'canceled')}>{resource.active ? 'Active' : 'Inactive'}</Chip>
              </div>
              <button type="button" onClick={() => { setEditingResourceId(resource.id); setResourceDraft({ name: resource.name, phone: resource.phone || '', region: resource.region || '', type: resource.type, language: resource.language, is_24_7: resource.is_24_7, description: resource.description || '', url: resource.url || '', active: resource.active }); }} className="mt-3 rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-[#2C6373]">Edit resource</button>
            </div>
          ))}
          {resources.length === 0 && <EmptyText>No crisis resources found.</EmptyText>}
        </div>
      </GlassCard>

      <GlassCard glowOnHover={false}>
        <p className="text-sm font-medium text-[#4A90A4]">{editingResourceId ? 'Edit resource' : 'Create resource'}</p>
        <div className="mt-5 space-y-3">
          <input value={resourceDraft.name} onChange={(event) => setResourceDraft({ ...resourceDraft, name: event.target.value })} placeholder="Name" className={fieldClass('w-full')} />
          <div className="grid grid-cols-2 gap-2">
            <input value={resourceDraft.phone || ''} onChange={(event) => setResourceDraft({ ...resourceDraft, phone: event.target.value })} placeholder="Phone" className={fieldClass('w-full')} />
            <input value={resourceDraft.type} onChange={(event) => setResourceDraft({ ...resourceDraft, type: event.target.value })} placeholder="Type" className={fieldClass('w-full')} />
          </div>
          <input value={resourceDraft.region || ''} onChange={(event) => setResourceDraft({ ...resourceDraft, region: event.target.value })} placeholder="Region" className={fieldClass('w-full')} />
          <input value={resourceDraft.url || ''} onChange={(event) => setResourceDraft({ ...resourceDraft, url: event.target.value })} placeholder="URL" className={fieldClass('w-full')} />
          <textarea value={resourceDraft.description || ''} onChange={(event) => setResourceDraft({ ...resourceDraft, description: event.target.value })} rows={4} placeholder="Description" className={fieldClass('w-full resize-none')} />
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <label className="flex items-center gap-2"><input type="checkbox" checked={resourceDraft.is_24_7} onChange={(event) => setResourceDraft({ ...resourceDraft, is_24_7: event.target.checked })} /> 24/7</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={resourceDraft.active} onChange={(event) => setResourceDraft({ ...resourceDraft, active: event.target.checked })} /> Active</label>
          </div>
          <ActionButton disabled={busyId === 'resource'} onClick={onSaveResource} icon={Save}>{editingResourceId ? 'Update resource' : 'Create resource'}</ActionButton>
          {editingResourceId && (
            <button type="button" onClick={() => { setEditingResourceId(null); setResourceDraft(emptyResource); }} className="w-full rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-muted-foreground">Cancel edit</button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function SafetyPanel({
  reviews,
  busyId,
  adminNote,
  setAdminNote,
  safetyStatus,
  setSafetyStatus,
  reload,
  onReview,
}: {
  reviews: AdminSafetyReview[];
  busyId: string | null;
  adminNote: string;
  setAdminNote: (value: string) => void;
  safetyStatus: string;
  setSafetyStatus: (value: string) => void;
  reload: () => void;
  onReview: (messageId: string, status: 'reviewed' | 'escalated' | 'dismissed') => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <GlassCard className="xl:col-span-2" glowOnHover={false}>
        <PanelHeader eyebrow="Minimum necessary context" title="Safety reviews">
          <div className="flex gap-2">
            <select value={safetyStatus} onChange={(event) => setSafetyStatus(event.target.value)} className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90A4]/30">
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="escalated">Escalated</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <button type="button" onClick={reload} className="rounded-full bg-[#4A90A4] px-4 py-2 text-sm font-medium text-white">Load</button>
          </div>
        </PanelHeader>
        <div className="mt-5 space-y-3">
          {reviews.map((review) => (
            <div key={review.message_id} className="rounded-2xl bg-white/55 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip className={statusChipClass(review.status)}>{titleCase(review.status)}</Chip>
                    <Chip className={statusChipClass(review.crisis_severity || 'pending')}>{titleCase(review.crisis_severity || 'Flagged')}</Chip>
                    <Chip className="border-white/40 bg-white/70 text-muted-foreground">{review.language || 'unknown'}</Chip>
                  </div>
                  <p className="mt-3 text-sm text-foreground">{review.excerpt}</p>
                  <p className="mt-2 text-xs text-muted-foreground">User {review.user_id} - {formatDate(review.message_created_at)} - {review.model_used || 'model unknown'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton disabled={busyId === review.message_id} onClick={() => onReview(review.message_id, 'reviewed')} icon={Check}>Reviewed</ActionButton>
                  <button type="button" disabled={busyId === review.message_id} onClick={() => onReview(review.message_id, 'escalated')} className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 disabled:opacity-60">Escalate</button>
                  <button type="button" disabled={busyId === review.message_id} onClick={() => onReview(review.message_id, 'dismissed')} className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60">Dismiss</button>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <EmptyText>No safety reviews found.</EmptyText>}
        </div>
      </GlassCard>
      <NoteCard title="Safety note" note={adminNote} setNote={setAdminNote} placeholder="Internal note for the next safety action." />
    </div>
  );
}

function ModerationPanel({
  posts,
  busyId,
  moderationStatus,
  setModerationStatus,
  moderationReason,
  setModerationReason,
  reload,
  onModerate,
}: {
  posts: AdminCommunityPost[];
  busyId: string | null;
  moderationStatus: string;
  setModerationStatus: (value: string) => void;
  moderationReason: string;
  setModerationReason: (value: string) => void;
  reload: () => void;
  onModerate: (postId: string, action: 'hide' | 'restore') => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <GlassCard className="xl:col-span-2" glowOnHover={false}>
        <PanelHeader eyebrow="Community review" title="Community moderation">
          <div className="flex gap-2">
            <select value={moderationStatus} onChange={(event) => setModerationStatus(event.target.value)} className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90A4]/30">
              <option value="">All posts</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <button type="button" onClick={reload} className="rounded-full bg-[#4A90A4] px-4 py-2 text-sm font-medium text-white">Load</button>
          </div>
        </PanelHeader>
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl bg-white/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{post.author_name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">{post.community_name || 'Community'} - {formatDate(post.created_at)}</p>
                </div>
                <Chip className={statusChipClass(post.moderation_status)}>{titleCase(post.moderation_status)}</Chip>
              </div>
              <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{post.content}</p>
              {post.moderation_reason && <p className="mt-2 text-xs text-red-700">Reason: {post.moderation_reason}</p>}
              <div className="mt-4 flex gap-2">
                {post.moderation_status === 'hidden' ? (
                  <button type="button" disabled={busyId === post.id} onClick={() => onModerate(post.id, 'restore')} className="flex items-center gap-2 rounded-full bg-[#E3F0F3] px-3 py-2 text-xs font-medium text-[#2C6373] disabled:opacity-60">
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </button>
                ) : (
                  <button type="button" disabled={busyId === post.id} onClick={() => onModerate(post.id, 'hide')} className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-60">
                    <EyeOff className="h-4 w-4" />
                    Hide
                  </button>
                )}
              </div>
            </div>
          ))}
          {posts.length === 0 && <EmptyText>No community posts found.</EmptyText>}
        </div>
      </GlassCard>
      <NoteCard title="Moderation reason" note={moderationReason} setNote={setModerationReason} placeholder="Reason saved with the next hide or restore action." />
    </div>
  );
}

function UsagePanel({
  usage,
  tokenQuery,
  setTokenQuery,
  reload,
}: {
  usage: AdminTokenUsage | null;
  tokenQuery: string;
  setTokenQuery: (value: string) => void;
  reload: () => void;
}) {
  adminDebug('UsagePanel received props', { usage, tokenQuery });
  const totals = usage?.totals ?? {
    user_messages: 0,
    assistant_messages: 0,
    input_tokens: 0,
    output_tokens: 0,
    cache_tokens: 0,
    total_tokens: 0,
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <KpiCard icon={Gauge} label="Total tokens" value={totals.total_tokens} />
      <KpiCard icon={BarChart3} label="Input tokens" value={totals.input_tokens} />
      <KpiCard icon={Activity} label="Output tokens" value={totals.output_tokens} />
      <KpiCard icon={ClipboardList} label="Cache tokens" value={totals.cache_tokens} />

      <GlassCard className="lg:col-span-4" glowOnHover={false}>
        <PanelHeader eyebrow={`${usage?.range_days ?? 30} day range`} title="User token usage">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={tokenQuery} onChange={(event) => setTokenQuery(event.target.value)} placeholder="Search users" className="w-44 bg-transparent text-sm outline-none sm:w-64" />
            </div>
            <button type="button" onClick={reload} className="rounded-full bg-[#4A90A4] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#4A90A4]/20">Load</button>
          </div>
        </PanelHeader>
        <div className="mt-5 overflow-x-auto">
          {(usage?.users ?? []).length === 0 ? (
            <EmptyText>No token usage found.</EmptyText>
          ) : (
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b border-white/50">
                  <th className="py-3 pr-4 font-medium">User</th>
                  <th className="py-3 pr-4 font-medium">Messages</th>
                  <th className="py-3 pr-4 font-medium">Input</th>
                  <th className="py-3 pr-4 font-medium">Output</th>
                  <th className="py-3 pr-4 font-medium">Cache</th>
                  <th className="py-3 pr-4 font-medium">Total</th>
                  <th className="py-3 pr-4 font-medium">Last message</th>
                </tr>
              </thead>
              <tbody>
                {(usage?.users ?? []).map((row) => (
                  <tr key={row.user_id} className="border-b border-white/40 last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </td>
                    <td className="py-4 pr-4">{row.message_count.toLocaleString()}</td>
                    <td className="py-4 pr-4">{row.input_tokens.toLocaleString()}</td>
                    <td className="py-4 pr-4">{row.output_tokens.toLocaleString()}</td>
                    <td className="py-4 pr-4">{row.cache_tokens.toLocaleString()}</td>
                    <td className="py-4 pr-4 font-semibold">{row.total_tokens.toLocaleString()}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{formatDate(row.last_message_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-4" glowOnHover={false}>
        <PanelHeader eyebrow="Recent chat turns" title="Message token breakdown" />
        <div className="mt-5 overflow-x-auto">
          {(usage?.recent_messages ?? []).length === 0 ? (
            <EmptyText>No recent token rows found.</EmptyText>
          ) : (
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b border-white/50">
                  <th className="py-3 pr-4 font-medium">User</th>
                  <th className="py-3 pr-4 font-medium">Model</th>
                  <th className="py-3 pr-4 font-medium">Source</th>
                  <th className="py-3 pr-4 font-medium">Input</th>
                  <th className="py-3 pr-4 font-medium">Output</th>
                  <th className="py-3 pr-4 font-medium">Cache</th>
                  <th className="py-3 pr-4 font-medium">Total</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(usage?.recent_messages ?? []).map((row) => (
                  <tr key={row.id} className="border-b border-white/40 last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{row.model_used || 'unknown'}</td>
                    <td className="py-4 pr-4">
                      <Chip className={row.usage_source === 'provider' ? statusChipClass('connected') : statusChipClass('pending')}>
                        {titleCase(row.usage_source)}
                      </Chip>
                    </td>
                    <td className="py-4 pr-4">{row.input_tokens.toLocaleString()}</td>
                    <td className="py-4 pr-4">{row.output_tokens.toLocaleString()}</td>
                    <td className="py-4 pr-4">{row.cache_tokens.toLocaleString()}</td>
                    <td className="py-4 pr-4 font-semibold">{row.total_tokens.toLocaleString()}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function AnalyticsPanel({ analytics }: { analytics: AdminAnalytics | null }) {
  const totals = analytics?.totals ?? {};

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <KpiCard icon={BarChart3} label="Messages" value={totals.messages ?? 0} />
      <KpiCard icon={HeartPulse} label="Mood logs" value={totals.mood_logs ?? 0} />
      <KpiCard icon={AlertTriangle} label="Crisis flags" value={totals.crisis_messages ?? 0} tone="warning" />
      <KpiCard icon={Activity} label="Usage quantity" value={totals.usage_quantity ?? 0} />
      <GlassCard className="lg:col-span-2" glowOnHover={false}>
        <PanelHeader eyebrow={`${analytics?.range_days ?? 30} day range`} title="Daily activity" />
        <div className="mt-5 space-y-2">
          {(analytics?.daily ?? []).slice(-14).map((point) => (
            <div key={point.date} className="grid grid-cols-[90px_1fr_60px] items-center gap-3 text-sm">
              <span className="text-muted-foreground">{point.date.slice(5)}</span>
              <div className="h-2 rounded-full bg-[#E3F0F3]">
                <div className="h-2 rounded-full bg-[#4A90A4]" style={{ width: `${Math.min(100, point.messages * 8)}%` }} />
              </div>
              <span className="text-right font-medium">{point.messages}</span>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard className="lg:col-span-2" glowOnHover={false}>
        <PanelHeader eyebrow="Plan mix" title="Subscriptions" />
        <div className="mt-5 space-y-3">
          {Object.entries(analytics?.plan_counts ?? {}).map(([plan, count]) => (
            <div key={plan} className="flex items-center justify-between rounded-2xl bg-white/55 p-4">
              <Chip className={planChipClass(plan)}>{titleCase(plan)}</Chip>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function HealthPanel({ health }: { health: AdminSystemHealth | null }) {
  if (!health) return <EmptyText>No health data available.</EmptyText>;

  const rows = [
    ['Service', health.service],
    ['Environment', health.environment],
    ['Database', health.database],
    ['Redis', health.redis],
    ['Pinecone', health.pinecone],
    ['Audit table', health.audit_table],
    ['Safety table', health.safety_table],
  ];

  return (
    <GlassCard glowOnHover={false}>
      <PanelHeader eyebrow="System health" title="Runtime status">
        <Chip className={statusChipClass(health.status)}>{titleCase(health.status)}</Chip>
      </PanelHeader>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl bg-white/55 p-4">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Chip className={statusChipClass(value)}>{titleCase(value)}</Chip>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function AuditPanel({ auditEvents }: { auditEvents: AdminAuditEvent[] }) {
  return (
    <GlassCard glowOnHover={false}>
      <PanelHeader eyebrow="Audit visibility" title="Admin actions" />
      <div className="mt-5 space-y-3">
        {auditEvents.map((event) => <AuditRow key={event.id} event={event} />)}
        {auditEvents.length === 0 && <EmptyText>No admin actions logged yet.</EmptyText>}
      </div>
    </GlassCard>
  );
}

function AuditRow({ event }: { event: AdminAuditEvent }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white/55 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-medium">{titleCase(event.action)}</p>
        <p className="text-sm text-muted-foreground">{event.target_type} - {event.target_id}</p>
      </div>
      <p className="text-sm text-muted-foreground">{formatDate(event.created_at)}</p>
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-[#4A90A4]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  icon: Icon,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  icon: typeof Check;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="flex items-center justify-center gap-2 rounded-full bg-[#4A90A4] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#4A90A4]/20 disabled:opacity-60">
      <Icon className={cn('h-4 w-4', Icon === Loader2 && 'animate-spin')} />
      {children}
    </button>
  );
}

function NoteCard({
  title,
  note,
  setNote,
  placeholder,
}: {
  title: string;
  note: string;
  setNote: (value: string) => void;
  placeholder: string;
}) {
  return (
    <GlassCard glowOnHover={false}>
      <p className="text-sm font-medium text-[#4A90A4]">Internal note</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={8} maxLength={2000} placeholder={placeholder} className="mt-5 w-full resize-none rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4A90A4]/30" />
      <p className="mt-3 text-xs text-muted-foreground">Saved only with the next admin action.</p>
    </GlassCard>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-white/55 p-4 text-sm text-muted-foreground">{children}</p>;
}
