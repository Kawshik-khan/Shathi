'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  adminNavigationItems,
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
  EyeOff,
  FileText,
  HeartPulse,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

const tabs = adminNavigationItems;

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

function planChipClass(plan: string) {
  if (plan === 'family') return 'bg-[#DCFCE7] text-[#166534] border-[#A7F3A0]/70';
  if (plan === 'premium') return 'bg-[#22C55E] text-white border-[#22C55E]';
  return 'bg-white/70 text-muted-foreground border-white/40';
}

function statusChipClass(status: string) {
  if (['pending', 'open', 'escalated'].includes(status)) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (['approved', 'active', 'trialing', 'visible', 'reviewed', 'healthy', 'connected'].includes(status)) {
    return 'bg-[#DCFCE7] text-[#166534] border-[#A7F3A0]/70';
  }
  if (['rejected', 'canceled', 'hidden', 'dismissed', 'degraded', 'unavailable'].includes(status)) {
    return 'bg-red-50 text-red-700 border-red-200';
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
    'rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30',
    extra,
  );
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
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userQuery, setUserQuery] = useState('');
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
      getAdminSystemHealth(),
    ]);
  }, [requestStatus, safetyStatus, userQuery]);

  const applyAdminData = useCallback((
    data: Awaited<ReturnType<typeof fetchAdminData>>,
  ) => {
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
      healthResponse,
    ] = data;
    setOverview(overviewResponse);
    setUsers(usersResponse);
    setRequests(requestResponse);
    setPosts(
      moderationStatus
        ? postResponse.filter((post) => post.moderation_status === moderationStatus)
        : postResponse,
    );
    setAuditEvents(auditResponse);
    setContent(contentResponse);
    setResources(resourceResponse);
    setSafetyReviews(safetyResponse);
    setAnalytics(analyticsResponse);
    setHealth(healthResponse);
  }, [moderationStatus]);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      applyAdminData(await fetchAdminData());
    } catch (err) {
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
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] shadow-lg shadow-green-500/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Admin workspace</h1>
            <p className="text-sm text-muted-foreground">
              Full platform operations, safety, content, analytics, and health.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabChange(item.key)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  tab === item.key
                    ? 'bg-[#22C55E] text-white shadow-lg shadow-green-500/20'
                    : 'bg-white/60 text-muted-foreground hover:bg-[#DCFCE7] hover:text-[#166534]',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
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
  const premiumUsers = overview?.plan_counts.premium ?? 0;
  const familyUsers = overview?.plan_counts.family ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <KpiCard icon={Users} label="Total users" value={overview?.total_users ?? 0} />
      <KpiCard icon={Activity} label="Active users" value={overview?.active_users ?? 0} />
      <KpiCard icon={Crown} label="Premium users" value={premiumUsers + familyUsers} />
      <KpiCard icon={AlertTriangle} label="Open safety" value={overview?.open_safety_reviews ?? 0} tone="warning" />
      <KpiCard icon={FileText} label="Content drafts" value={overview?.content_drafts ?? 0} />
      <KpiCard icon={EyeOff} label="Hidden posts" value={overview?.hidden_community_posts ?? 0} tone="danger" />
      <KpiCard icon={HeartPulse} label="Crisis flags" value={overview?.crisis_messages ?? 0} tone="warning" />
      <KpiCard icon={ClipboardList} label="Plan requests" value={overview?.pending_subscription_requests ?? 0} />

      <GlassCard className="lg:col-span-2" glowOnHover={false}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#22C55E]">Review queue</p>
            <h2 className="mt-1 text-xl font-semibold">Pending subscriptions</h2>
          </div>
          <Chip className={statusChipClass('pending')}>{pendingRequests.length} pending</Chip>
        </div>
        <div className="mt-5 space-y-3">
          {pendingRequests.slice(0, 4).map((request) => (
            <div key={request.id} className="flex items-center justify-between rounded-2xl bg-white/55 p-4">
              <div>
                <p className="font-medium">{request.user.name}</p>
                <p className="text-sm text-muted-foreground">{request.user.email}</p>
              </div>
              <Chip className={planChipClass(request.requested_plan)}>{titleCase(request.requested_plan)}</Chip>
            </div>
          ))}
          {pendingRequests.length === 0 && <EmptyText>No pending requests.</EmptyText>}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-2" glowOnHover={false}>
        <p className="text-sm font-medium text-[#22C55E]">Recent activity</p>
        <h2 className="mt-1 text-xl font-semibold">Audit trail</h2>
        <div className="mt-5 space-y-3">
          {auditEvents.slice(0, 5).map((event) => <AuditRow key={event.id} event={event} />)}
          {auditEvents.length === 0 && <EmptyText>No admin actions logged yet.</EmptyText>}
        </div>
      </GlassCard>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const iconClass = tone === 'danger' ? 'bg-red-50 text-red-600' : tone === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-[#DCFCE7] text-[#22C55E]';

  return (
    <GlassCard glowOnHover={false}>
      <div className="flex items-center justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-muted-foreground">Live</span>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value.toLocaleString()}</p>
    </GlassCard>
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
  return (
    <GlassCard glowOnHover={false}>
      <PanelHeader eyebrow="User operations" title="Users">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Search users" className="w-40 bg-transparent text-sm outline-none sm:w-64" />
          </div>
          <button type="button" onClick={reload} className="rounded-full bg-[#22C55E] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-green-500/20">Search</button>
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
  if (users.length === 0) return <EmptyText>No users found.</EmptyText>;

  return (
    <table className="w-full min-w-[900px] text-left text-sm">
      <thead className="text-xs uppercase text-muted-foreground">
        <tr className="border-b border-white/50">
          <th className="py-3 pr-4 font-medium">User</th>
          <th className="py-3 pr-4 font-medium">Plan</th>
          <th className="py-3 pr-4 font-medium">Status</th>
          <th className="py-3 pr-4 font-medium">Role</th>
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
            <td className="py-4 pr-4"><Chip className={user.system_role === 'admin' ? 'border-[#22C55E] bg-[#DCFCE7] text-[#166534]' : 'border-white/40 bg-white/70 text-muted-foreground'}>{titleCase(user.system_role)}</Chip></td>
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
      <button type="button" disabled={busy} onClick={() => onUpdate(user.id, { is_active: !user.is_active })} className={cn('rounded-full px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60', user.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]')}>
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
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <GlassCard className="xl:col-span-2" glowOnHover={false}>
        <PanelHeader eyebrow="Manual plan reviews" title="Subscription requests">
          <select value={requestStatus} onChange={(event) => setRequestStatus(event.target.value as SubscriptionRequestStatus | '')} className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30">
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
                    <Chip className="border-[#A7F3A0]/70 bg-[#DCFCE7] text-[#166534]">{item.language}</Chip>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.content_type} - {item.region || 'All regions'} - Updated {formatDate(item.updated_at)}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditingContentId(item.id); setContentDraft({ content_type: item.content_type, language: item.language, title: item.title, body: item.body, region: item.region || '', published: item.published }); }} className="rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-[#166534]">Edit</button>
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
        <p className="text-sm font-medium text-[#22C55E]">{editingContentId ? 'Edit content' : 'Create content'}</p>
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
              <button type="button" onClick={() => { setEditingResourceId(resource.id); setResourceDraft({ name: resource.name, phone: resource.phone || '', region: resource.region || '', type: resource.type, language: resource.language, is_24_7: resource.is_24_7, description: resource.description || '', url: resource.url || '', active: resource.active }); }} className="mt-3 rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-[#166534]">Edit resource</button>
            </div>
          ))}
          {resources.length === 0 && <EmptyText>No crisis resources found.</EmptyText>}
        </div>
      </GlassCard>

      <GlassCard glowOnHover={false}>
        <p className="text-sm font-medium text-[#22C55E]">{editingResourceId ? 'Edit resource' : 'Create resource'}</p>
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
            <select value={safetyStatus} onChange={(event) => setSafetyStatus(event.target.value)} className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30">
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="escalated">Escalated</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <button type="button" onClick={reload} className="rounded-full bg-[#22C55E] px-4 py-2 text-sm font-medium text-white">Load</button>
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
            <select value={moderationStatus} onChange={(event) => setModerationStatus(event.target.value)} className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30">
              <option value="">All posts</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <button type="button" onClick={reload} className="rounded-full bg-[#22C55E] px-4 py-2 text-sm font-medium text-white">Load</button>
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
                  <button type="button" disabled={busyId === post.id} onClick={() => onModerate(post.id, 'restore')} className="flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3 py-2 text-xs font-medium text-[#166534] disabled:opacity-60">
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
              <div className="h-2 rounded-full bg-[#DCFCE7]">
                <div className="h-2 rounded-full bg-[#22C55E]" style={{ width: `${Math.min(100, point.messages * 8)}%` }} />
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
        <p className="text-sm font-medium text-[#22C55E]">{eyebrow}</p>
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
    <button type="button" disabled={disabled} onClick={onClick} className="flex items-center justify-center gap-2 rounded-full bg-[#22C55E] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-green-500/20 disabled:opacity-60">
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
      <p className="text-sm font-medium text-[#22C55E]">Internal note</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={8} maxLength={2000} placeholder={placeholder} className="mt-5 w-full resize-none rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30" />
      <p className="mt-3 text-xs text-muted-foreground">Saved only with the next admin action.</p>
    </GlassCard>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-white/55 p-4 text-sm text-muted-foreground">{children}</p>;
}
