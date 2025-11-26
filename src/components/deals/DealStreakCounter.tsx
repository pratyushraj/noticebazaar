"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface DealStreakCounterProps {
  brandDeals: BrandDeal[] | undefined;
}

export const DealStreakCounter: React.FC<DealStreakCounterProps> = ({ brandDeals }) => {
  const [hasCelebrated, setHasCelebrated] = useState(false);
  
  const { currentStreak, bestStreak } = useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) {
      return { currentStreak: 0, bestStreak: 0 };
    }

    // Get all deals that are signed or completed
    const signedDeals = brandDeals.filter(d => 
      d.status === 'Approved' || d.status === 'Completed' || d.status === 'Payment Pending'
    );

    if (signedDeals.length === 0) {
      return { currentStreak: 0, bestStreak: 0 };
    }

    // Group by week
    const weeks: Set<string> = new Set();
    signedDeals.forEach(deal => {
      const date = new Date(deal.created_at || deal.updated_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      weeks.add(weekKey);
    });

    // Calculate streaks
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

    return {
      currentStreak: currentStreak || maxStreak,
      bestStreak: maxStreak,
    };
  }, [brandDeals]);

  // Celebrate milestone streaks (5, 10, 20, 30, etc.)
  useEffect(() => {
    if (currentStreak >= 2 && !hasCelebrated) {
      const milestones = [5, 10, 20, 30, 50, 100];
      if (milestones.includes(currentStreak)) {
        // Confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F97316', '#FB923C', '#FDBA74', '#FED7AA'],
        });
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 100]);
        }
        
        setHasCelebrated(true);
        setTimeout(() => setHasCelebrated(false), 5000);
      }
    }
  }, [currentStreak, hasCelebrated]);

  if (currentStreak < 2) return null;

  const isMilestone = [5, 10, 20, 30, 50, 100].includes(currentStreak);
  const showBestStreak = bestStreak > currentStreak;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
        isMilestone
          ? "bg-gradient-to-r from-orange-500/30 to-red-500/30 border-orange-400/50 shadow-lg shadow-orange-500/30"
          : "bg-orange-500/20 border-orange-500/30"
      )}
    >
      {/* Pulsing glow effect for milestones */}
      {isMilestone && (
        <motion.div
          className="absolute inset-0 rounded-full bg-orange-500/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      <div className="relative flex items-center gap-2">
        <motion.div
          animate={{ 
            scale: isMilestone ? [1, 1.3, 1] : [1, 1.15, 1],
            rotate: isMilestone ? [0, 10, -10, 0] : 0,
          }}
          transition={{ 
            duration: isMilestone ? 0.6 : 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Flame className={cn(
            "w-5 h-5",
            isMilestone ? "text-orange-400" : "text-orange-400"
          )} />
        </motion.div>
        
        <div className="flex flex-col">
          <span className="text-sm font-bold text-orange-400 leading-tight">
            {currentStreak} week{currentStreak !== 1 ? 's' : ''} streak
          </span>
          {showBestStreak && (
            <span className="text-[10px] text-orange-400/70 leading-tight">
              Best: {bestStreak} weeks
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DealStreakCounter;

