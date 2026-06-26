'use client';

import { usePathname } from 'next/navigation';

const TAB_ROOTS = new Set([
  '/dashboard',
  '/ai-companion',
  '/journal',
  '/insights',
  '/profile',
  '/mood',
]);

/**
 * MobileTopBar previously rendered a fixed top header (back button / logo /
 * page title) plus a 14pt spacer. Per audit, that header was removed entirely
 * on mobile: the page title is no longer surfaced at the top, back navigation
 * is the OS/browser back gesture, and the spacer is gone so the dashboard's
 * own `pt-*` padding is the only top spacing.
 *
 * Component kept (returns `null`) so existing imports in `DashboardShell`
 * continue to compile; the file is safe to delete in a follow-up once that
 * import is also removed.
 */
export function MobileTopBar() {
  const pathname = usePathname();
  // Reference TAB_ROOTS so the const-eval isn't tree-shaken if the rest of
  // the file later grows new logic tied to tab-root detection.
  void pathname;
  void TAB_ROOTS;
  return null;
}
