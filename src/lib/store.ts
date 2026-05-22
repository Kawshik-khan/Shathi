import { create } from 'zustand';
import { apiFetch, logoutBackendSession } from './api';
import {
  User,
  AuthUser,
  TokenResponse,
  MoodOverview,
  SleepData,
  Goal,
  Habit,
  TrainingDay,
  JournalEntry,
  AIInsight,
  CheckInMood
} from '@/types';

interface AuthState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  refreshTimeout?: NodeJS.Timeout;
  login: (user: AuthUser, tokens: TokenResponse) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  updateTokens: (tokens: TokenResponse) => void;
  refreshTokens: () => Promise<void>;
}

interface DashboardState {
  // User
  user: User;

  // Actions
  setUser: (user: AuthUser) => void;

  // Mood
  moodOverview: MoodOverview;
  
  // Sleep
  sleepData: SleepData;
  
  // Goals
  goals: Goal[];
  
  // Habits
  habits: Habit[];
  
  // Calendar
  trainingDays: TrainingDay[];
  
  // Journal
  latestEntry: JournalEntry;
  
  // AI Insight
  aiInsight: AIInsight;
  
  // Check-in
  checkInMoods: CheckInMood[];
  selectedMood: number | null;
  
  // Actions
  toggleGoal: (id: string) => void;
  setSelectedMood: (mood: number) => void;
  saveCheckIn: (note: string) => void;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;

  document.cookie = 'sathi_auth=; Path=/; Max-Age=0; SameSite=Lax';
}

function clearServerAuthCookie() {
  if (typeof window === 'undefined') return;
  void logoutBackendSession().catch(() => {
    // Local auth state is still cleared even if the marker cookie clear fails.
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  isHydrated: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  login: (user: AuthUser, tokens: TokenResponse) => {
    set((state) => {
      // Clear any existing timeout
      if (state.refreshTimeout) {
        clearTimeout(state.refreshTimeout);
      }

      // Schedule refresh
      const timeout = setTimeout(() => {
        state.refreshTokens();
      }, (tokens.expires_in - 300) * 1000); // 5 minutes before expiry

      return {
        isHydrated: true,
        isAuthenticated: true,
        user,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        refreshTimeout: timeout,
      };
    });

    // Persist to localStorage
    localStorage.setItem('auth', JSON.stringify({ user, ...tokens }));
  },

  logout: () => {
    set((state) => {
      if (state.refreshTimeout) {
        clearTimeout(state.refreshTimeout);
      }
      return {
        isHydrated: true,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        refreshTimeout: undefined,
      };
    });
    localStorage.removeItem('auth');
    clearAuthCookie();
    clearServerAuthCookie();
  },

  setUser: (user: AuthUser) => {
    set({ user, isAuthenticated: true, isHydrated: true });

    const auth = localStorage.getItem('auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      localStorage.setItem('auth', JSON.stringify({ ...parsed, user }));
    }

    useDashboardStore.getState().setUser(user);
  },

  updateTokens: (tokens: TokenResponse) => {
    set((state) => {
      // Clear existing timeout
      if (state.refreshTimeout) {
        clearTimeout(state.refreshTimeout);
      }

      // Schedule new refresh
      const timeout = setTimeout(() => {
        state.refreshTokens();
      }, (tokens.expires_in - 300) * 1000); // 5 minutes before expiry

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        refreshTimeout: timeout,
      };
    });

    const auth = localStorage.getItem('auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      localStorage.setItem('auth', JSON.stringify({ ...parsed, ...tokens }));
    }
  },

  refreshTokens: async () => {
    const state = get();
    if (!state.refreshToken) return;

    try {
      const tokens: TokenResponse = await apiFetch('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: state.refreshToken }),
      });

      state.updateTokens(tokens);
      if (tokens.user) {
        useDashboardStore.getState().setUser(tokens.user);
      }
    } catch (error) {
      // On refresh failure, logout
      state.logout();
    }
  },
}));

// Initialize auth from localStorage
const initAuth = () => {
  if (typeof window === 'undefined') return; // Only run on client side

  const auth = localStorage.getItem('auth');
  if (!auth) {
    clearAuthCookie();
    useAuthStore.setState({ isHydrated: true });
    return;
  }

  try {
    const { user, access_token, refresh_token } = JSON.parse(auth);

    if (!user || !access_token || !refresh_token) {
      throw new Error('Invalid stored auth payload');
    }

    useAuthStore.getState().login(user, { access_token, refresh_token, token_type: 'bearer', expires_in: 1800 });
    useDashboardStore.getState().setUser(user);
  } catch (e) {
    localStorage.removeItem('auth');
    clearAuthCookie();
    useAuthStore.setState({
      isHydrated: true,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  }
};

// Mock data
const mockUser: User = {
  name: 'Amanda',
  avatar: '/avatar.jpg',
  plan: 'premium',
};

const mockMoodOverview: MoodOverview = {
  currentScore: 7.2,
  trend: 12,
  weeklyData: [
    { day: 'M', score: 6.5 },
    { day: 'T', score: 7.0 },
    { day: 'W', score: 7.5 },
    { day: 'T', score: 7.2 },
    { day: 'F', score: 6.8 },
    { day: 'S', score: 7.8 },
    { day: 'S', score: 7.2 },
  ],
};

const mockSleepData: SleepData = {
  duration: '7h 24m',
  hours: 7,
  minutes: 24,
  quality: 85,
  qualityLabel: 'Good',
};

const mockGoals: Goal[] = [
  { id: '1', title: 'Drink 8 glasses of water', completed: true },
  { id: '2', title: '30 min workout', completed: true },
  { id: '3', title: 'Meditate for 10 min', completed: true },
  { id: '4', title: 'Eat a healthy meal', completed: false },
  { id: '5', title: 'Write in journal', completed: false },
];

const mockHabits: Habit[] = [
  { id: '1', name: 'Meditation', icon: 'meditation', streak: 4, targetDays: 7, weeklyProgress: [true, true, true, true, false, false, false] },
  { id: '2', name: 'Workout', icon: 'workout', streak: 5, targetDays: 7, weeklyProgress: [true, true, true, true, true, false, false] },
  { id: '3', name: 'Water Intake', icon: 'water', streak: 6, targetDays: 7, weeklyProgress: [true, true, true, true, true, true, false] },
  { id: '4', name: 'Sleep before 11pm', icon: 'sleep', streak: 4, targetDays: 7, weeklyProgress: [true, true, false, true, false, false, false] },
];

const mockLatestEntry: JournalEntry = {
  id: '1',
  title: 'A good day!',
  content: 'I felt more focused and productive today. Grateful for the small wins.',
  date: 'Jun 4, 2024 • 8:30 PM',
  mood: 'happy',
};

const mockAIInsight: AIInsight = {
  title: "You've been consistent with your workouts!",
  message: "Keep it up! Regular exercise is boosting your mood and energy levels.",
  icon: 'trophy',
};

const mockCheckInMoods: CheckInMood[] = [
  { value: 1, emoji: '😠', label: 'Angry' },
  { value: 2, emoji: '😞', label: 'Sad' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Happy' },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  user: mockUser,

  setUser: (user: AuthUser) => {
    set({
      user: {
        name: user.name,
        avatar: user.avatar_url || '/avatar.jpg',
        plan: user.plan,
      },
    });
  },
  moodOverview: mockMoodOverview,
  sleepData: mockSleepData,
  goals: mockGoals,
  habits: mockHabits,
  trainingDays: [],
  latestEntry: mockLatestEntry,
  aiInsight: mockAIInsight,
  checkInMoods: mockCheckInMoods,
  selectedMood: null,

  toggleGoal: (id: string) =>
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      ),
    })),

  setSelectedMood: (mood: number) =>
    set({ selectedMood: mood }),

  saveCheckIn: (note: string) =>
    set((state) => {
      // TODO: Implement actual check-in saving to API
      return { selectedMood: null };
    }),
}));

function get() {
  // Return the current auth store state. This mirrors zustand's `get` provided
  // to store initializer functions so code elsewhere can call `get()`.
  return useAuthStore.getState();
}

initAuth();
