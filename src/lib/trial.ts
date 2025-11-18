import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export interface TrialStatus {
  isTrial: boolean;
  trialStartedAt: Date | null;
  trialExpiresAt: Date | null;
  trialLocked: boolean;
  daysLeft: number;
  isExpired: boolean;
}

const TRIAL_DURATION_DAYS = 30;

/**
 * Calculate days left in trial
 */
export const calculateDaysLeft = (expiresAt: Date | null): number => {
  if (!expiresAt) return 0;
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Check if trial is currently active
 */
export const isTrialActive = (profile: Profile | null): boolean => {
  if (!profile?.is_trial) return false;
  if (profile.trial_locked) return false;
  if (!profile.trial_expires_at) return false;
  
  const now = new Date();
  const expiresAt = new Date(profile.trial_expires_at);
  return expiresAt > now;
};

/**
 * Check if trial has expired
 */
export const isTrialExpired = (profile: Profile | null): boolean => {
  if (!profile?.is_trial) return false;
  if (!profile.trial_expires_at) return false;
  
  const now = new Date();
  const expiresAt = new Date(profile.trial_expires_at);
  return expiresAt <= now;
};

/**
 * Get days left in trial
 */
export const daysLeft = (profile: Profile | null): number => {
  if (!profile?.is_trial || !profile.trial_expires_at) return 0;
  const expiresAt = new Date(profile.trial_expires_at);
  return calculateDaysLeft(expiresAt);
};

/**
 * Get trial status object
 */
export const getTrialStatus = (profile: Profile | null): TrialStatus => {
  if (!profile) {
    return {
      isTrial: false,
      trialStartedAt: null,
      trialExpiresAt: null,
      trialLocked: false,
      daysLeft: 0,
      isExpired: false,
    };
  }

  const expiresAt = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null;
  const startedAt = profile.trial_started_at ? new Date(profile.trial_started_at) : null;
  const expired = isTrialExpired(profile);
  const daysRemaining = daysLeft(profile);

  return {
    isTrial: profile.is_trial || false,
    trialStartedAt: startedAt,
    trialExpiresAt: expiresAt,
    trialLocked: profile.trial_locked || expired,
    daysLeft: daysRemaining,
    isExpired: expired,
  };
};

/**
 * Lock trial if expired (sets trial_locked to true)
 */
export const lockTrialIfExpired = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('is_trial, trial_expires_at, trial_locked')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('Error fetching profile for trial lock:', fetchError);
      return false;
    }

    // If already locked or not a trial, no need to lock
    if (profile.trial_locked || !profile.is_trial) {
      return profile.trial_locked || false;
    }

    // Check if expired
    if (!profile.trial_expires_at) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(profile.trial_expires_at);

    if (expiresAt <= now) {
      // Trial expired, lock it
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ trial_locked: true })
        .eq('id', userId);

      if (updateError) {
        console.error('Error locking trial:', updateError);
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in lockTrialIfExpired:', error);
    return false;
  }
};

/**
 * Start trial on signup
 */
export const startTrialOnSignup = async (userId: string): Promise<boolean> => {
  try {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DURATION_DAYS);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_trial: true,
        trial_started_at: now.toISOString(),
        trial_expires_at: expiresAt.toISOString(),
        trial_locked: false,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error starting trial:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in startTrialOnSignup:', error);
    return false;
  }
};

/**
 * Check if user can perform an action (not locked)
 */
export const canPerformAction = (profile: Profile | null): boolean => {
  if (!profile) return false;
  const trialStatus = getTrialStatus(profile);
  return !trialStatus.trialLocked;
};

/**
 * Check if trial feature is restricted (CA/Lawyer chat limits)
 */
export const isTrialFeatureRestricted = (
  profile: Profile | null,
  messagesSent: number,
  maxAllowed: number = 1
): boolean => {
  if (!profile?.is_trial) return false;
  const trialStatus = getTrialStatus(profile);
  if (trialStatus.trialLocked) return true;
  return messagesSent >= maxAllowed;
};

