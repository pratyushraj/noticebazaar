"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Enhanced dashboard skeleton loading component
 * - Matches iOS 17 design system
 * - Shows realistic loading states for all dashboard sections
 * - Smooth shimmer animation
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 pb-24 space-y-6 animate-pulse">
      {/* Greeting Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-64 mb-2 bg-white/10" />
        <Skeleton className="h-6 w-48 bg-white/10" />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="p-4 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border border-white/15"
          >
            <Skeleton className="h-4 w-20 mb-2 bg-white/10" />
            <Skeleton className="h-8 w-24 mb-1 bg-white/10" />
            <Skeleton className="h-3 w-16 bg-white/10" />
          </Card>
        ))}
      </div>

      {/* Main Earnings Card Skeleton */}
      <Card className="p-6 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border border-white/15">
        <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
        <Skeleton className="h-12 w-40 mb-2 bg-white/10" />
        <Skeleton className="h-4 w-48 mb-4 bg-white/10" />
        <Skeleton className="h-3 w-full rounded-full bg-white/10" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
          <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
        </div>
      </Card>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="p-4 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border border-white/15"
          >
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
              <Skeleton className="h-5 w-24 bg-white/10" />
            </div>
            <Skeleton className="h-8 w-20 mb-2 bg-white/10" />
            <Skeleton className="h-3 w-32 bg-white/10" />
          </Card>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <Card className="p-6 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border border-white/15">
        <Skeleton className="h-6 w-40 mb-4 bg-white/10" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardSkeleton;

