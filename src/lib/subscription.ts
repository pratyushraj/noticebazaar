// Utility functions for checking subscription/plan status
import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a user is on Creator Pro plan
 * For now, checks if user has an active subscription with plan_name containing "Pro"
 * This can be updated when subscription system is fully implemented
 */
export async function isCreatorPro(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('plan_name, status')
      .eq('client_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !subscription) {
      // If no subscription found, user is not Pro
      return false;
    }

    // Check if plan_name contains "Pro" (case-insensitive)
    const planName = subscription.plan_name?.toLowerCase() || '';
    return planName.includes('pro') || planName.includes('creator pro');
  } catch (error) {
    console.error('[Subscription] Error checking Pro status:', error);
    return false;
  }
}

/**
 * Check if a user is on Creator Pro plan (synchronous version using profile)
 * This is a fallback that can be used when subscription data isn't available
 * For MVP, we'll assume non-trial users with creator role might be Pro
 * This should be replaced with actual subscription check when available
 */
export function isCreatorProSync(profile: Profile | null): boolean {
  if (!profile || profile.role !== 'creator') return false;
  
  // For MVP: If user is not on trial, assume they might be Pro
  // This is a temporary heuristic - should be replaced with actual subscription check
  // TODO: Replace with actual subscription check from subscriptions table
  return !profile.is_trial || profile.trial_locked === false;
}










