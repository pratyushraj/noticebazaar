"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';

interface DealStreakCounterProps {
  brandDeals: BrandDeal[] | undefined;
}

export const DealStreakCounter: React.FC<DealStreakCounterProps> = ({ brandDeals }) => {
  const streak = useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) return 0;

    // Get all deals that are signed or completed
    const signedDeals = brandDeals.filter(d => 
      d.status === 'Approved' || d.status === 'Completed' || d.status === 'Payment Pending'
    );

    if (signedDeals.length === 0) return 0;

    // Group by week
    const weeks: Set<string> = new Set();
    signedDeals.forEach(deal => {
      const date = new Date(deal.created_at || deal.updated_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      weeks.add(weekKey);
    });

    // Check consecutive weeks
    const weekArray = Array.from(weeks).sort();
    let maxStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < weekArray.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevWeek = parseInt(weekArray[i - 1].split('-W')[1]);
        const currWeek = parseInt(weekArray[i].split('-W')[1]);
        const prevYear = parseInt(weekArray[i - 1].split('-W')[0]);
        const currYear = parseInt(weekArray[i].split('-W')[0]);
        
        // Check if consecutive (same year and week difference is 1, or year difference is 1 and week wraps)
        if ((currYear === prevYear && currWeek === prevWeek + 1) || 
            (currYear === prevYear + 1 && currWeek === 1 && prevWeek === 52)) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    return maxStreak;
  }, [brandDeals]);

  if (streak < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Flame className="w-4 h-4 text-orange-400" />
      </motion.div>
      <span className="text-sm font-semibold text-orange-400">
        {streak} week{streak !== 1 ? 's' : ''} streak
      </span>
    </motion.div>
  );
};

export default DealStreakCounter;

