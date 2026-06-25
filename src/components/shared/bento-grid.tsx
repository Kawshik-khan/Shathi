'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5 auto-rows-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  /** Column span on the lg (12-col) grid. */
  colSpan?: number;
  /** Row span on the bento grid. */
  rowSpan?: number;
  /** Column span on the sm (2-col) grid. */
  smColSpan?: number;
  glowOnHover?: boolean;
  animate?: boolean;
  delay?: number;
  onClick?: () => void;
  ariaLabel?: string;
}

const lgColSpanMap: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

const smColSpanMap: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
};

const rowSpanMap: Record<number, string> = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
};

export function BentoCard({
  children,
  className,
  colSpan = 4,
  rowSpan,
  smColSpan,
  glowOnHover = true,
  animate = true,
  delay = 0,
  onClick,
  ariaLabel,
}: BentoCardProps) {
  const CardWrapper = animate ? motion.div : 'div';

  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.5,
          delay,
          ease: [0.25, 0.1, 0.25, 1] as const,
        },
        whileHover: glowOnHover
          ? {
              y: -4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
              transition: { duration: 0.3 },
            }
          : undefined,
      }
    : {};

  return (
    <CardWrapper
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        lgColSpanMap[colSpan],
        smColSpan && smColSpanMap[smColSpan],
        rowSpan && rowSpanMap[rowSpan],
        className
      )}
      {...animationProps}
    >
      {children}
    </CardWrapper>
  );
}
