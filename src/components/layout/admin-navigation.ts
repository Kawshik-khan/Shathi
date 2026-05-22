import {
  Activity,
  BarChart3,
  ClipboardList,
  Crown,
  FileText,
  HeartPulse,
  Server,
  Shield,
  Users,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'subscriptions'
  | 'content'
  | 'safety'
  | 'moderation'
  | 'analytics'
  | 'health'
  | 'audit';

export type AdminNavigationItem = {
  key: AdminTab;
  label: string;
  href: string;
  icon: typeof Shield;
};

export const adminNavigationItems: AdminNavigationItem[] = [
  { key: 'overview', label: 'Overview', href: '/admin?tab=overview', icon: Shield },
  { key: 'users', label: 'Users', href: '/admin?tab=users', icon: Users },
  { key: 'subscriptions', label: 'Plans', href: '/admin?tab=subscriptions', icon: Crown },
  { key: 'content', label: 'Content', href: '/admin?tab=content', icon: FileText },
  { key: 'safety', label: 'Safety', href: '/admin?tab=safety', icon: HeartPulse },
  { key: 'moderation', label: 'Moderation', href: '/admin?tab=moderation', icon: ClipboardList },
  { key: 'analytics', label: 'Analytics', href: '/admin?tab=analytics', icon: BarChart3 },
  { key: 'health', label: 'Health', href: '/admin?tab=health', icon: Server },
  { key: 'audit', label: 'Audit', href: '/admin?tab=audit', icon: Activity },
];

export function isAdminTab(value: string | null): value is AdminTab {
  return adminNavigationItems.some((item) => item.key === value);
}
