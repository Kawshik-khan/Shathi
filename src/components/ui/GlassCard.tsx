'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
  animate?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function GlassCard({ 
  children, 
  className, 
  glowOnHover = true,
  animate = true,
  delay = 0,
  onClick 
}: GlassCardProps) {
  const CardWrapper = animate ? motion.div : 'div';
  
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: 0.5, 
      delay,
      ease: [0.25, 0.1, 0.25, 1] as const
    },
    whileHover: glowOnHover ? { 
      y: -4, 
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
      transition: { duration: 0.3 }
    } : undefined
  } : {};

  return (
    <CardWrapper
      onClick={onClick}
      className={cn(
        'glass-card p-6 transition-all duration-300',
        glowOnHover && 'hover-lift cursor-pointer',
        className
      )}
      {...animationProps}
    >
      {children}
    </CardWrapper>
  );
}