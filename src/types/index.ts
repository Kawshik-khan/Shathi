// Sathi Dashboard Types

export interface User {
  name: string;
  avatar: string;
  plan: 'free' | 'premium';
}

export interface MoodData {
  day: string;
  score: number;
}

export interface MoodOverview {
  currentScore: number;
  trend: number;
  weeklyData: MoodData[];
}

export interface SleepData {
  duration: string;
  hours: number;
  minutes: number;
  quality: number;
  qualityLabel: string;
}

export interface Goal {
  id: string;
  title: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  targetDays: number;
  weeklyProgress: boolean[];
}

export interface TrainingDay {
  date: string;
  status: 'completed' | 'scheduled' | 'today' | 'none';
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: string;
}

export interface AIInsight {
  title: string;
  message: string;
  icon: string;
}

export interface CheckInMood {
  value: number;
  emoji: string;
  label: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  language?: 'en' | 'bn';
  family_id?: string | null;
  plan: 'free' | 'premium';
}

export interface UserProfile {
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

export interface UserProfileUpdate {
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: AuthUser;
}

