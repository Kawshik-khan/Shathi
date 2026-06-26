'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  illustration?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  illustration,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const actionClasses =
    'btn-haptic touch-target inline-flex min-h-11 items-center justify-center rounded-full btn-primary-gradient px-5 text-base font-medium text-white';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-10 text-center',
        className,
      )}
    >
      {illustration && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={illustration}
          alt=""
          aria-hidden="true"
          className="mb-4 h-auto w-32 select-none pointer-events-none"
        />
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-base text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={cn('mt-4', actionClasses)}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button type="button" onClick={onAction} className={cn('mt-4', actionClasses)}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
