"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';

interface CreatorScoreBadgeProps {
  brandDeals: BrandDeal[] | undefined;
  protectionScore?: number;
  taxFiled?: boolean;
}

export const CreatorScoreBadge: React.FC<CreatorScoreBadgeProps> = ({ 
  brandDeals, 
  protectionScore = 0,
  taxFiled = false 
}) => {
  const score = useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) return 0;

    // Payment on-time percentage (40% weight)
    const completedDeals = brandDeals.filter(d => d.status === 'Completed' && d.payment_received_date);
    const onTimePayments = completedDeals.filter(d => {
      if (!d.payment_expected_date || !d.payment_received_date) return false;
      const expected = new Date(d.payment_expected_date);
      const received = new Date(d.payment_received_date);
      return received <= expected || (received.getTime() - expected.getTime()) <= 7 * 24 * 60 * 60 * 1000; // 7 days grace
    });
    const paymentScore = completedDeals.length > 0 
      ? (onTimePayments.length / completedDeals.length) * 40 
      : 0;

    // Protection score (30% weight)
    const protectionScoreWeighted = (protectionScore / 100) * 30;

    // Tax filed (30% weight)
    const taxScore = taxFiled ? 30 : 0;

    return Math.round(paymentScore + protectionScoreWeighted + taxScore);
  }, [brandDeals, protectionScore, taxFiled]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-blue-600';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Elite Creator';
    if (score >= 80) return 'Pro Creator';
    if (score >= 60) return 'Rising Creator';
    if (score >= 40) return 'Growing Creator';
    return 'New Creator';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Your Creator Score</h3>
        </div>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-semibold",
          score >= 80 && "bg-green-500/20 text-green-400",
          score >= 60 && score < 80 && "bg-blue-500/20 text-blue-400",
          score >= 40 && score < 60 && "bg-yellow-500/20 text-yellow-400",
          score < 40 && "bg-red-500/20 text-red-400"
        )}>
          {getScoreLabel(score)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="3"
              strokeDasharray={`${score} ${100 - score}`}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444"} />
                <stop offset="100%" stopColor={score >= 80 ? "#059669" : score >= 60 ? "#2563eb" : score >= 40 ? "#d97706" : "#dc2626"} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{score}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-white/60 mb-1">Based on:</div>
          <div className="space-y-1 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>Payment timeliness</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>Content protection</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>Tax compliance</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreatorScoreBadge;

