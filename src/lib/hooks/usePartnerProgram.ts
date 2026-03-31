import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from './useSupabaseQuery';
import type { PartnerTier } from '@/lib/utils/partner';

export interface ReferralLinkRecord {
  code: string;
  url?: string | null;
}

export interface PartnerStatsRecord {
  total_earnings: number;
  this_month_earnings: number;
  active_referrals: number;
  tier: PartnerTier;
  total_referrals: number;
  free_months_credit: number;
  total_clicks?: number;
  total_signups?: number;
  total_paid_users?: number;
  current_month_earnings?: number;
  partner_rank?: number;
  next_reward_referrals?: number;
  next_payout_date?: string | null;
  updated_at?: string;
}

export interface PartnerEarningRecord {
  id: string;
  created_at: string;
  amount: number;
  net_amount: number;
  type: 'cash' | 'voucher' | 'free_month';
  status?: string;
}

export interface PartnerMilestoneRecord {
  id?: string;
  milestone_name: string;
  reward_value: number;
  reward_type: 'voucher' | 'cash' | 'free_month';
  achieved_at?: string | null;
  brand?: string | null;
}

export interface PartnerLeaderboardRecord {
  name: string;
  referrals: number;
  earnings: number;
  tier: PartnerTier;
  avatar?: string | null;
  isCurrentUser?: boolean;
}

export interface PartnerPerformanceRecord {
  total_clicks: number;
  total_signups: number;
  total_paid_users: number;
}

export interface PartnerRankRecord {
  rank: number;
  totalPartners: number;
}

export interface RewardHistoryRecord {
  id: string;
  reward_type: 'cash' | 'voucher' | 'free_month';
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const fetchPartnerStats = async (userId?: string): Promise<PartnerStatsRecord | null> => {
  if (!userId) return null;
  const { data, error } = await (supabase
    .from('partner_stats') as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: PartnerStatsRecord | null; error: { message?: string } | null }>;
        };
      };
    })
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Failed to load partner stats');
  return data;
};

const fetchPartnerEarnings = async (userId?: string, limit = 20): Promise<PartnerEarningRecord[]> => {
  if (!userId) return [];
  const { data, error } = await (supabase
    .from('partner_earnings') as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (count: number) => Promise<{ data: PartnerEarningRecord[] | null; error: { message?: string } | null }>;
          };
        };
      };
    })
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message || 'Failed to load partner earnings');
  return data || [];
};

export const useReferralLink = (userId?: string) =>
  useSupabaseQuery<ReferralLinkRecord | null>(
    ['partner-program', 'referral-link', userId],
    async () => {
      if (!userId) return null;
      const { data, error } = await (supabase
        .from('referral_links') as unknown as {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              maybeSingle: () => Promise<{ data: ReferralLinkRecord | null; error: { message?: string } | null }>;
            };
          };
        })
        .select('code, url')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error(error.message || 'Failed to load referral link');
      return data;
    },
    { enabled: !!userId }
  );

export const usePartnerStats = (userId?: string) =>
  useSupabaseQuery<PartnerStatsRecord | null>(
    ['partner-program', 'stats', userId],
    () => fetchPartnerStats(userId),
    { enabled: !!userId }
  );

export const usePartnerEarnings = (userId?: string, limit = 20) =>
  useSupabaseQuery<PartnerEarningRecord[]>(
    ['partner-program', 'earnings', userId, limit],
    () => fetchPartnerEarnings(userId, limit),
    { enabled: !!userId }
  );

export const usePartnerMilestones = (userId?: string) =>
  useSupabaseQuery<PartnerMilestoneRecord[]>(
    ['partner-program', 'milestones', userId],
    async () => {
      if (!userId) return [];
      const { data, error } = await (supabase
        .from('partner_milestones') as unknown as {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              order: (column: string, options: { ascending: boolean }) => Promise<{ data: PartnerMilestoneRecord[] | null; error: { message?: string } | null }>;
            };
          };
        })
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });
      if (error) throw new Error(error.message || 'Failed to load partner milestones');
      return data || [];
    },
    { enabled: !!userId }
  );

export const usePartnerLeaderboard = (limit = 10) =>
  useSupabaseQuery<PartnerLeaderboardRecord[]>(
    ['partner-program', 'leaderboard', limit],
    async () => {
      const { data, error } = await (supabase.rpc('get_partner_leaderboard', { limit_count: limit }) as unknown as Promise<{
        data: PartnerLeaderboardRecord[] | null;
        error: { message?: string } | null;
      }>);
      if (error) throw new Error(error.message || 'Failed to load leaderboard');
      return data || [];
    }
  );

export const usePartnerPerformance = (userId?: string) =>
  useSupabaseQuery<PartnerPerformanceRecord | null>(
    ['partner-program', 'performance', userId],
    async () => {
      const stats = await fetchPartnerStats(userId);
      if (!stats) return null;
      return {
        total_clicks: stats.total_clicks || 0,
        total_signups: stats.total_signups || 0,
        total_paid_users: stats.total_paid_users || 0,
      };
    },
    { enabled: !!userId }
  );

export const usePartnerRank = (userId?: string) =>
  useSupabaseQuery<PartnerRankRecord | null>(
    ['partner-program', 'rank', userId],
    async () => {
      const stats = await fetchPartnerStats(userId);
      if (!stats) return null;
      return {
        rank: stats.partner_rank || 0,
        totalPartners: 0,
      };
    },
    { enabled: !!userId }
  );

export const useProjectedEarnings = (userId?: string) =>
  useSupabaseQuery<number | null>(
    ['partner-program', 'projected-earnings', userId],
    async () => {
      const stats = await fetchPartnerStats(userId);
      return stats?.current_month_earnings ?? stats?.this_month_earnings ?? null;
    },
    { enabled: !!userId }
  );

export const useRewardHistory = (userId?: string, limit = 20) =>
  useSupabaseQuery<RewardHistoryRecord[]>(
    ['partner-program', 'reward-history', userId, limit],
    async () => {
      const earnings = await fetchPartnerEarnings(userId, limit);
      return asArray<PartnerEarningRecord>(earnings).map((entry) => ({
        id: entry.id,
        reward_type: entry.type,
        amount: entry.type === 'free_month' ? 1 : entry.net_amount || entry.amount,
        status: entry.status || 'paid',
        description: entry.type === 'voucher' ? 'Voucher reward' : entry.type === 'free_month' ? 'Free month credit' : 'Commission payout',
        created_at: entry.created_at,
      }));
    },
    { enabled: !!userId }
  );

export const useRefreshPartnerStats = () =>
  useMutation({
    mutationFn: async (userId?: string) => {
      if (!userId) return null;
      const { data, error } = await (supabase.rpc('refresh_partner_stats', { user_id: userId }) as unknown as Promise<{
        data: unknown;
        error: { message?: string } | null;
      }>);
      if (error) throw new Error(error.message || 'Failed to refresh partner stats');
      return data;
    },
  });
