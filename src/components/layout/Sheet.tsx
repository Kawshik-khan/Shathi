'use client';

/**
 * Sheet — PR3 shell primitive.
 *
 * A right-side drawer built on top of Radix `Dialog` primitives.
 * Provides token-driven surfaces (glass + sage border) so the
 * sheet feels native to the redesigned shell.
 *
 * Usage:
 *   <Sheet open={isOpen} onOpenChange={setOpen} title="Filters">
 *     <p>Sheet content</p>
 *   </Sheet>
 *
 * Variant `side="right"` (default) — slides in from the right.
 * Variant `side="bottom"` — bottom sheet (mobile-first).
 */
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type SheetSide = 'right' | 'bottom';

interface SheetProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Called whenever the open state changes (controlled or uncontrolled). */
  onOpenChange?: (open: boolean) => void;
  /** Sheet title — required for accessibility. */
  title: React.ReactNode;
  /** Optional longer description for screen readers. */
  description?: React.ReactNode;
  /** Sheet side. Defaults to "right". */
  side?: SheetSide;
  /** Sheet body. */
  children?: React.ReactNode;
  /** Optional trigger element (renders a button that opens the sheet). */
  trigger?: React.ReactNode;
  /** Extra classes for the sheet content panel. */
  className?: string;
}

const sideClasses: Record<SheetSide, string> = {
  right: [
    'inset-y-0 right-0',
    'h-full w-full sm:w-[28rem] sm:max-w-[90vw]',
    'rounded-l-[28px] rounded-r-none',
    'data-[state=open]:animate-in data-[state=open]:slide-in-from-right',
    'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right',
  ].join(' '),
  bottom: [
    'inset-x-0 bottom-0',
    'max-h-[85vh] w-full',
    'rounded-t-[28px] rounded-b-none',
    'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
    'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
  ].join(' '),
};

export function Sheet({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  side = 'right',
  children,
  trigger,
  className,
}: SheetProps) {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className={cn(
          'surface-card-elevated border-l border-border-subtle p-0 shadow-overlay',
          sideClasses[side],
          className,
        )}
        // Disable the built-in centered positioning; we use side classes.
        // DialogContent renders a Portal + Overlay internally.
      >
        <DialogHeader className="border-b border-border-subtle px-6 py-4">
          <DialogTitle className="text-h3 normal-case tracking-normal">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        <DialogClose className="sr-only" />
      </DialogContent>
    </Dialog>
  );
}