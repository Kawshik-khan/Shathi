/**
 * Navigation configuration for the dashboard shell.
 *
 * Single source of truth for nav items used by:
 *   - Sidebar (desktop)
 *   - MobileSidebar (drawer)
 *   - MobileBottomNav (tab bar)
 *
 * Components map over the relevant list; admin tabs are intentionally
 * separate so the admin shell doesn't render user nav items by accident.
 *
 * Adding a new page:
 *   1. Add a `NavItem` entry here with a stable `key`, href, lucide icon.
 *   2. Add the translation key to i18n `navigation.<key>` (en + bn).
 *   3. If the page should appear in the bottom-nav tab bar, also add
 *      it to `mobileTabHrefs` below — the bottom nav is intentionally
 *      sparser (5 entries) because mobile screen real estate is limited.
 *
 * Adding a feature dot/badge (e.g. "new AI companion" pulse):
 *   - Set `badge: true` on the entry.
 */
import {
  LayoutDashboard,
  Sparkles,
  Smile,
  BookHeart,
  CheckCircle2,
  Moon,
  BarChart3,
  Library,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavKey =
  | 'dashboard'
  | 'aiCompanion'
  | 'mood'
  | 'journal'
  | 'habits'
  | 'sleep'
  | 'insights'
  | 'resources'
  | 'settings';

export interface NavItem {
  /** Stable identifier — also i18n key (`navigation.<key>`). */
  key: NavKey;
  /** Path the link navigates to. */
  href: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** Optional override label (otherwise read from i18n at render time). */
  label?: string;
  /** Show a small pulsing dot (used for "new" features). */
  badge?: boolean;
}

export const userNavigation: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'aiCompanion', href: '/ai-companion', icon: Sparkles, badge: true },
  { key: 'mood', href: '/mood', icon: Smile },
  { key: 'journal', href: '/journal', icon: BookHeart },
  { key: 'habits', href: '/habits', icon: CheckCircle2 },
  { key: 'sleep', href: '/sleep', icon: Moon },
  { key: 'insights', href: '/insights', icon: BarChart3 },
  { key: 'resources', href: '/resources', icon: Library },
  { key: 'settings', href: '/settings', icon: Settings },
];

/**
 * Mobile bottom-nav order (5 entries; FAB takes the center slot).
 * The first two go to the left of the FAB, the last two go to the right.
 * Order matters — re-order this list to re-order the bottom tabs.
 */
export const mobileBottomNavOrder: NavKey[] = [
  'dashboard',
  'aiCompanion',
  'journal',
  'insights',
  'settings',
];

/**
 * The center FAB href — currently the daily mood check-in.
 * Kept separate from `mobileBottomNavOrder` because the FAB is a
 * primary action, not a navigation tab.
 */
export const mobileFabHref = '/mood';
export const mobileFabIcon: LucideIcon = Sparkles;