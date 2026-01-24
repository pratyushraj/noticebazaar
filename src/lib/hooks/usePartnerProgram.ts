import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

export interface ReferralLink {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  subscribed: boolean;
  first_payment_at: string | null;
  created_at: string;
}

export interface PartnerEarning {
  id: string;
  user_id: string;
  amount: number;
  type: 'cash' | 'voucher' | 'credit';
  source: 'referral' | 'milestone';
  description: string | null;
  tds_applied: boolean;
  tds_amount: number;
  net_amount: number;
  referral_id: string | null;
  milestone_id: string | null;
  created_at: string;
}

export interface PartnerStats {
  user_id: string;
  total_referrals: number;
  active_referrals: number;
  total_earnings: number;
  tier: 'starter' | 'partner' | 'growth' | 'elite' | 'pro';
  next_payout_date: string | null;
  free_months_credit: number;
  updated_at: string;
  // New fields
  total_clicks?: number;
  total_signups?: number;
  total_paid_users?: number;
  current_month_earnings?: number;
  partner_rank?: number | null;
  next_reward_referrals?: number | null;
  created_at?: string;
}

export interface PartnerReward {
  id: string;
  user_id: string;
  reward_type: 'cash' | 'voucher' | 'free_month';
  amount: number;
  status: 'paid' | 'unlocked' | 'locked';
  description: string | null;
  created_at: string;
}

export interface ReferralEvent {
  id: string;
  user_id: string;
  event_type: 'click' | 'signup' | 'paid';
  referral_id: string | null;
  metadata: any;
  timestamp: string;
}

export interface PartnerMilestone {
  id: string;
  user_id: string;
  milestone_name: string;
  reward_type: 'voucher' | 'credit';
  reward_value: number;
  achieved_at: string;
}

/**
 * Get referral link for current user
 */
export const useReferralLink = (userId: string | undefined) => {
  const queryFn = useCallback(async () => {
    if (!userId) return null;

    try {
      // First try to get existing link
      // @ts-expect-error - Table doesn't exist in types yet
      const { data: existingLink, error: fetchError } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('referral_links') as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      // Check if error is 404 (table doesn't exist)
      if (fetchError && (fetchError as any).status === 404) {
        // Table doesn't exist yet - migrations not run
        return null;
      }

      if (!fetchError && existingLink) {
        return existingLink as ReferralLink;
      }

      // If no link exists, create one via function
      // @ts-expect-error - Function types will be updated after migration
      const { data: code, error: createError } = await (
        // @ts-expect-error - Function doesn't exist in types yet
        supabase.rpc('get_or_create_referral_link', { user_uuid: userId }) as any
      );

      if (createError) {
        const errorCode = (createError as any).code;
        const errorStatus = (createError as any).status || (createError as any).statusCode;
        const errorMessage = String((createError as any).message || (createError as any).details || '').toLowerCase();
        const errorDetails = String((createError as any).details || '').toLowerCase();
        
        // For PGRST202/404, return null instead of throwing (migrations not run)
        const isMigrationError = 
          errorCode === 'PGRST202' || 
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorStatus === 404 ||
          errorMessage.includes('not found') ||
          errorMessage.includes('schema cache') ||
          errorMessage.includes('could not find') ||
          errorMessage.includes('searched for the function') ||
          errorMessage.includes('no matches were found') ||
          errorDetails.includes('not found') ||
          errorDetails.includes('schema cache') ||
          errorDetails.includes('could not find');
        
        if (isMigrationError) {
          return null; // Migrations not run - silently return
        }
        // Only log and throw unexpected errors (not migration-related)
        console.error('Error creating referral link:', createError);
        throw createError;
      }

      // Fetch the created link
      // @ts-expect-error - Table doesn't exist in types yet
      const { data: newLink, error: newLinkError } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('referral_links') as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (newLinkError) {
        if ((newLinkError as any).status === 404) {
          return null; // Table doesn't exist
        }
        throw newLinkError;
      }

      return newLink as ReferralLink;
    } catch (err: any) {
      // Handle 404/PGRST202 errors gracefully (table/function doesn't exist)
      if (err?.status === 404 || 
          err?.code === 'PGRST116' || 
          err?.code === 'PGRST202' ||
          err?.code === '42P01' ||
          err?.message?.includes('not found') ||
          err?.message?.includes('schema cache')) {
        return null; // Table/function doesn't exist yet
      }
      throw err;
    }
  }, [userId]);

  return useSupabaseQuery<ReferralLink | null, Error>(
    ['referralLink', userId],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch referral link',
    }
  );
};

/**
 * Get partner stats for current user
 */
export const usePartnerStats = (userId: string | undefined) => {
  const queryFn = useCallback(async () => {
    if (!userId) return null;

    try {
      // @ts-expect-error - Table types will be updated after migration
      const { data, error } = await (supabase
        // @ts-expect-error - Table types will be updated after migration
        .from('partner_stats') as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle missing rows gracefully

      // Check if table doesn't exist (404, 406) or RLS blocking
      if (error && (
        (error as any).status === 404 || 
        (error as any).status === 406 ||
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.code === 'PGRST301' // RLS policy violation
      )) {
        return null; // Table doesn't exist yet or access denied - migrations not run
      }

      if (error) {
        // If stats don't exist, initialize them
        if (error.code === 'PGRST116') {
          // @ts-expect-error - Function doesn't exist in types yet
          await (supabase.rpc('initialize_partner_stats', { user_uuid: userId }) as any);
          // Retry fetch
          // @ts-expect-error - Table doesn't exist in types yet
          const { data: newData, error: retryError } = await (supabase
            // @ts-expect-error - Table doesn't exist in types yet
            .from('partner_stats') as any)
            .select('*')
            .eq('user_id', userId)
            .single();

          if (retryError) {
            if ((retryError as any).status === 404) {
              return null; // Table still doesn't exist
            }
            throw retryError;
          }
          return newData as PartnerStats;
        }
        throw error;
      }

      return data as PartnerStats;
    } catch (err: any) {
      // Handle 404/406/PGRST202 errors gracefully (table/function doesn't exist or RLS blocking)
      if (err?.status === 404 || 
          err?.status === 406 ||
          err?.code === 'PGRST116' || 
          err?.code === 'PGRST202' ||
          err?.code === 'PGRST301' ||
          err?.code === '42P01' ||
          err?.message?.includes('not found') ||
          err?.message?.includes('schema cache') ||
          err?.message?.includes('permission denied')) {
        return null; // Table/function doesn't exist yet or access denied
      }
      throw err;
    }
  }, [userId]);

  return useSupabaseQuery<PartnerStats | null, Error>(
    ['partnerStats', userId],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch partner stats',
    }
  );
};

/**
 * Get partner earnings
 */
export const usePartnerEarnings = (userId: string | undefined, limit = 50) => {
  const queryFn = useCallback(async () => {
    if (!userId) return [];

    try {
      // @ts-expect-error - Table doesn't exist in types yet
      const { data, error } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('partner_earnings') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Check if table doesn't exist (404, 406) or RLS blocking
      if (error && (
        (error as any).status === 404 || 
        (error as any).status === 406 ||
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.code === 'PGRST301'
      )) {
        return []; // Table doesn't exist yet or access denied - return empty array
      }

      if (error) {
        throw error;
      }

      return (data || []) as PartnerEarning[];
    } catch (err: any) {
      // Handle 404/406/PGRST202 errors gracefully (table doesn't exist or RLS blocking)
      if (err?.status === 404 || 
          err?.status === 406 ||
          err?.code === 'PGRST116' || 
          err?.code === 'PGRST202' ||
          err?.code === 'PGRST301' ||
          err?.code === '42P01' ||
          err?.message?.includes('not found') ||
          err?.message?.includes('schema cache') ||
          err?.message?.includes('permission denied')) {
        return []; // Table doesn't exist yet or access denied
      }
      throw err;
    }
  }, [userId, limit]);

  return useSupabaseQuery<PartnerEarning[], Error>(
    ['partnerEarnings', userId, limit],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch earnings',
    }
  );
};

/**
 * Get partner milestones
 */
export const usePartnerMilestones = (userId: string | undefined) => {
  const queryFn = useCallback(async () => {
    if (!userId) return [];

    try {
      // @ts-expect-error - Table doesn't exist in types yet
      const { data, error } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('partner_milestones') as any)
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });

      // Check if table doesn't exist (404, 406) or RLS blocking
      if (error && (
        (error as any).status === 404 || 
        (error as any).status === 406 ||
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.code === 'PGRST301'
      )) {
        return []; // Table doesn't exist yet or access denied - return empty array
      }

      if (error) {
        throw error;
      }

      return (data || []) as PartnerMilestone[];
    } catch (err: any) {
      // Handle 404/406/PGRST202 errors gracefully (table doesn't exist or RLS blocking)
      if (err?.status === 404 || 
          err?.status === 406 ||
          err?.code === 'PGRST116' || 
          err?.code === 'PGRST202' ||
          err?.code === 'PGRST301' ||
          err?.code === '42P01' ||
          err?.message?.includes('not found') ||
          err?.message?.includes('schema cache') ||
          err?.message?.includes('permission denied')) {
        return []; // Table doesn't exist yet or access denied
      }
      throw err;
    }
  }, [userId]);

  return useSupabaseQuery<PartnerMilestone[], Error>(
    ['partnerMilestones', userId],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch milestones',
    }
  );
};

/**
 * Get referrals list
 */
export const useReferrals = (userId: string | undefined) => {
  const queryFn = useCallback(async () => {
    if (!userId) return [];

    try {
      // @ts-expect-error - Table doesn't exist in types yet
      const { data, error } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('referrals') as any)
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      // Check if table doesn't exist (404, 406) or RLS blocking
      if (error && (
        (error as any).status === 404 || 
        (error as any).status === 406 ||
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.code === 'PGRST301'
      )) {
        return []; // Table doesn't exist yet or access denied - return empty array
      }

      if (error) {
        throw error;
      }

      return (data || []) as Referral[];
    } catch (err: any) {
      // Handle 404/406/PGRST202 errors gracefully (table doesn't exist or RLS blocking)
      if (err?.status === 404 || 
          err?.status === 406 ||
          err?.code === 'PGRST116' || 
          err?.code === 'PGRST202' ||
          err?.code === 'PGRST301' ||
          err?.code === '42P01' ||
          err?.message?.includes('not found') ||
          err?.message?.includes('schema cache') ||
          err?.message?.includes('permission denied')) {
        return []; // Table doesn't exist yet or access denied
      }
      throw err;
    }
  }, [userId]);

  return useSupabaseQuery<Referral[], Error>(
    ['referrals', userId],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch referrals',
    }
  );
};

/**
 * Get leaderboard (top partners)
 */
export const usePartnerLeaderboard = (limit = 10) => {
  const queryFn = useCallback(async () => {
    try {
      // @ts-expect-error - Table types will be updated after migration
      const { data, error } = await (supabase
        // @ts-expect-error - Table types will be updated after migration
        .from('partner_stats') as any)
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('total_earnings', { ascending: false })
        .limit(limit);

      // Check if table doesn't exist (404, 406) or RLS blocking
      if (error && (
        (error as any).status === 404 || 
        (error as any).status === 406 ||
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.code === 'PGRST301'
      )) {
        return []; // Table doesn't exist yet or access denied - return empty array
      }

      if (error) {
        throw error;
      }

      return (data || []) as (PartnerStats & {
        profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
      })[];
    } catch (err: any) {
      // Handle 404/406/PGRST202 errors gracefully (table doesn't exist or RLS blocking)
      if (err?.status === 404 || 
          err?.status === 406 ||
          err?.code === 'PGRST116' || 
          err?.code === 'PGRST202' ||
          err?.code === 'PGRST301' ||
          err?.code === '42P01' ||
          err?.message?.includes('not found') ||
          err?.message?.includes('schema cache') ||
          err?.message?.includes('permission denied')) {
        return []; // Table doesn't exist yet or access denied
      }
      throw err;
    }
  }, [limit]);

  return useSupabaseQuery<
    (PartnerStats & {
      profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
    })[],
    Error
  >(['partnerLeaderboard', limit], queryFn, {
    errorMessage: 'Failed to fetch leaderboard',
  });
};

/**
 * Refresh partner stats
 */
export const useRefreshPartnerStats = () => {
    return useSupabaseMutation<void, Error, string>(
      async (userId) => {
        // Try new complete refresh function first, fallback to old one
        // @ts-expect-error - Function doesn't exist in types yet
        let { error } = await (supabase.rpc('refresh_partner_stats_complete', {
          p_user_id: userId,
        }) as any);

        // If new function doesn't exist, try old one
        if (error && (error.code === 'PGRST202' || (error as any).status === 404)) {
          // @ts-expect-error - Function doesn't exist in types yet
          const oldResult = await (supabase.rpc('refresh_partner_stats', {
            p_user_id: userId,
          }) as any);
          error = oldResult.error;
        }

      if (error) {
        // Handle function not found gracefully
        if (error.code === 'PGRST202' || 
            error.code === 'PGRST116' ||
            (error as any).status === 404 ||
            error.message?.includes('not found') ||
            error.message?.includes('schema cache')) {
          // Function doesn't exist yet - migrations not run
          return; // Silently return without error
        }
        throw error;
      }
    },
    {
      successMessage: 'Stats refreshed successfully',
      errorMessage: 'Failed to refresh stats',
    }
  );
};

/**
 * Get partner performance metrics (clicks, signups, paid users)
 */
export const usePartnerPerformance = (userId: string | undefined) => {
  const queryFn = useCallback(async () => {
    if (!userId) return null;

    try {
      // @ts-expect-error - Table doesn't exist in types yet
      const { data, error } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('partner_stats') as any)
        .select('total_clicks, total_signups, total_paid_users')
        .eq('user_id', userId)
        .single();

      // Check if table doesn't exist (404)
      if (error && ((error as any).status === 404 || error.code === 'PGRST116' || error.code === '42P01')) {
        return null;
      }

      if (error) {
        throw error;
      }

      return {
        total_clicks: data?.total_clicks || 0,
        total_signups: data?.total_signups || 0,
        total_paid_users: data?.total_paid_users || 0,
      };
    } catch (err: any) {
      if (err?.status === 404 || err?.code === 'PGRST116' || err?.code === 'PGRST202' || err?.code === '42P01') {
        return null;
      }
      throw err;
    }
  }, [userId]);

  return useSupabaseQuery<{ total_clicks: number; total_signups: number; total_paid_users: number } | null, Error>(
    ['partnerPerformance', userId],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch performance metrics',
    }
  );
};

/**
 * Get partner rank and total partners count
 */
export const usePartnerRank = (userId: string | undefined) => {
  const queryFn = useCallback(async () => {
    if (!userId) return null;

    try {
      // Get user's rank
      // @ts-expect-error - Table doesn't exist in types yet
      const { data: statsData, error: statsError } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('partner_stats') as any)
        .select('partner_rank')
        .eq('user_id', userId)
        .single();

      if (statsError && ((statsError as any).status === 404 || statsError.code === 'PGRST116' || statsError.code === '42P01')) {
        return null;
      }

      // Get total partners count
      // @ts-expect-error - Function doesn't exist in types yet
      const { data: totalCount, error: countError } = await (supabase.rpc('get_total_partners') as any);

      if (countError && ((countError as any).status === 404 || countError.code === 'PGRST202')) {
        // Fallback: count from partner_stats
        // @ts-expect-error - Table doesn't exist in types yet
        const { count } = await (supabase
          // @ts-expect-error - Table doesn't exist in types yet
          .from('partner_stats') as any)
          .select('*', { count: 'exact', head: true });

        return {
          rank: statsData?.partner_rank || null,
          totalPartners: count || 0,
        };
      }

      return {
        rank: statsData?.partner_rank || null,
        totalPartners: totalCount || 0,
      };
    } catch (err: any) {
      if (err?.status === 404 || err?.code === 'PGRST116' || err?.code === 'PGRST202' || err?.code === '42P01') {
        return null;
      }
      throw err;
    }
  }, [userId]);

  return useSupabaseQuery<{ rank: number | null; totalPartners: number } | null, Error>(
    ['partnerRank', userId],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch partner rank',
    }
  );
};

/**
 * Get projected monthly earnings
 */
export const useProjectedEarnings = (userId: string | undefined) => {
  const queryFn = useCallback(async () => {
    if (!userId) return null;

    try {
      // @ts-expect-error - Table doesn't exist in types yet
      const { data, error } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('partner_stats') as any)
        .select('current_month_earnings')
        .eq('user_id', userId)
        .single();

      if (error && ((error as any).status === 404 || error.code === 'PGRST116' || error.code === '42P01')) {
        return null;
      }

      if (error) {
        throw error;
      }

      const currentMonthEarnings = data?.current_month_earnings || 0;
      const now = new Date();
      const daysPassed = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      const projected = daysPassed > 0 
        ? (currentMonthEarnings / daysPassed) * daysInMonth
        : currentMonthEarnings;

      // Round to nearest ₹10
      const projectedRounded = Math.round(projected / 10) * 10;

      return projectedRounded;
    } catch (err: any) {
      if (err?.status === 404 || err?.code === 'PGRST116' || err?.code === 'PGRST202' || err?.code === '42P01') {
        return null;
      }
      throw err;
    }
  }, [userId]);

  return useSupabaseQuery<number | null, Error>(
    ['projectedEarnings', userId],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to calculate projected earnings',
    }
  );
};

/**
 * Get reward history
 */
export const useRewardHistory = (userId: string | undefined, limit = 50) => {
  const queryFn = useCallback(async () => {
    if (!userId) return [];

    try {
      // @ts-expect-error - Table doesn't exist in types yet
      const { data, error } = await (supabase
        // @ts-expect-error - Table doesn't exist in types yet
        .from('partner_rewards') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error && ((error as any).status === 404 || error.code === 'PGRST116' || error.code === '42P01')) {
        return [];
      }

      if (error) {
        throw error;
      }

      return (data || []) as PartnerReward[];
    } catch (err: any) {
      if (err?.status === 404 || err?.code === 'PGRST116' || err?.code === 'PGRST202' || err?.code === '42P01') {
        return [];
      }
      throw err;
    }
  }, [userId, limit]);

  return useSupabaseQuery<PartnerReward[], Error>(
    ['rewardHistory', userId, limit],
    queryFn,
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch reward history',
    }
  );
};

