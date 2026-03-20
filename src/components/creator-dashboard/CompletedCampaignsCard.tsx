"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';

interface CompletedCampaignsCardProps {
  completed: number;
  completedChange?: number;
  onTimeRate?: number;
  brandDeals?: BrandDeal[];
  isLoading?: boolean;
}

const CompletedCampaignsCard: React.FC<CompletedCampaignsCardProps> = ({
  completed,
  completedChange = 0,
  onTimeRate = 0,
  brandDeals = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="secondary" interactive onClick={() => navigate('/creator-contracts')} className="group h-full">
      {/* Soft inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      
      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
            <CheckCircle className="h-5 w-5 text-white/80" />
          </div>
          <CardTitle>Completed</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-white tabular-nums">{completed} this month</div>
        {completedChange !== 0 && (
          <div className={cn(
            "flex items-center gap-1 text-[13px] font-semibold mt-1",
            completedChange > 0 ? "text-emerald-400" : "text-red-400"
          )}>
            <TrendingUp className={cn(
              "w-3.5 h-3.5",
              completedChange < 0 && "rotate-180"
            )} />
            <span>{Math.abs(completedChange)} {completedChange > 0 ? 'more' : 'less'} than last month</span>
          </div>
        )}
        <div className="text-[13px] text-white/60 mt-2">
          On-time delivery rate: <span className="font-semibold text-white">{onTimeRate}%</span>
        </div>
      </CardContent>

      <div className="relative z-10 px-4 pb-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-sm text-blue-500 group-hover:text-blue-400 transition-colors cursor-pointer">
          <span className="whitespace-nowrap">View All</span>
          <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Card>
  );
};

export default CompletedCampaignsCard;

