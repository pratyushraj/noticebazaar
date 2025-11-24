"use client";

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Shield, CheckCircle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AchievementBadgesProps {
  brandDeals?: BrandDeal[];
  earnings?: number;
  protectionScore?: number;
}

interface Achievement {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  checkFn: () => boolean;
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  brandDeals = [],
  earnings = 0,
  protectionScore = 0,
}) => {
  const achievements: Achievement[] = useMemo(() => [
    {
      id: 'first-lakh',
      label: 'First ₹1 Lakh Month',
      icon: Trophy,
      color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      checkFn: () => earnings >= 100000,
    },
    {
      id: 'protection-streak',
      label: '100% Protection Streak',
      icon: Shield,
      color: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      checkFn: () => protectionScore >= 100,
    },
    {
      id: 'zero-overdues',
      label: 'Zero Overdues',
      icon: CheckCircle,
      color: 'bg-green-500/20 border-green-500/30 text-green-400',
      checkFn: () => {
        const now = new Date();
        return !brandDeals.some(deal => {
          if (deal.status !== 'Payment Pending' || deal.payment_received_date) return false;
          const dueDate = new Date(deal.payment_expected_date);
          return dueDate < now;
        });
      },
    },
    {
      id: 'growth',
      label: 'Growing Fast',
      icon: TrendingUp,
      color: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      checkFn: () => brandDeals.length >= 10,
    },
  ], [brandDeals, earnings, protectionScore]);

  const unlockedAchievements = achievements.filter(a => a.checkFn());

  if (unlockedAchievements.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {unlockedAchievements.map((achievement, index) => {
        const Icon = achievement.icon;
        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Badge className={cn(
              "px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold",
              achievement.color
            )}>
              <Icon className="w-3.5 h-3.5" />
              {achievement.label}
            </Badge>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AchievementBadges;

