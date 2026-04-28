import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BrandDashboardSkeletonProps {
  isDark: boolean;
}

export const BrandDashboardSkeleton: React.FC<BrandDashboardSkeletonProps> = ({ isDark }) => {
  const bgColor = isDark ? 'bg-secondary/10' : 'bg-slate-100';
  const shimmerColor = isDark ? 'bg-white/5' : 'bg-white/40';

  return (
    <div className="px-5 pb-32 pt-safe">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className={cn("h-4 w-32 rounded-lg animate-pulse", bgColor)} />
          <div className={cn("h-8 w-48 rounded-xl animate-pulse", bgColor)} />
        </div>
        <div className={cn("w-10 h-10 rounded-2xl animate-pulse", bgColor)} />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("p-5 rounded-[28px] border border-border animate-pulse", isDark ? 'bg-card/50' : 'bg-white/50 shadow-sm')}>
            <div className={cn("h-3 w-16 rounded-full mb-3", bgColor)} />
            <div className={cn("h-8 w-20 rounded-xl", bgColor)} />
          </div>
        ))}
      </div>

      {/* Main Content Section Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className={cn("h-4 w-24 rounded-full animate-pulse", bgColor)} />
          <div className={cn("h-4 w-16 rounded-full animate-pulse", bgColor)} />
        </div>

        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={cn(
              "p-6 rounded-[32px] border border-border space-y-4 animate-pulse", 
              isDark ? 'bg-card/30' : 'bg-white/30 shadow-sm'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-2xl", bgColor)} />
                <div className="space-y-2">
                  <div className={cn("h-4 w-24 rounded-lg", bgColor)} />
                  <div className={cn("h-3 w-32 rounded-full", bgColor)} />
                </div>
              </div>
              <div className={cn("h-6 w-16 rounded-full", bgColor)} />
            </div>
            
            <div className="pt-2 space-y-2">
              <div className={cn("h-2 w-full rounded-full", bgColor)} />
              <div className={cn("h-2 w-3/4 rounded-full", bgColor)} />
            </div>

            <div className={cn("h-12 w-full rounded-2xl mt-4", bgColor)} />
          </div>
        ))}
      </div>
    </div>
  );
};
