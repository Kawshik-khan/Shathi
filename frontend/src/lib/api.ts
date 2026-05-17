/** API client for Sathi backend */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Type definitions
interface ApiResponse<T> {
  data: T;
  status: number;
}

interface ApiError {
  detail: string;
  status_code: number;
}

// Generic fetch wrapper
async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Add auth token if available
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  
  if (response.status === 204) {
    return null as T;
  }
  
  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return apiClient<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  
  register: async (email: string, password: string, name: string) => {
    return apiClient<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  },
  
  refresh: async (refreshToken: string) => {
    return apiClient<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message: string, conversationId?: string, model: "gpt-4" | "llama-3" = "gpt-4") => {
    return apiClient<{
      response: string;
      conversation_id: string;
      message_id: string;
      emotion_detected?: string;
      crisis_flag: boolean;
      model_used: string;
    }>("/chat/send", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId, model }),
    });
  },
  
  getConversations: async () => {
    return apiClient<Array<{
      id: string;
      title?: string;
      created_at: string;
      updated_at: string;
    }>>("/chat/conversations");
  },
  
  getConversation: async (conversationId: string) => {
    return apiClient<{
      id: string;
      title?: string;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        emotion?: string;
        created_at: string;
      }>;
    }>(`/chat/conversations/${conversationId}`);
  },
};

// Mood API
export const moodApi = {
  createLog: async (data: {
    mood: number;
    stress?: number;
    energy?: number;
    sleep?: number;
    note?: string;
  }) => {
    return apiClient<{
      id: string;
      user_id: string;
      mood: number;
      stress?: number;
      energy?: number;
      sleep?: number;
      note?: string;
      emotion_detected?: string;
      created_at: string;
    }>("/mood/log", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  
  getLogs: async (limit = 30) => {
    return apiClient<Array<{
      id: string;
      mood: number;
      stress?: number;
      energy?: number;
      sleep?: number;
      note?: string;
      created_at: string;
    }>>(`/mood/logs?limit=${limit}`);
  },
  
  getAnalytics: async (days = 30) => {
    return apiClient<{
      current_streak: number;
      avg_mood_7d: number;
      avg_mood_30d: number;
      trend_direction: string;
      emotion_distribution: Record<string, number>;
      daily_data: Array<{
        date: string;
        avg_mood: number;
      }>;
    }>(`/mood/analytics?days=${days}`);
  },
};

// Journal API
export const journalApi = {
  createEntry: async (data: { title?: string; content: string }) => {
    return apiClient<{
      id: string;
      title?: string;
      content: string;
      emotion_summary?: string;
      sentiment_score?: number;
      created_at: string;
    }>("/journal/entries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  
  getEntries: async (limit = 20, offset = 0) => {
    return apiClient<Array<{
      id: string;
      title?: string;
      content: string;
      created_at: string;
    }>>(`/journal/entries?limit=${limit}&offset=${offset}`);
  },
  
  getEntry: async (entryId: string) => {
    return apiClient<{
      id: string;
      title?: string;
      content: string;
      emotion_summary?: string;
      sentiment_score?: number;
      created_at: string;
    }>(`/journal/entries/${entryId}`);
  },
  
  updateEntry: async (entryId: string, data: { title?: string; content?: string }) => {
    return apiClient<{
      id: string;
      title?: string;
      content: string;
    }>(`/journal/entries/${entryId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  
  deleteEntry: async (entryId: string) => {
    return apiClient<null>(`/journal/entries/${entryId}`, {
      method: "DELETE",
    });
  },
};

// Habit API
export const habitApi = {
  createHabit: async (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    frequency?: string;
    target_count?: number;
  }) => {
    return apiClient<{
      id: string;
      name: string;
      current_streak: number;
      longest_streak: number;
      is_active: boolean;
    }>("/habits/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  
  getHabits: async () => {
    return apiClient<Array<{
      id: string;
      name: string;
      description?: string;
      current_streak: number;
      longest_streak: number;
      total_completions: number;
      is_active: boolean;
    }>>("/habits/");
  },
  
  completeHabit: async (habitId: string, count = 1, note?: string) => {
    return apiClient<{
      id: string;
      completed_at: string;
      count: number;
    }>(`/habits/${habitId}/complete`, {
      method: "POST",
      body: JSON.stringify({ count, note }),
    });
  },
};

// User API
export const userApi = {
  getProfile: async () => {
    return apiClient<{
      id: string;
      email: string;
      name: string;
      avatar_url?: string;
      created_at: string;
    }>("/users/me");
  },
  
  updateProfile: async (data: { name?: string; avatar_url?: string }) => {
    return apiClient<{
      id: string;
      name: string;
      avatar_url?: string;
    }>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

export default {
  auth: authApi,
  chat: chatApi,
  mood: moodApi,
  journal: journalApi,
  habits: habitApi,
  user: userApi,
};

