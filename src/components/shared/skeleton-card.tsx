'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonCardProps {
  className?: string;
  rows?: number;
  hasHeader?: boolean;
  hasChart?: boolean;
  hasAvatar?: boolean;
  hasProgress?: boolean;
}

export function SkeletonCard({ 
  className, 
  rows = 3, 
  hasHeader = true,
  hasChart = false,
  hasAvatar = false,
  hasProgress = false
}: SkeletonCardProps) {
  return (
    <div className={cn('glass-card p-6 animate-pulse', className)}>
      {/* Header */}
      {hasHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-200/50" />
            <div className="w-24 h-3.5 rounded bg-gray-200/50" />
          </div>
          <div className="w-16 h-3 rounded bg-gray-200/50" />
        </div>
      )}

      {/* Content Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className="h-3 rounded bg-gray-200/50"
            style={{ width: `${70 + Math.random() * 30}%` }}
          />
        ))}
      </div>

      {/* Chart Skeleton */}
      {hasChart && (
        <div className="mt-4 h-20 w-full">
          <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
            <motion.path
              d="M0,50 Q50,30 100,40 T200,20"
              fill="none"
              stroke="rgba(200,200,200,0.3)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        </div>
      )}

      {/* Avatar Skeleton */}
      {hasAvatar && (
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200/50" />
          <div className="flex-1 space-y-2">
            <div className="w-24 h-3 rounded bg-gray-200/50" />
            <div className="w-16 h-2 rounded bg-gray-200/50" />
          </div>
        </div>
      )}

      {/* Progress Skeleton */}
      {hasProgress && (
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-gray-200/50 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-gray-300/50" />
          </div>
        </div>
      )}
    </div>
  );
}

// Specific skeletons for each widget type
export function AICompanionSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse h-full">
      <div className="flex items-start justify-between h-full">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-gray-200/50" />
            <div className="w-20 h-3 rounded bg-gray-200/50" />
          </div>
          <div className="w-48 h-8 rounded bg-gray-200/50 mb-2" />
          <div className="w-32 h-3 rounded bg-gray-200/50 mb-6" />
          <div className="w-32 h-10 rounded-full bg-gray-200/50 mb-6" />
          <div className="flex gap-2">
            <div className="w-20 h-6 rounded-full bg-gray-200/50" />
            <div className="w-20 h-6 rounded-full bg-gray-200/50" />
            <div className="w-20 h-6 rounded-full bg-gray-200/50" />
            <div className="w-20 h-6 rounded-full bg-gray-200/50" />
          </div>
        </div>
        <div className="w-40 h-40 rounded-full bg-gray-200/50" />
      </div>
    </div>
  );
}

export function MoodOverviewSkeleton() {
  return <SkeletonCard hasHeader hasChart rows={1} />;
}

export function SleepTrackingSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200/50" />
          <div className="w-12 h-3 rounded bg-gray-200/50" />
        </div>
        <div className="w-12 h-3 rounded bg-gray-200/50" />
      </div>
      <div className="flex items-center justify-between">
        <div className="w-28 h-28 rounded-full border-8 border-gray-200/50" />
        <div className="text-right space-y-2">
          <div className="w-16 h-3 rounded bg-gray-200/50" />
          <div className="w-12 h-8 rounded bg-gray-200/50" />
          <div className="flex gap-0.5 justify-end">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-1.5 h-4 rounded-full bg-gray-200/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DailyGoalsSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200/50" />
          <div className="w-20 h-3 rounded bg-gray-200/50" />
        </div>
        <div className="w-16 h-3 rounded bg-gray-200/50" />
      </div>
      <div className="h-1.5 w-full bg-gray-200/50 rounded-full mb-5" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-200/50" />
            <div className="flex-1 h-3 rounded bg-gray-200/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

