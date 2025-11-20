"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card variant="partner" interactive>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-purple-500/10 border border-purple-500/20">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <CardTitle>Annual Goal Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-white/60">Goal</p>
                <p className="text-2xl font-bold text-white number-large mt-1">
                  ₹{(goalData.goal / 100000).toFixed(0)} lakh
                </p>
              </div>
              <div className="text-right">
                <p className="text-small text-white/60">Progress</p>
                <p className="text-2xl font-bold text-purple-400 number-large mt-1">
                  {goalData.progressPercent}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalData.progressPercent}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>

            <div className="flex items-center justify-between text-small">
              <span className="text-white/70">
                ₹{(goalData.progress / 100000).toFixed(2)} lakh earned
              </span>
              <span className="text-white/70">
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

