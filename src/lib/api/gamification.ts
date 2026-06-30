import { apiFetch } from '@/lib/api';

export interface BadgeOut {
  badge_key: string;
  earned_at: string;
}

export interface GamificationSummary {
  total_xp: number;
  level: number;
  level_name: string;
  xp_to_next: number | null;
  streak: number;
  badges: BadgeOut[];
}

export async function getGamificationSummary(): Promise<GamificationSummary> {
  return apiFetch<GamificationSummary>('/api/v1/gamification/summary');
}
