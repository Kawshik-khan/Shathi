import { create } from 'zustand';
import { apiFetch } from './api';
import {
  AuthUser,
  MoodOverview,
  SleepData,
  Goal,
  Habit,
  TrainingDay,
  JournalEntry,
  AIInsight,
  CheckInMood,
  User
} from '@/types';

interface AuthState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  refreshTimeout?: ReturnType<typeof setTimeout>;
  /**
   * Marks the user as signed in. The actual JWT rides in the HttpOnly
   * ``sathi_at`` cookie set by /api/backend-auth/login (see
   * ``src/lib/server/auth-cookies.ts``); the browser never holds the
   * value. We only persist the user object on the client for UX.
   */
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
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

/**
 * Schedule a refresh 5 minutes before the access token expires (30 minute
 * default in the FastAPI backend, mirrored in
 * ``ACCESS_TOKEN_MAX_AGE_S``). Cookies are HttpOnly; ``/api/backend-auth/refresh``
 * reads the ``sathi_rt`` cookie, exchanges it with FastAPI, and re-issues
 * fresh cookies on success. We never inspect token contents here.
 */
const REFRESH_LEAD_MS = 5 * 60 * 1000;
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

function scheduleRefresh(timeout: ReturnType<typeof setTimeout> | undefined, fn: () => void) {
  if (timeout) {
    clearTimeout(timeout);
  }
  return setTimeout(fn, REFRESH_INTERVAL_MS);
}

function persistUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('auth', JSON.stringify({ user }));
  } else {
    localStorage.removeItem('auth');
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  isAuthenticated: false,
  user: null,

  login: (user: AuthUser) => {
    const timeout = get().refreshTimeout;
    const nextTimeout = scheduleRefresh(timeout, () => {
      void useAuthStore.getState().refreshTokens();
    });
    set({
      isHydrated: true,
      isAuthenticated: true,
      user,
      refreshTimeout: nextTimeout,
    });
    persistUser(user);
  },

  logout: async () => {
    const state = get();
    if (state.refreshTimeout) {
      clearTimeout(state.refreshTimeout);
    }
    set({
      isHydrated: true,
      isAuthenticated: false,
      user: null,
      refreshTimeout: undefined,
    });
    persistUser(null);
    // Best-effort cookie clear. The browser already forgets the response
    // cookies once ``clear-cookie`` headers are processed; we trigger the
    // BFF so the backend can also drop any server-side session bookkeeping.
    try {
      await apiFetch('/api/backend-auth/logout', { method: 'POST' });
    } catch {
      /* ignore — local state is already cleared */
    }
  },

  setUser: (user: AuthUser) => {
    set({ user, isAuthenticated: true, isHydrated: true });
    persistUser(user);
    useDashboardStore.getState().setUser(user);
  },

  refreshTokens: async () => {
    try {
      await apiFetch('/api/backend-auth/refresh', { method: 'POST' });
      // New cookies are already on the response; just reschedule.
      const state = get();
      const nextTimeout = scheduleRefresh(state.refreshTimeout, () => {
        void useAuthStore.getState().refreshTokens();
      });
      set({ refreshTimeout: nextTimeout });
    } catch {
      // Refresh failed → force logout.
      await useAuthStore.getState().logout();
    }
  },
}));

// Initialize auth from localStorage. Tokens are cookie-only now (P1 1.3),
// so we only rehydrate the ``user`` shape for UX purposes.
const initAuth = () => {
  if (typeof window === 'undefined') return; // Only run on client side

  const auth = localStorage.getItem('auth');
  if (!auth) {
    useAuthStore.setState({ isHydrated: true });
    return;
  }

  try {
    const parsed = JSON.parse(auth) as { user?: AuthUser };
    if (!parsed.user) {
      throw new Error('Missing user payload');
    }
    useAuthStore.setState({
      isHydrated: true,
      isAuthenticated: true,
      user: parsed.user,
    });
    useDashboardStore.getState().setUser(parsed.user);
    const initialTimeout = scheduleRefresh(undefined, () => {
      void useAuthStore.getState().refreshTokens();
    });
    useAuthStore.setState({ refreshTimeout: initialTimeout });
  } catch {
    localStorage.removeItem('auth');
    useAuthStore.setState({
      isHydrated: true,
      isAuthenticated: false,
      user: null,
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
    set(() => {
      // TODO: Implement actual check-in saving to API (note is intentionally unused for now)
      void note;
      return { selectedMood: null };
    }),
}));

initAuth();
