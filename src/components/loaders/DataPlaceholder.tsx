"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DataPlaceholderProps {
  type?: 'list' | 'grid' | 'table' | 'card' | 'compact-list';
  count?: number;
  className?: string;
}

/**
 * Reusable data placeholder component
 * - Multiple layout types (list, grid, table, card)
 * - Configurable item count
 * - iOS 17 design system styling
 */
export const DataPlaceholder: React.FC<DataPlaceholderProps> = ({
  type = 'list',
  count = 3,
  className,
}) => {
  if (type === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Card
            key={i}
            className="p-4 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border border-white/15"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg bg-white/10" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'compact-list') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3 bg-white/10" />
              <Skeleton className="h-3 w-1/2 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Card
            key={i}
            className="p-4 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border border-white/15"
          >
            <Skeleton className="h-32 w-full mb-3 rounded-xl bg-white/10" />
            <Skeleton className="h-4 w-full mb-2 bg-white/10" />
            <Skeleton className="h-3 w-2/3 bg-white/10" />
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 p-3 bg-white/5 rounded-t-xl">
          {['Name', 'Status', 'Date', 'Action'].map((header) => (
            <Skeleton key={header} className="h-4 w-20 bg-white/10" />
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-4 p-3 bg-white/[0.08] border-b border-white/10 last:border-b-0"
          >
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-4 w-16 bg-white/10" />
            <Skeleton className="h-4 w-20 bg-white/10" />
            <Skeleton className="h-6 w-16 rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Card
            key={i}
            className="p-6 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border border-white/15"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-2/3 bg-white/10" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
              <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return null;
};

export default DataPlaceholder;

