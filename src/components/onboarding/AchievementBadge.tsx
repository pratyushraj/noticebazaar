"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Award, Trophy, Star, Zap, Shield, TrendingUp, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export type AchievementId = 
  | 'first-deal'
  | 'first-contract-review'
  | 'first-message'
  | 'first-payment'
  | 'protection-setup'
  | 'streak-7'
  | 'streak-30'
  | 'earnings-1l'
  | 'earnings-10l';

interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const achievements: Record<AchievementId, Achievement> = {
  'first-deal': {
    id: 'first-deal',
    title: 'First Deal',
    description: 'Added your first brand deal',
    icon: Trophy,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    rarity: 'common'
  },
  'first-contract-review': {
    id: 'first-contract-review',
    title: 'Contract Reviewer',
    description: 'Reviewed your first contract',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    rarity: 'common'
  },
  'first-message': {
    id: 'first-message',
    title: 'Connected',
    description: 'Sent your first message to advisor',
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    rarity: 'common'
  },
  'first-payment': {
    id: 'first-payment',
    title: 'First Payment',
    description: 'Tracked your first payment',
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    rarity: 'common'
  },
  'protection-setup': {
    id: 'protection-setup',
    title: 'Protected',
    description: 'Set up content protection',
    icon: Shield,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    rarity: 'rare'
  },
  'streak-7': {
    id: 'streak-7',
    title: 'Week Warrior',
    description: '7-day streak',
    icon: Star,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    rarity: 'rare'
  },
  'streak-30': {
    id: 'streak-30',
    title: 'Month Master',
    description: '30-day streak',
    icon: Award,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    rarity: 'epic'
  },
  'earnings-1l': {
    id: 'earnings-1l',
    title: 'Lakh Club',
    description: 'Tracked ₹1L+ in earnings',
    icon: Trophy,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    rarity: 'rare'
  },
  'earnings-10l': {
    id: 'earnings-10l',
    title: 'Crore Club',
    description: 'Tracked ₹10L+ in earnings',
    icon: Award,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    rarity: 'legendary'
  }
};

interface AchievementBadgeProps {
  achievementId: AchievementId;
  showNotification?: boolean;
  onClose?: () => void;
}

export const AchievementBadge = ({ achievementId, showNotification = false, onClose }: AchievementBadgeProps) => {
  const achievement = achievements[achievementId];
  const Icon = achievement.icon;

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          className="fixed top-20 right-4 z-50 pointer-events-auto"
        >
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className={`${achievement.bgColor} backdrop-blur-[40px] rounded-[24px] p-5 border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-sm`}
          >
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className={`w-16 h-16 rounded-full ${achievement.bgColor} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-8 h-8 ${achievement.color}`} />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-purple-400 uppercase tracking-wide">
                    {achievement.rarity}
                  </span>
                  <Award className={`w-4 h-4 ${achievement.color}`} />
                </div>
                <h3 className="font-bold text-[17px] text-white mb-1">{achievement.title}</h3>
                <p className="text-[13px] text-purple-200">{achievement.description}</p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4 text-purple-300" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AchievementDisplayProps {
  earnedAchievements: AchievementId[];
  className?: string;
}

export const AchievementDisplay = ({ earnedAchievements, className }: AchievementDisplayProps) => {
  return (
    <div className={className}>
      <h3 className="font-semibold text-[17px] text-white mb-4">Achievements</h3>
      <div className="grid grid-cols-3 gap-3">
        {Object.values(achievements).map((achievement) => {
          const Icon = achievement.icon;
          const isEarned = earnedAchievements.includes(achievement.id);
          
          return (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${achievement.bgColor} rounded-xl p-4 border border-white/10 text-center ${
                isEarned ? 'opacity-100' : 'opacity-40 grayscale'
              }`}
            >
              <Icon className={`w-6 h-6 ${achievement.color} mx-auto mb-2`} />
              <p className="text-[11px] font-medium text-white">{achievement.title}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export { achievements };
export type { Achievement };

