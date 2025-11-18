"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface HeroEarningsCardProps {
  current: number;
  previous: number;
  goal: number;
  trend?: number[];
}

const HeroEarningsCard: React.FC<HeroEarningsCardProps> = ({ 
  current, 
  previous, 
  goal,
  trend = []
}) => {
  const navigate = useNavigate();
  const change = current - previous;
  const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0;
  const progressPercent = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const isPositive = change >= 0;

  // Animated counting effect
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = current / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const nextValue = Math.min(increment * step, current);
      setDisplayValue(Math.floor(nextValue));
      
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [current]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/20 to-emerald-950/40 border border-emerald-700/50 backdrop-blur-sm shadow-2xl overflow-hidden hover:shadow-emerald-500/20 transition-all duration-300 relative shadow-[0_0_20px_-6px_rgba(255,255,255,0.1)]">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent animate-pulse"></div>
        
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-emerald-100">
              This Month's Earnings
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator-payments')}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 group"
            >
              View Breakdown
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="mb-4">
            <div className="text-5xl font-bold text-white mb-2 tabular-nums">
              ₹{displayValue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "flex items-center gap-1 font-semibold",
                isPositive ? "text-emerald-400" : "text-red-400"
              )}>
                <TrendingUp className={cn(
                  "w-4 h-4",
                  !isPositive && "rotate-180"
                )} />
                <span>₹{Math.abs(change).toLocaleString('en-IN')} ({Math.abs(changePercent)}%)</span>
              </div>
              <span className="text-gray-400">vs last month</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Monthly Goal Progress</span>
              <span className="text-emerald-400 font-semibold">{progressPercent}% of ₹{goal.toLocaleString('en-IN')} goal</span>
            </div>
            <div className="relative h-2.5 bg-gray-800/80 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HeroEarningsCard;

