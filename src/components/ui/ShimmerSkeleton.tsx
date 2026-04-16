'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * CSS-only shimmer skeleton — no framer-motion, no extra deps.
 * Uses a linear-gradient animation for the shimmer effect.
 */
interface ShimmerSkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ShimmerSkeleton({ className, rounded = 'md' }: ShimmerSkeletonProps) {
  const radiusClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={cn(
        'bg-gradient-to-r',
        'from-neutral-200/50 via-neutral-100/80 to-neutral-200/50',
        'dark:from-neutral-700/50 dark:via-neutral-600/80 dark:to-neutral-700/50',
        'bg-[length:200%_100%]',
        radiusClass,
        className
      )}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
      aria-hidden="true"
    />
  );
}

/** Text line skeleton */
export function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/** Card skeleton for dashboard sections */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 rounded-2xl border',
        'bg-card border-border',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <ShimmerSkeleton className="w-10 h-10" rounded="lg" />
        <div className="flex-1 space-y-2">
          <ShimmerSkeleton className="h-4 w-32" />
          <ShimmerSkeleton className="h-3 w-20" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/** Avatar skeleton */
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <ShimmerSkeleton
      className="shrink-0"
      style={{ width: size, height: size }}
      rounded="full"
    />
  );
}
