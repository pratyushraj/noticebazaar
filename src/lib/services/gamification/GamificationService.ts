import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { trackEvent } from '@/lib/utils/analytics';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'deals' | 'earnings' | 'engagement' | 'profile' | 'networking' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: {
    type: string;
    value: number;
    current?: number;
  };
  unlockedAt?: Date;
  progress?: number;
}

export interface CreatorStats {
  level: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  dealsCompleted: number;
  totalEarnings: number;
  averageRating: number;
  followersGained: number;
  brandsWorkedWith: number;
  responseRate: number;
  completionRate: number;
}

export interface GamificationData {
  achievements: Achievement[];
  stats: CreatorStats;
  leaderboard: Array<{
    rank: number;
    creator: string;
    points: number;
    level: number;
  }>;
  dailyChallenges: Array<{
    id: string;
    title: string;
    description: string;
    reward: number;
    completed: boolean;
    expiresAt: Date;
  }>;
  weeklyGoals: Array<{
    id: string;
    title: string;
    current: number;
    target: number;
    reward: number;
    completed: boolean;
  }>;
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  // Deals Category
  {
    id: 'first_deal',
    title: 'First Collaboration',
    description: 'Complete your first brand deal',
    icon: '🎯',
    category: 'deals',
    rarity: 'common',
    points: 100,
    requirements: { type: 'deals_completed', value: 1 }
  },
  {
    id: 'deal_master',
    title: 'Deal Master',
    description: 'Complete 50 brand deals',
    icon: '🏆',
    category: 'deals',
    rarity: 'legendary',
    points: 1000,
    requirements: { type: 'deals_completed', value: 50 }
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Accept a deal within 1 hour of receiving it',
    icon: '⚡',
    category: 'deals',
    rarity: 'rare',
    points: 250,
    requirements: { type: 'quick_accept', value: 1 }
  },

  // Earnings Category
  {
    id: 'first_payment',
    title: 'First Payment',
    description: 'Receive your first payment',
    icon: '💰',
    category: 'earnings',
    rarity: 'common',
    points: 150,
    requirements: { type: 'payments_received', value: 1 }
  },
  {
    id: 'high_earner',
    title: 'High Earner',
    description: 'Earn ₹1,00,000+ in total',
    icon: '💎',
    category: 'earnings',
    rarity: 'epic',
    points: 750,
    requirements: { type: 'total_earnings', value: 100000 }
  },
  {
    id: 'millionaire',
    title: 'Millionaire Creator',
    description: 'Earn ₹10,00,000+ in total',
    icon: '👑',
    category: 'earnings',
    rarity: 'legendary',
    points: 2000,
    requirements: { type: 'total_earnings', value: 1000000 }
  },

  // Engagement Category
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Work with 10 different brands',
    icon: '🦋',
    category: 'engagement',
    rarity: 'rare',
    points: 300,
    requirements: { type: 'unique_brands', value: 10 }
  },
  {
    id: 'networker',
    title: 'Network Master',
    description: 'Work with 50 different brands',
    icon: '🤝',
    category: 'networking',
    rarity: 'epic',
    points: 800,
    requirements: { type: 'unique_brands', value: 50 }
  },

  // Profile Category
  {
    id: 'profile_complete',
    title: 'Profile Complete',
    description: 'Complete 100% of your profile',
    icon: '✅',
    category: 'profile',
    rarity: 'common',
    points: 200,
    requirements: { type: 'profile_completion', value: 100 }
  },
  {
    id: 'verified_creator',
    title: 'Verified Creator',
    description: 'Get verified as a premium creator',
    icon: '✓',
    category: 'profile',
    rarity: 'rare',
    points: 500,
    requirements: { type: 'verification_status', value: 1 }
  },

  // Milestones
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Maintain a 30-day activity streak',
    icon: '🔥',
    category: 'milestone',
    rarity: 'epic',
    points: 600,
    requirements: { type: 'streak_days', value: 30 }
  },
  {
    id: 'rating_excellence',
    title: 'Excellence',
    description: 'Maintain a 4.8+ average rating',
    icon: '⭐',
    category: 'milestone',
    rarity: 'rare',
    points: 400,
    requirements: { type: 'average_rating', value: 4.8 }
  }
];

// Gamification service
export class GamificationService {
  static calculateLevel(points: number): number {
    // Level calculation: level = floor(sqrt(points / 100)) + 1
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  static getPointsForLevel(level: number): number {
    // Points needed for level: 100 * (level - 1)^2
    return 100 * Math.pow(level - 1, 2);
  }

  static getPointsToNextLevel(currentPoints: number): number {
    const currentLevel = this.calculateLevel(currentPoints);
    const nextLevelPoints = this.getPointsForLevel(currentLevel + 1);
    return nextLevelPoints - currentPoints;
  }

  static checkAchievementUnlock(achievement: Achievement, stats: CreatorStats): boolean {
    const requirement = achievement.requirements;

    switch (requirement.type) {
      case 'deals_completed':
        return stats.dealsCompleted >= requirement.value;
      case 'total_earnings':
        return stats.totalEarnings >= requirement.value;
      case 'unique_brands':
        return stats.brandsWorkedWith >= requirement.value;
      case 'profile_completion':
        // This would need profile completion percentage
        return true; // Placeholder
      case 'verification_status':
        // This would check verification status
        return true; // Placeholder
      case 'streak_days':
        return stats.longestStreak >= requirement.value;
      case 'average_rating':
        return stats.averageRating >= requirement.value;
      default:
        return false;
    }
  }

  static getRarityColor(rarity: Achievement['rarity']): string {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
    }
  }

  static generateDailyChallenges(creatorLevel: number, completedToday: string[]): Array<any> {
    const challenges = [
      {
        id: 'view_profile',
        title: 'Profile Check',
        description: 'Update your profile information',
        reward: 10,
        difficulty: 'easy'
      },
      {
        id: 'share_link',
        title: 'Share Your Link',
        description: 'Share your collab link on social media',
        reward: 25,
        difficulty: 'medium'
      },
      {
        id: 'respond_offer',
        title: 'Quick Response',
        description: 'Respond to a brand offer within 24 hours',
        reward: 50,
        difficulty: 'medium'
      },
      {
        id: 'complete_deal',
        title: 'Deal Closer',
        description: 'Complete a brand collaboration',
        reward: 100,
        difficulty: 'hard'
      },
      {
        id: 'rate_brand',
        title: 'Feedback Master',
        description: 'Leave a rating for a completed deal',
        reward: 15,
        difficulty: 'easy'
      }
    ];

    // Filter out completed challenges and select based on level
    const availableChallenges = challenges
      .filter(challenge => !completedToday.includes(challenge.id))
      .slice(0, Math.min(3, Math.ceil(creatorLevel / 5)));

    return availableChallenges.map(challenge => ({
      ...challenge,
      completed: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }));
  }

  static generateWeeklyGoals(creatorStats: CreatorStats): Array<any> {
    const baseGoals = [
      {
        id: 'weekly_deals',
        title: 'Weekly Deals',
        description: 'Complete deals this week',
        current: creatorStats.dealsCompleted % 10, // This week
        target: Math.max(1, Math.min(5, Math.ceil(creatorStats.dealsCompleted / 20) + 1)),
        reward: 200
      },
      {
        id: 'weekly_earnings',
        title: 'Weekly Earnings',
        description: 'Earn money this week',
        current: creatorStats.totalEarnings % 10000, // This week
        target: Math.max(5000, Math.min(50000, creatorStats.totalEarnings / 10)),
        reward: 150
      },
      {
        id: 'weekly_responses',
        title: 'Quick Responder',
        description: 'Respond to offers within 24 hours',
        current: Math.floor(creatorStats.responseRate * 10), // Mock current
        target: 7, // 7 out of 10 offers
        reward: 100
      }
    ];

    return baseGoals.map(goal => ({
      ...goal,
      completed: goal.current >= goal.target
    }));
  }
}

// React hook for gamification
export const useGamification = () => {
  const { profile } = useSession();
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGamificationData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      // Mock data - in real app, this would come from API
      const mockStats: CreatorStats = {
        level: GamificationService.calculateLevel(1250),
        totalPoints: 1250,
        currentStreak: 7,
        longestStreak: 23,
        dealsCompleted: 24,
        totalEarnings: 125000,
        averageRating: 4.7,
        followersGained: 15000,
        brandsWorkedWith: 12,
        responseRate: 89,
        completionRate: 95
      };

      // Check unlocked achievements
      const unlockedAchievements = ACHIEVEMENTS.filter(achievement =>
        GamificationService.checkAchievementUnlock(achievement, mockStats)
      ).map(achievement => ({
        ...achievement,
        unlockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random unlock date
        progress: achievement.requirements.current ?
          (achievement.requirements.current / achievement.requirements.value) * 100 : 100
      }));

      // Generate daily challenges
      const dailyChallenges = GamificationService.generateDailyChallenges(mockStats.level, []);

      // Generate weekly goals
      const weeklyGoals = GamificationService.generateWeeklyGoals(mockStats);

      // Mock leaderboard
      const leaderboard = [
        { rank: 1, creator: 'You', points: mockStats.totalPoints, level: mockStats.level },
        { rank: 2, creator: 'Creator Pro', points: 2100, level: 6 },
        { rank: 3, creator: 'Influencer X', points: 1850, level: 5 },
        { rank: 4, creator: 'Content King', points: 1620, level: 5 },
        { rank: 5, creator: 'Social Star', points: 1480, level: 4 }
      ];

      setGamificationData({
        achievements: ACHIEVEMENTS.map(achievement => {
          const unlocked = unlockedAchievements.find(u => u.id === achievement.id);
          return unlocked || achievement;
        }),
        stats: mockStats,
        leaderboard,
        dailyChallenges,
        weeklyGoals
      });
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  const awardPoints = useCallback(async (points: number, reason: string) => {
    if (!gamificationData) return;

    trackEvent('points_awarded', { points, reason, creator_id: profile?.id });

    // Update local state optimistically
    setGamificationData(prev => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        totalPoints: prev.stats.totalPoints + points,
        level: GamificationService.calculateLevel(prev.stats.totalPoints + points)
      }
    } : null);
  }, [gamificationData, profile?.id]);

  const completeChallenge = useCallback(async (challengeId: string) => {
    if (!gamificationData) return;

    setGamificationData(prev => prev ? {
      ...prev,
      dailyChallenges: prev.dailyChallenges.map(challenge =>
        challenge.id === challengeId ? { ...challenge, completed: true } : challenge
      )
    } : null);

    // Award points for completed challenge
    const challenge = gamificationData.dailyChallenges.find(c => c.id === challengeId);
    if (challenge) {
      await awardPoints(challenge.reward, `Completed challenge: ${challenge.title}`);
    }
  }, [gamificationData, awardPoints]);

  return {
    gamificationData,
    loading,
    awardPoints,
    completeChallenge,
    refreshData: loadGamificationData
  };
};

// Achievement notification component will be in a separate file