"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BaseCard } from '@/components/ui/card-variants';
import { spacing, sectionLayout } from '@/lib/design-system';

/**
 * Enhanced dashboard skeleton loading component
 * - Matches iOS 17 design system
 * - Shows realistic loading states for all dashboard sections
 * - Smooth shimmer animation
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className={`${sectionLayout.container} animate-pulse`}>
      {/* Greeting Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-64 mb-2 bg-white/10" />
        <Skeleton className="h-6 w-48 bg-white/10" />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <BaseCard key={i} variant="tertiary" className="skeleton text-center">
            <Skeleton className="h-4 w-20 mx-auto mb-2 bg-white/10" />
            <Skeleton className="h-8 w-24 mx-auto mb-1 bg-white/10" />
          </BaseCard>
        ))}
      </div>

      {/* Main Earnings Card Skeleton */}
      <BaseCard variant="primary" className="skeleton">
        <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
        <Skeleton className="h-12 w-40 mb-2 bg-white/10" />
        <Skeleton className="h-4 w-48 mb-4 bg-white/10" />
        <Skeleton className="h-3 w-full rounded-full bg-white/10" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
          <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
        </div>
      </BaseCard>

      {/* Quick Actions Skeleton */}
      <div className={spacing.loose}>
        <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <BaseCard key={i} variant="tertiary" className="skeleton">
              <Skeleton className="h-10 w-10 rounded-xl mx-auto mb-2 bg-white/10" />
              <Skeleton className="h-4 w-20 mx-auto bg-white/10" />
            </BaseCard>
          ))}
        </div>
      </div>

      {/* Active Deals Skeleton */}
      <div className={spacing.loose}>
        <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
        <div className={spacing.compact}>
          {[1, 2].map((i) => (
            <BaseCard key={i} variant="tertiary" className="skeleton">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2 bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
                <Skeleton className="h-6 w-16 bg-white/10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full mb-2 bg-white/10" />
              <Skeleton className="h-3 w-20 bg-white/10" />
            </BaseCard>
          ))}
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className={spacing.loose}>
        <Skeleton className="h-6 w-40 mb-4 bg-white/10" />
        <div className={spacing.compact}>
          {[1, 2, 3].map((i) => (
            <BaseCard key={i} variant="tertiary" className="skeleton">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-white/10" />
                </div>
              </div>
            </BaseCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

