'use client';

/**
 * Floating Action Button — PR3 shell primitive.
 *
 * A circular primary action button meant to float above page content
 * (e.g. centered in the mobile bottom-nav rail). Built on top of the
 * new `Button` so it inherits `tone-energy`, `motion-press`, and the
 * pill radius automatically.
 *
 * Usage:
 *   <Fab href="/mood" icon={Sparkles} label="Daily check-in" />
 *   <Fab onClick={openSheet} icon={Plus} label="New entry" />
 *
 * Defaults to a 56×56 circle (Material/Apple FAB standard). The
 * `.fab-base` utility in globals.css provides the sage glow shadow.
 */
import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export type FabProps = Omit<
  React.ComponentProps<typeof Button>,
  'size' | 'children' | 'asChild'
> & {
  /** Lucide icon component to render inside the FAB. */
  icon: LucideIcon;
  /** Accessible label (required — FABs are icon-only by definition). */
  label: string;
  /** If provided, renders as a Next.js Link. Otherwise renders a `<button>`. */
  href?: string;
  /** Pixel size of the FAB. Defaults to 56 (standard). */
  size?: number;
  /** Optional click handler when used as a button (not a link). */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export const Fab = React.forwardRef<HTMLElement, FabProps>(function Fab(
  {
    icon: IconComponent,
    label,
    href,
    size = 56,
    className,
    onClick,
    variant = 'primary',
    ...props
  },
  ref,
) {
  const sizeStyle = React.useMemo(
    () => ({ width: `${size}px`, height: `${size}px` }),
    [size],
  );

  const classes = cn(
    'fab-base rounded-full p-0 motion-press',
    'border border-white/40 dark:border-white/10',
    className,
  );

  const inner = (
    <>
      <Icon icon={IconComponent} size={24} aria-hidden />
      <span className="sr-only">{label}</span>
    </>
  );

  if (href) {
    return (
      <Button
        ref={ref as React.Ref<HTMLButtonElement>}
        variant={variant}
        className={classes}
        style={sizeStyle as React.CSSProperties}
        aria-label={label}
        asChild
        {...props}
      >
        <Link href={href}>{inner}</Link>
      </Button>
    );
  }

  return (
    <Button
      ref={ref as React.Ref<HTMLButtonElement>}
      variant={variant}
      className={classes}
      style={sizeStyle as React.CSSProperties}
      aria-label={label}
      onClick={onClick}
      {...props}
    >
      {inner}
    </Button>
  );
});