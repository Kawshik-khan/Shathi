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

export async function login(email: string, password: string) {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name: string) {
  return apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
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


