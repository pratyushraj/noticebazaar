"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TaxSeasonMonster: React.FC = () => {
  const { daysLeft, progress, size } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const taxDeadline = new Date(currentYear, 6, 31); // July 31 (month is 0-indexed)
    
    // If we're past July 31, set deadline for next year
    if (now > taxDeadline) {
      taxDeadline.setFullYear(currentYear + 1);
    }
    
    const diffTime = taxDeadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate progress (60 days = 100%, 0 days = 0%)
    const totalDays = 60;
    const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));
    
    // Monster size based on progress (smaller = more urgent)
    const size = Math.max(0.5, 1 - (progress / 100) * 0.5);
    
    return { daysLeft, progress, size };
  }, []);

  if (daysLeft > 60 || daysLeft < 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-4 mb-6",
        daysLeft <= 30 && "border-orange-500/50 bg-orange-500/10"
      )}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ 
            scale: [1, size, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-6xl flex-shrink-0"
        >
          👾
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">
              Tax season is coming!
            </h3>
          </div>
          <p className="text-xs text-white/70 mb-2">
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} until July 31st deadline
          </p>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
              className={cn(
                "h-full rounded-full",
                daysLeft > 30 && "bg-purple-500",
                daysLeft <= 30 && daysLeft > 14 && "bg-orange-500",
                daysLeft <= 14 && "bg-red-500"
              )}
            />
          </div>
          {daysLeft <= 14 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
              <AlertCircle className="w-3 h-3" />
              <span>Time to file your taxes!</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaxSeasonMonster;

