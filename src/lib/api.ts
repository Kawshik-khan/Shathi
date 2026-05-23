import type { TokenResponse } from '@/types';

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  language?: 'en' | 'bn';
  family_id?: string | null;
  family_role?: 'owner' | 'member' | null;
  system_role?: 'user' | 'admin';
  plan?: 'free' | 'premium' | 'family';
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled';
  subscription_started_at?: string | null;
  subscription_ends_at?: string | null;
}

export interface SubscriptionSummary {
  plan: 'free' | 'premium' | 'family';
  effective_plan: 'free' | 'premium' | 'family';
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled';
  system_role: 'user' | 'admin';
  subscription_started_at?: string | null;
  subscription_ends_at?: string | null;
  limits: Record<string, number | boolean | null>;
  usage: Record<string, number>;
  entitlements: Record<string, boolean>;
}

export type SubscriptionRequestStatus = 'pending' | 'approved' | 'rejected' | 'canceled';

export interface SubscriptionRequest {
  id: string;
  user_id: string;
  requested_plan: 'premium' | 'family';
  status: SubscriptionRequestStatus;
  message?: string | null;
  admin_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRequestCreate {
  requested_plan: 'premium' | 'family';
  message?: string | null;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  is_active: boolean;
  system_role: 'user' | 'admin';
  plan: 'free' | 'premium' | 'family';
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled';
  subscription_started_at?: string | null;
  subscription_ends_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface AdminUserUpdate {
  is_active?: boolean;
  system_role?: 'user' | 'admin';
  plan?: 'free' | 'premium' | 'family';
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled';
  subscription_ends_at?: string | null;
}

export interface AdminAuditEvent {
  id: string;
  admin_user_id?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  event_metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminSubscriptionRequest extends SubscriptionRequest {
  user: AdminUserSummary;
}

export interface AdminCommunityPost {
  id: string;
  user_id: string;
  community_id: string;
  content: string;
  language: 'en' | 'bn' | string;
  is_anonymous: boolean;
  moderation_status: 'visible' | 'hidden' | 'reviewed' | string;
  moderation_reason?: string | null;
  hidden_at?: string | null;
  hidden_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  author_name?: string | null;
  author_email?: string | null;
  community_name?: string | null;
}

export interface AdminOverview {
  total_users: number;
  active_users: number;
  pending_subscription_requests: number;
  open_safety_reviews: number;
  crisis_messages: number;
  content_drafts: number;
  hidden_community_posts: number;
  plan_counts: Record<string, number>;
  recent_users: AdminUserSummary[];
  recent_audit_events: AdminAuditEvent[];
}

export interface AdminLocalizedContent {
  id: string;
  content_type: string;
  language: 'en' | 'bn' | string;
  title: string;
  body: string;
  region?: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLocalizedContentPayload {
  content_type: string;
  language: 'en' | 'bn' | string;
  title: string;
  body: string;
  region?: string | null;
  published: boolean;
}

export interface AdminCrisisResource {
  id: string;
  name: string;
  phone?: string | null;
  region?: string | null;
  type: string;
  language: 'en' | 'bn' | string;
  is_24_7: boolean;
  description?: string | null;
  url?: string | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AdminCrisisResourcePayload {
  name: string;
  phone?: string | null;
  region?: string | null;
  type: string;
  language: 'en' | 'bn' | string;
  is_24_7: boolean;
  description?: string | null;
  url?: string | null;
  active: boolean;
}

export interface AdminSafetyReview {
  id?: string | null;
  message_id: string;
  user_id: string;
  conversation_id: string;
  excerpt: string;
  language?: string | null;
  emotion?: string | null;
  crisis_severity?: string | null;
  model_used?: string | null;
  message_created_at: string;
  status: 'open' | 'reviewed' | 'escalated' | 'dismissed' | string;
  escalation_level?: string | null;
  admin_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface AdminAnalyticsPoint {
  date: string;
  users: number;
  mood_logs: number;
  messages: number;
  crisis_messages: number;
  usage_events: number;
}

export interface AdminAnalytics {
  range_days: number;
  totals: Record<string, number>;
  plan_counts: Record<string, number>;
  subscription_request_counts: Record<string, number>;
  safety_counts: Record<string, number>;
  daily: AdminAnalyticsPoint[];
}

export interface AdminTokenUsageTotals {
  user_messages: number;
  assistant_messages: number;
  input_tokens: number;
  output_tokens: number;
  cache_tokens: number;
  total_tokens: number;
}

export interface AdminUserTokenUsage {
  user_id: string;
  name: string;
  email: string;
  message_count: number;
  input_tokens: number;
  output_tokens: number;
  cache_tokens: number;
  total_tokens: number;
  last_message_at?: string | null;
}

export interface AdminMessageTokenUsage {
  id: string;
  user_id: string;
  name: string;
  email: string;
  conversation_id: string;
  user_message_id?: string | null;
  assistant_message_id?: string | null;
  model_used?: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_tokens: number;
  total_tokens: number;
  usage_source: 'provider' | 'estimated' | string;
  created_at: string;
}

export interface AdminTokenUsage {
  range_days: number;
  totals: AdminTokenUsageTotals;
  users: AdminUserTokenUsage[];
  recent_messages: AdminMessageTokenUsage[];
}

export interface AdminSystemHealth {
  status: string;
  service: string;
  environment: string;
  database: string;
  redis: string;
  pinecone: string;
  audit_table: string;
  safety_table: string;
}

export interface AdminUserListFilters {
  query?: string;
  plan?: 'free' | 'premium' | 'family' | '';
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | '';
  system_role?: 'user' | 'admin' | '';
  is_active?: boolean | '';
}

export interface UserProfileResponse {
  id: string;
  user_id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  language: 'en' | 'bn';
  bio?: string | null;
  timezone: string;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  wellness_goals: Record<string, unknown>;
  preferred_support_style?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface UserProfileUpdatePayload {
  name?: string;
  avatar_url?: string | null;
  language?: 'en' | 'bn';
  bio?: string | null;
  timezone?: string;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  wellness_goals?: Record<string, unknown>;
  preferred_support_style?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood: number;
  stress?: number | null;
  energy?: number | null;
  sleep?: number | null;
  note?: string | null;
  emotion_detected?: string | null;
  emotion_confidence?: number | null;
  ai_note?: string | null;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface DailyMood {
  date: string;
  avg_mood: number;
  avg_stress?: number | null;
  avg_energy?: number | null;
  avg_sleep?: number | null;
  entry_count: number;
}

export interface MoodAnalytics {
  current_streak: number;
  avg_mood_7d: number;
  avg_mood_30d: number;
  trend_direction: 'up' | 'down' | 'stable' | string;
  emotion_distribution: Record<string, number>;
  daily_data: DailyMood[];
}

export interface MoodLogCreate {
  mood: number;
  stress?: number | null;
  energy?: number | null;
  sleep?: number | null;
  note?: string;
  logged_at?: string;
}

export interface MoodReflectionCreate {
  prompt?: string | null;
  answer: string;
}

export interface MoodReflection {
  id: string;
  user_id: string;
  prompt?: string | null;
  answer: string;
  emotion_detected?: string | null;
  emotion_confidence?: number | null;
  created_at: string;
}

export interface AppActivityEventCreate {
  event_type: string;
  event_metadata?: Record<string, unknown> | null;
  occurred_at?: string;
}

export interface AppActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_metadata?: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export interface SleepTimingCreate {
  slept_at: string;
  woke_at?: string | null;
  duration_minutes?: number | null;
  quality_note?: string | null;
}

export interface SleepTiming {
  id: string;
  user_id: string;
  slept_at: string;
  woke_at?: string | null;
  duration_minutes?: number | null;
  quality_note?: string | null;
  created_at: string;
}

export interface MoodInferenceEvidence {
  category: 'text' | 'writing_style' | 'behavior' | 'sleep' | 'routine' | string;
  state: string;
  reason_bn: string;
  reason_en: string;
  weight: number;
}

export interface MoodInference {
  state: string;
  confidence: 'low' | 'medium' | 'high';
  support_tone: string;
  reason_bn: string;
  reason_en: string;
  evidence: MoodInferenceEvidence[];
  source_counts: Record<string, number>;
  days: number;
  generated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  frequency: string;
  target_count: number;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCreate {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  frequency: string;
  target_count: number;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
  count: number;
  note?: string | null;
  ai_feedback?: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title?: string | null;
  content: string;
  emotion_summary?: string | null;
  emotion_tags: string[];
  sentiment_score?: number | null;
  ai_insights?: string | null;
  word_count?: number | null;
  reading_time_minutes?: number | null;
  written_at: string;
  created_at: string;
  updated_at: string;
}

export interface JournalCreate {
  title?: string | null;
  content: string;
  written_at?: string;
}

export interface UserSettingsResponse {
  id: string;
  user_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SessionInfo {
  id: string;
  current: boolean;
  auth_model: string;
  note: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function resolveApiUrl(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const baseHasVersionedPrefix = /\/api\/v\d+$/.test(baseUrl);
  const urlHasVersionedPrefix = /^\/api\/v\d+(?:\/|$)/.test(url);

  if (urlHasVersionedPrefix) {
    return baseHasVersionedPrefix
      ? `${baseUrl.replace(/\/api\/v\d+$/, '')}${url}`
      : `${baseUrl}${url}`;
  }

  if (url.startsWith('/api/')) {
    return baseHasVersionedPrefix
      ? `${baseUrl}${url.slice('/api'.length)}`
      : `${baseUrl}/api/v1${url.slice('/api'.length)}`;
  }

  return `${baseUrl}${url}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  const authData = localStorage.getItem('auth');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed.accessToken || parsed.access_token || null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<T> {
  const fullUrl = resolveApiUrl(url);
  
  const token = getAuthToken();

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (response.ok) {
        if (response.status === 204) {
          return undefined as T;
        }

        try {
          return await response.json();
        } catch {
          throw new Error('Invalid response format from server');
        }
      }

      // For client errors (4xx), don't retry
      if (response.status >= 400 && response.status < 500) {
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.detail || errorData.message || errorMessage;
        } catch {
          // Ignore parse errors for error responses
        }

        const error: ApiError = new Error(errorMessage);
        error.status = response.status;
        error.code = response.status === 401 ? 'UNAUTHORIZED' :
                     response.status === 403 ? 'FORBIDDEN' :
                     response.status === 409 ? 'CONFLICT' :
                     response.status === 404 ? 'NOT_FOUND' : 'CLIENT_ERROR';
        throw error;
      }

      // For server errors (5xx), retry
      if (response.status >= 500) {
        const error: ApiError = new Error('Server error');
        error.status = response.status;
        error.code = 'SERVER_ERROR';
        if (attempt === maxRetries) throw error;
        lastError = error;
      }

    } catch (error) {
      if (error instanceof Error && (error as ApiError).status) {
        // Already handled client error
        throw error;
      }

      // Network error or other fetch error
      lastError = error instanceof Error ? error : new Error('Network error');

      if (attempt === maxRetries) {
        const apiError: ApiError = new Error('Network error - please check your connection');
        apiError.code = 'NETWORK_ERROR';
        throw apiError;
      }
    }

    // Exponential backoff for retries
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

async function localApiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }

  let errorMessage = 'Request failed';
  try {
    const errorData = await response.json();
    errorMessage = errorData.error?.message || errorData.detail || errorData.message || errorMessage;
  } catch {
    // Ignore parse errors for error responses.
  }

  const error: ApiError = new Error(errorMessage);
  error.status = response.status;
  error.code = response.status === 401 ? 'UNAUTHORIZED' :
               response.status === 403 ? 'FORBIDDEN' :
               response.status === 409 ? 'CONFLICT' :
               response.status === 404 ? 'NOT_FOUND' : 'CLIENT_ERROR';
  throw error;
}

export async function login(email: string, password: string) {
  return localApiFetch<TokenResponse>('/api/backend-auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name: string) {
  return localApiFetch<TokenResponse>('/api/backend-auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function logoutBackendSession() {
  return localApiFetch<{ ok: boolean }>('/api/backend-auth/logout', {
    method: 'POST',
  });
}

export async function getProfile() {
  return apiFetch<BackendUser>('/api/v1/users/me');
}

export function getSubscription() {
  return apiFetch<SubscriptionSummary>('/api/v1/users/me/subscription');
}

export function getMySubscriptionRequests() {
  return apiFetch<SubscriptionRequest[]>('/api/v1/subscription-requests/me');
}

export function createSubscriptionRequest(payload: SubscriptionRequestCreate) {
  return apiFetch<SubscriptionRequest>('/api/v1/subscription-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function queryString(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export function getAdminOverview() {
  return apiFetch<AdminOverview>('/api/v1/admin/overview');
}

export function getAdminUsers(filters: AdminUserListFilters = {}) {
  return apiFetch<AdminUserSummary[]>(
    `/api/v1/admin/users${queryString({ ...filters })}`
  );
}

export function updateAdminUser(userId: string, payload: AdminUserUpdate) {
  return apiFetch<AdminUserSummary>(`/api/v1/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getAdminSubscriptionRequests(status?: SubscriptionRequestStatus | '') {
  return apiFetch<AdminSubscriptionRequest[]>(
    `/api/v1/admin/subscription-requests${queryString({ status })}`
  );
}

export function approveAdminSubscriptionRequest(requestId: string, adminNote?: string) {
  return apiFetch<AdminSubscriptionRequest>(
    `/api/v1/admin/subscription-requests/${requestId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({ admin_note: adminNote?.trim() || null }),
    }
  );
}

export function rejectAdminSubscriptionRequest(requestId: string, adminNote?: string) {
  return apiFetch<AdminSubscriptionRequest>(
    `/api/v1/admin/subscription-requests/${requestId}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ admin_note: adminNote?.trim() || null }),
    }
  );
}

export function getAdminCommunityPosts() {
  return apiFetch<AdminCommunityPost[]>('/api/v1/admin/moderation/community-posts');
}

export function getAdminAuditEvents() {
  return apiFetch<AdminAuditEvent[]>('/api/v1/admin/audit-events');
}

export function getAdminContent(filters: {
  language?: string;
  region?: string;
  content_type?: string;
  published?: boolean | '';
} = {}) {
  return apiFetch<AdminLocalizedContent[]>(
    `/api/v1/admin/content${queryString(filters)}`
  );
}

export function createAdminContent(payload: AdminLocalizedContentPayload) {
  return apiFetch<AdminLocalizedContent>('/api/v1/admin/content', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminContent(contentId: string, payload: Partial<AdminLocalizedContentPayload>) {
  return apiFetch<AdminLocalizedContent>(`/api/v1/admin/content/${contentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminContent(contentId: string) {
  return apiFetch<void>(`/api/v1/admin/content/${contentId}`, {
    method: 'DELETE',
  });
}

export function getAdminCrisisResources(active?: boolean | '') {
  return apiFetch<AdminCrisisResource[]>(
    `/api/v1/admin/crisis-resources${queryString({ active })}`
  );
}

export function createAdminCrisisResource(payload: AdminCrisisResourcePayload) {
  return apiFetch<AdminCrisisResource>('/api/v1/admin/crisis-resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminCrisisResource(resourceId: string, payload: Partial<AdminCrisisResourcePayload>) {
  return apiFetch<AdminCrisisResource>(`/api/v1/admin/crisis-resources/${resourceId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getAdminSafetyReviews(status?: string | '') {
  return apiFetch<AdminSafetyReview[]>(
    `/api/v1/admin/safety-reviews${queryString({ status })}`
  );
}

export function reviewAdminSafetyMessage(
  messageId: string,
  payload: { status: string; escalation_level?: string | null; admin_note?: string | null }
) {
  return apiFetch<AdminSafetyReview>(`/api/v1/admin/safety-reviews/${messageId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function hideAdminCommunityPost(postId: string, reason?: string) {
  return apiFetch<AdminCommunityPost>(`/api/v1/admin/moderation/community-posts/${postId}/hide`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason?.trim() || null }),
  });
}

export function restoreAdminCommunityPost(postId: string, reason?: string) {
  return apiFetch<AdminCommunityPost>(`/api/v1/admin/moderation/community-posts/${postId}/restore`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason?.trim() || null }),
  });
}

export function getAdminAnalytics(range = 30) {
  return apiFetch<AdminAnalytics>(`/api/v1/admin/analytics?range=${range}`);
}

export function getAdminTokenUsage(filters: {
  range?: number;
  query?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return apiFetch<AdminTokenUsage>(
    `/api/v1/admin/token-usage${queryString({
      range: filters.range ?? 30,
      query: filters.query,
      limit: filters.limit,
      offset: filters.offset,
    })}`
  );
}

export function getAdminSystemHealth() {
  return apiFetch<AdminSystemHealth>('/api/v1/admin/system-health');
}

export function getUserProfile() {
  return apiFetch<UserProfileResponse>('/api/v1/users/me/profile');
}

export function updateUserProfile(payload: UserProfileUpdatePayload) {
  return apiFetch<UserProfileResponse>('/api/v1/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getUserSettings() {
  return apiFetch<UserSettingsResponse>('/api/v1/users/me/settings');
}

export function updateUserSettings(settings: Record<string, unknown>) {
  return apiFetch<UserSettingsResponse>('/api/v1/users/me/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

export async function exportUserData() {
  const token = getAuthToken();
  const response = await fetch(resolveApiUrl('/api/v1/users/me/export'), {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Unable to export data');
  }

  return response.blob();
}

export function updatePassword(currentPassword: string, newPassword: string) {
  return apiFetch<{ message: string }>('/api/v1/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export function getSessions() {
  return apiFetch<SessionInfo[]>('/api/v1/users/me/sessions');
}

export function deleteAccount(confirmation: string, password?: string) {
  return apiFetch<void>('/api/v1/users/me', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation, password }),
  });
}

export function getMoodLogs(limit = 30, offset = 0) {
  return apiFetch<MoodLog[]>(`/api/v1/mood/logs?limit=${limit}&offset=${offset}`);
}

export function getMoodAnalytics(days = 30) {
  return apiFetch<MoodAnalytics>(`/api/v1/mood/analytics?days=${days}`);
}

export function createMoodLog(data: MoodLogCreate) {
  return apiFetch<MoodLog>('/api/v1/mood/log', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMoodInference(days = 14) {
  return apiFetch<MoodInference>(`/api/v1/mood/inference?days=${days}`);
}

export function createMoodReflection(data: MoodReflectionCreate) {
  return apiFetch<MoodReflection>('/api/v1/mood/reflections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createActivityEvent(data: AppActivityEventCreate) {
  return apiFetch<AppActivityEvent>('/api/v1/mood/activity', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createSleepTiming(data: SleepTimingCreate) {
  return apiFetch<SleepTiming>('/api/v1/mood/sleep', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getHabits(activeOnly = true) {
  return apiFetch<Habit[]>(`/api/v1/habits/?active_only=${activeOnly}`);
}

export function createHabit(data: HabitCreate) {
  return apiFetch<Habit>('/api/v1/habits/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateHabit(id: string, data: Partial<HabitCreate>) {
  return apiFetch<Habit>(`/api/v1/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteHabit(id: string) {
  return apiFetch<void>(`/api/v1/habits/${id}`, {
    method: 'DELETE',
  });
}

export function completeHabit(id: string, completedAt = new Date()) {
  return apiFetch<HabitCompletion>(`/api/v1/habits/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      completed_at: completedAt.toISOString().slice(0, 10),
      count: 1,
    }),
  });
}

export function getJournalEntries(limit = 20, offset = 0) {
  return apiFetch<JournalEntry[]>(`/api/v1/journal/entries?limit=${limit}&offset=${offset}`);
}

export function createJournalEntry(data: JournalCreate) {
  return apiFetch<JournalEntry>('/api/v1/journal/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateJournalEntry(id: string, data: Partial<JournalCreate>) {
  return apiFetch<JournalEntry>(`/api/v1/journal/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteJournalEntry(id: string) {
  return apiFetch<void>(`/api/v1/journal/entries/${id}`, {
    method: 'DELETE',
  });
}

export interface ChatStreamEvent {
  type: 'meta' | 'chunk' | 'replace' | 'done' | 'error';
  chunk?: string;
  content?: string;
  message?: string;
  conversation_id?: string;
  message_id?: string;
  user_message_id?: string;
  crisis_flag?: boolean;
  model_used?: string;
  language?: 'en' | 'bn';
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  emotion?: string | null;
  emotion_confidence?: number | null;
  model_used?: string | null;
  token_count?: number | null;
  crisis_flag: boolean;
  crisis_severity?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title?: string | null;
  language: 'en' | 'bn';
  summary?: string | null;
  emotion_context?: string | null;
  created_at: string;
  updated_at?: string | null;
  messages?: ChatMessage[];
}

export function getChatConversations(limit = 50, offset = 0) {
  return apiFetch<ChatConversation[]>(`/api/v1/chat/conversations?limit=${limit}&offset=${offset}`);
}

export function getChatConversation(conversationId: string) {
  return apiFetch<ChatConversation>(`/api/v1/chat/conversations/${conversationId}`);
}

export function createChatConversation(title = 'New Chat', language: 'en' | 'bn' = 'bn') {
  const params = new URLSearchParams({ title, language });
  return apiFetch<ChatConversation>(`/api/v1/chat/conversations?${params.toString()}`, {
    method: 'POST',
  });
}

export function deleteChatConversation(conversationId: string) {
  return apiFetch<void>(`/api/v1/chat/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}

export async function streamChatMessage(
  payload: {
    message: string;
    conversation_id?: string | null;
    model?: string;
    language?: 'en' | 'bn';
  },
  onEvent: (event: ChatStreamEvent) => void,
  options: { signal?: AbortSignal } = {}
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Please log in again to use chat.');
  }

  const response = await fetch(resolveApiUrl('/api/v1/chat/stream'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    let errorMessage = 'Unable to stream chat response';

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.detail || errorData.message || errorMessage;
    } catch {
      // Keep the generic stream error when the backend does not return JSON.
    }

    throw new Error(errorMessage);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const line = event.split('\n').find((entry) => entry.startsWith('data: '));
      if (!line) continue;

      const data = JSON.parse(line.slice(6)) as ChatStreamEvent;
      onEvent(data);
    }
  }
}


