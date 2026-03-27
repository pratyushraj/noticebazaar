"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Crown, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  earnedDate?: Date;
  progress?: number; // 0-100
  requirement: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgesProps {
  achievements?: Achievement[];
  isDark?: boolean;
  showUnlocked?: boolean;
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  achievements = [],
  isDark = true,
  showUnlocked = true,
}) => {
  const defaultAchievements: Achievement[] = [
    {
      id: 'first-deal',
      title: 'First Deal',
      description: 'Complete your first collaborative deal',
      icon: <Zap className="w-6 h-6" />,
      earned: true,
      earnedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      rarity: 'common',
      requirement: 'Complete 1 deal',
    },
    {
      id: '5-deals',
      title: 'Rising Star',
      description: 'Complete 5 collaborative deals',
      icon: <Star className="w-6 h-6" />,
      earned: true,
      earnedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      rarity: 'rare',
      requirement: 'Complete 5 deals',
    },
    {
      id: 'payment-master',
      title: 'Payment Master',
      description: 'Receive 100% on-time payments',
      icon: <Trophy className="w-6 h-6" />,
      earned: true,
      earnedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      rarity: 'epic',
      requirement: 'Receive 10+ on-time payments',
    },
    {
      id: 'brand-favorite',
      title: 'Brand Favorite',
      description: 'Work with 10+ different brands',
      icon: <Heart className="w-6 h-6" />,
      earned: false,
      progress: 60,
      rarity: 'epic',
      requirement: 'Work with 10 brands (6/10)',
    },
    {
      id: 'income-milestone',
      title: '₹1L Club',
      description: 'Earn ₹1 lakh from deals',
      icon: <Crown className="w-6 h-6" />,
      earned: false,
      progress: 45,
      rarity: 'legendary',
      requirement: 'Earn ₹1,00,000 (₹45k earned)',
    },
    {
      id: 'speedster',
      title: 'Speedster',
      description: 'Deliver content within 3 days',
      icon: <Zap className="w-6 h-6" />,
      earned: false,
      progress: 80,
      rarity: 'rare',
      requirement: 'Quick delivery (4/5 deals)',
    },
  ];

  const displayAchievements = achievements.length > 0 ? achievements : defaultAchievements;
  const unlockedAchievements = displayAchievements.filter(a => a.earned);
  const lockedAchievements = displayAchievements.filter(a => !a.earned);

  const rarityConfig = {
    common: {
      bg: 'from-gray-500 to-slate-600',
      border: 'border-gray-500/30',
      glow: 'shadow-gray-500/20',
      text: 'text-gray-300',
    },
    rare: {
      bg: 'from-blue-500 to-cyan-600',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/30',
      text: 'text-blue-300',
    },
    epic: {
      bg: 'from-purple-500 to-violet-600',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/30',
      text: 'text-purple-300',
    },
    legendary: {
      bg: 'from-yellow-500 to-orange-600',
      border: 'border-yellow-500/30',
      glow: 'shadow-yellow-500/30',
      text: 'text-yellow-300',
    },
  };

  const AchievementCard = ({ achievement, idx }: { achievement: Achievement; idx: number }) => {
    const config = rarityConfig[achievement.rarity];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.05 }}
        whileHover={{ scale: 1.05, y: -4 }}
        className={cn(
          'relative group cursor-pointer',
          achievement.earned ? 'opacity-100' : 'opacity-75 hover:opacity-90'
        )}
      >
        {/* Card */}
        <div
          className={cn(
            'p-4 rounded-xl border text-center transition-all duration-300',
            isDark
              ? `${config.border} bg-white/5 hover:bg-white/10 ${config.glow}`
              : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
          )}
        >
          {/* Badge Glow Effect */}
          {achievement.earned && (
            <div className={cn(
              'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 blur-lg transition-opacity',
              `bg-gradient-to-r ${config.bg}`
            )} />
          )}

          <div className="relative z-10">
            {/* Icon */}
            <motion.div
              animate={achievement.earned ? { y: [0, -4, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                'mb-2 mx-auto w-12 h-12 rounded-full flex items-center justify-center',
                isDark
                  ? `bg-gradient-to-br ${config.bg}`
                  : 'bg-gradient-to-br from-slate-100 to-slate-200'
              )}
            >
              <span className={isDark ? 'text-white' : 'text-slate-600'}>
                {achievement.icon}
              </span>
            </motion.div>

            {/* Title & Description */}
            <h4 className={cn(
              'text-sm font-bold mb-1',
              isDark ? 'text-white' : 'text-slate-900'
            )}>
              {achievement.title}
            </h4>
            <p className={cn(
              'text-xs mb-3',
              isDark ? 'text-white/60' : 'text-slate-600'
            )}>
              {achievement.description}
            </p>

            {/* Progress or Earned Badge */}
            {achievement.earned ? (
              <Badge className={cn(
                'bg-gradient-to-r text-xs font-bold',
                config.bg
              )}>
                ✨ Unlocked
              </Badge>
            ) : (
              <div className="space-y-2">
                <div className={cn(
                  'h-1.5 bg-white/10 rounded-full overflow-hidden',
                  isDark ? 'bg-white/10' : 'bg-slate-200'
                )}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn(
                      'h-full bg-gradient-to-r',
                      config.bg
                    )}
                  />
                </div>
                <p className={cn(
                  'text-xs font-semibold',
                  isDark ? 'text-white/70' : 'text-slate-600'
                )}>
                  {achievement.progress}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none z-20',
            isDark
              ? 'bg-slate-900 text-white border border-white/20'
              : 'bg-slate-900 text-white'
          )}
        >
          {achievement.requirement}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <Card className={cn(
      'border transition-all duration-300',
      isDark
        ? 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/30'
        : 'bg-white border-slate-200 shadow-sm'
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className={cn(
            'text-base font-bold tracking-tight mb-2',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            🏆 Achievements
          </h3>
          <p className={cn(
            'text-sm',
            isDark ? 'text-white/60' : 'text-slate-600'
          )}>
            {unlockedAchievements.length} unlocked • {lockedAchievements.length} to go
          </p>
        </div>

        {/* Unlocked Achievements */}
        {showUnlocked && unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <p className={cn(
              'text-xs font-bold uppercase tracking-widest mb-3 opacity-60',
              isDark ? 'text-white' : 'text-slate-600'
            )}>
              Unlocked
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {unlockedAchievements.map((achievement, idx) => (
                <AchievementCard key={achievement.id} achievement={achievement} idx={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <p className={cn(
              'text-xs font-bold uppercase tracking-widest mb-3 opacity-60',
              isDark ? 'text-white' : 'text-slate-600'
            )}>
              Next Goals
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {lockedAchievements.map((achievement, idx) => (
                <AchievementCard key={achievement.id} achievement={achievement} idx={idx + unlockedAchievements.length} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementBadges;
