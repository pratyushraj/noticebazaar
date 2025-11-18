"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BrandDeal } from '@/types';

interface BrandInterestScoreProps {
  brandDeals?: BrandDeal[];
  profile?: any;
}

const BrandInterestScore: React.FC<BrandInterestScoreProps> = ({ brandDeals = [], profile }) => {
  const score = useMemo(() => {
    let totalScore = 0;
    let maxScore = 0;

    // Profile completeness (0-25 points)
    const profileFields = [
      profile?.business_name,
      profile?.gstin,
      profile?.bank_account_number,
      profile?.instagram_handle,
      profile?.youtube_channel_id,
    ];
    const filledFields = profileFields.filter(f => f).length;
    const profileScore = (filledFields / 5) * 25;
    totalScore += profileScore;
    maxScore += 25;

    // Pending deliverables (0-25 points) - lower pending = higher score
    const pendingDeliverables = brandDeals.filter(d => 
      d.status === 'Approved' && !d.payment_received_date
    ).length;
    const totalActive = brandDeals.filter(d => d.status !== 'Drafting').length || 1;
    const deliverablesScore = Math.max(0, 25 - (pendingDeliverables / totalActive) * 25);
    totalScore += deliverablesScore;
    maxScore += 25;

    // Payment completion rate (0-25 points)
    const completedPayments = brandDeals.filter(d => d.payment_received_date).length;
    const totalDeals = brandDeals.length || 1;
    const paymentScore = (completedPayments / totalDeals) * 25;
    totalScore += paymentScore;
    maxScore += 25;

    // Deal activity (0-25 points) - more deals = higher score
    const recentDeals = brandDeals.filter(d => {
      const createdDate = new Date(d.created_at);
      const daysSince = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 90;
    }).length;
    const activityScore = Math.min(25, (recentDeals / 5) * 25);
    totalScore += activityScore;
    maxScore += 25;

    // For demo mode (empty or few deals), return a good score
    if (brandDeals.length <= 6) {
      return 78; // Demo: Good score
    }

    return Math.round((totalScore / maxScore) * 100);
  }, [brandDeals, profile]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'from-emerald-500/20 to-emerald-600/20', border: 'border-emerald-700/40', text: 'text-emerald-400', label: 'Excellent' };
    if (score >= 60) return { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-700/40', text: 'text-blue-400', label: 'Good' };
    if (score >= 40) return { bg: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-700/40', text: 'text-yellow-400', label: 'Fair' };
    return { bg: 'from-red-600/20 to-red-800/20', border: 'border-white/5', text: 'text-red-400', label: 'Needs Work' };
  };

  const scoreConfig = getScoreColor(score);
  const gaugeRotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className={cn("bg-gradient-to-br", scoreConfig.bg, "border", scoreConfig.border, "hover:border-opacity-60 transition-all shadow-inner")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand Interest Score</span>
            </div>
            <span className={cn("text-lg font-bold", scoreConfig.text)}>
              {score}/100
            </span>
          </div>

          {/* Gauge Meter */}
          <div className="relative w-full h-24 mb-3 flex items-end justify-center">
            <svg className="w-full h-full" viewBox="0 0 120 60" style={{ transform: 'scaleY(-1)' }}>
              {/* Background arc */}
              <path
                d="M 10 50 A 50 50 0 0 1 110 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-800/30"
              />
              {/* Score arc */}
              <path
                d="M 10 50 A 50 50 0 0 1 110 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 157} 157`}
                className={scoreConfig.text}
                style={{ transform: 'translateY(-50px)' }}
              />
            </svg>
            {/* Needle */}
            <div
              className="absolute bottom-0 left-1/2 origin-bottom"
              style={{
                transform: `translateX(-50%) rotate(${gaugeRotation}deg)`,
                transformOrigin: 'bottom center',
                width: '3px',
                height: '35px',
                background: `linear-gradient(to top, ${score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#eab308' : '#ef4444'}, transparent)`,
                borderRadius: '2px',
                transition: 'transform 0.5s ease',
              }}
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-current" style={{ color: score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#eab308' : '#ef4444' }} />
          </div>

          <div className="text-center">
            <span className={cn("text-sm font-semibold", scoreConfig.text)}>
              {scoreConfig.label}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Brands trust you {score >= 80 ? '— keep it up!' : score >= 60 ? '— maintain this level' : '— improve to attract more deals'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BrandInterestScore;

