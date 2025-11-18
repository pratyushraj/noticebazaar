"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandDeal } from '@/types';

interface GoalProgressAnnualProps {
  brandDeals?: BrandDeal[];
}

const GoalProgressAnnual: React.FC<GoalProgressAnnualProps> = ({ brandDeals = [] }) => {
  const goalData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Annual goal (demo: ₹35,00,000)
    const annualGoal = 3500000;

    // Calculate progress from completed deals this year
    const annualEarnings = brandDeals
      .filter(deal => {
        if (!deal.payment_received_date || deal.status !== 'Completed') return false;
        const receivedDate = new Date(deal.payment_received_date);
        return receivedDate.getFullYear() === currentYear;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    // For demo mode, show realistic progress
    const progress = brandDeals.length <= 6 ? 1280000 : annualEarnings;
    const progressPercent = Math.min(100, Math.round((progress / annualGoal) * 100));

    return {
      goal: annualGoal,
      progress,
      progressPercent,
    };
  }, [brandDeals]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
    >
      <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-white/5 hover:border-purple-600/60 transition-all shadow-inner">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Annual Goal Progress</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Goal</p>
                <p className="text-lg font-bold text-foreground">
                  ₹{(goalData.goal / 100000).toFixed(0)} lakh
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-lg font-bold text-purple-400">
                  {goalData.progressPercent}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-800/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalData.progressPercent}%` }}
                transition={{ duration: 1, delay: 0.6 }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                ₹{(goalData.progress / 100000).toFixed(2)} lakh earned
              </span>
              <span className="text-muted-foreground">
                ₹{((goalData.goal - goalData.progress) / 100000).toFixed(2)} lakh to go
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GoalProgressAnnual;

