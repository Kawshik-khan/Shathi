'use client';

/**
 * Mobile bottom navigation (PR3 redesign).
 *
 * - Five-tab rail with a centered FAB for the daily mood check-in.
 * - Sources keys + hrefs from `nav-config` (single source of truth).
 * - Uses the new `Fab` primitive for the center button and the
 *   redesigned `Icon` facade + `surface-card` tokens for the tabs.
 * - Crisis resources remain reachable from `/resources` (linked
 *   from the Profile "Quick Links" card) — no floating SOS on home
 *   shell to keep the bottom area clean and avoid overlapping the
 *   sticky check-in CTA.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/icon';
import { Fab } from '@/components/layout/Fab';
import {
  mobileBottomNavOrder,
  userNavigation,
  mobileFabHref,
  mobileFabIcon,
} from '@/components/layout/nav-config';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const items = mobileBottomNavOrder.map((key) => {
    const item = userNavigation.find((n) => n.key === key);
    if (!item) {
      throw new Error(`MobileBottomNav: nav-config missing key "${key}"`);
    }
    return item;
  });

  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <nav
      aria-label={t('mobile.mainNavigation', 'Main navigation')}
      data-slot="mobile-bottom-nav"
      className="bottom-nav-rail lg:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-end justify-between border-t border-border-subtle bg-bg-card/90 px-2 pb-safe backdrop-blur-xl"
    >
      {/* Left two tabs */}
      <div className="flex flex-1 items-end justify-around">
        {left.map((item) => (
          <NavTab key={item.key} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Spacer so the FAB can sit centered without overlapping */}
      <div className="w-14 shrink-0" aria-hidden="true" />

      {/* Right three tabs */}
      <div className="flex flex-1 items-end justify-around">
        {right.map((item) => (
          <NavTab key={item.key} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Centered FAB — daily mood check-in */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div className="-translate-y-1/2 pointer-events-auto">
          <Fab
            href={mobileFabHref}
            icon={mobileFabIcon}
            label={t('mobile.dailyCheckIn', 'Daily mood check-in')}
            size={56}
          />
        </div>
      </div>
    </nav>
  );
}

function NavTab({
  item,
  pathname,
}: {
  item: (typeof userNavigation)[number];
  pathname: string;
}) {
  const { t } = useTranslation();
  const IconCmp = item.icon;
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'motion-press flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
        isActive
          ? 'text-accent-energy'
          : 'text-text-secondary hover:text-text-primary',
      )}
    >
      <Icon icon={IconCmp} size={20} aria-hidden />
      <span className="max-w-18 truncate">
        {t(`navigation.${item.key}`, item.label ?? item.key)}
      </span>
    </Link>
  );
}
