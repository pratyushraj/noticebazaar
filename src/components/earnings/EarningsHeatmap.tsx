"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EarningsHeatmapProps {
  brandDeals: BrandDeal[] | undefined;
  className?: string;
}

export const EarningsHeatmap: React.FC<EarningsHeatmapProps> = ({ brandDeals, className }) => {
  const heatmapData = useMemo(() => {
    if (!brandDeals) return {};

    const data: Record<string, number> = {};
    const now = new Date();
    
    // Get last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      data[dateKey] = 0;
    }

    // Calculate earnings per day
    brandDeals.forEach(deal => {
      if (deal.status === 'Completed' && deal.payment_received_date) {
        const paymentDate = new Date(deal.payment_received_date);
        const dateKey = paymentDate.toISOString().split('T')[0];
        if (data.hasOwnProperty(dateKey)) {
          data[dateKey] += deal.deal_amount || 0;
        }
      }
    });

    return data;
  }, [brandDeals]);

  const maxEarning = useMemo(() => {
    return Math.max(...Object.values(heatmapData), 1);
  }, [heatmapData]);

  const getIntensity = (amount: number) => {
    if (amount === 0) return 0;
    const ratio = amount / maxEarning;
    if (ratio < 0.2) return 1;
    if (ratio < 0.4) return 2;
    if (ratio < 0.6) return 3;
    if (ratio < 0.8) return 4;
    return 5;
  };

  const dates = useMemo(() => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  return (
    <TooltipProvider>
      <div className={cn("bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-2xl p-4", className)}>
        <h3 className="text-sm font-semibold text-white mb-3">Earnings Heatmap (Last 30 Days)</h3>
        <div className="flex items-center gap-1 flex-wrap">
          {dates.map((dateKey, index) => {
            const amount = heatmapData[dateKey] || 0;
            const intensity = getIntensity(amount);
            const date = new Date(dateKey);
            
            return (
              <Tooltip key={dateKey}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={cn(
                      "w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-125",
                      intensity === 0 && "bg-white/5",
                      intensity === 1 && "bg-purple-500/20",
                      intensity === 2 && "bg-purple-500/40",
                      intensity === 3 && "bg-purple-500/60",
                      intensity === 4 && "bg-purple-500/80",
                      intensity === 5 && "bg-purple-500",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-[#1C1C1E] text-white border-white/10">
                  <p className="font-semibold">
                    {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-sm text-white/70">
                    {amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'No earnings'}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-white/60">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-white/5" />
            <div className="w-3 h-3 rounded-sm bg-purple-500/20" />
            <div className="w-3 h-3 rounded-sm bg-purple-500/40" />
            <div className="w-3 h-3 rounded-sm bg-purple-500/60" />
            <div className="w-3 h-3 rounded-sm bg-purple-500/80" />
            <div className="w-3 h-3 rounded-sm bg-purple-500" />
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EarningsHeatmap;

