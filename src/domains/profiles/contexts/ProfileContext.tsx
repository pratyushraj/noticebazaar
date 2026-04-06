/**
 * Profile Context
 * 
 * Manages user profile data, role-based access, and profile updates.
 * This context depends on AuthContext for user identification.
 * 
 * @module domains/profiles/contexts/ProfileContext
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/domains/auth';
import { Profile } from '@/types';
import type { ProfileContextType, UserRole, ProfileUpdateInput } from '../types';
import { logger } from '@/lib/utils/logger';

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

/**
 * Profile Provider Component
 * 
 * Handles:
 * - Profile data fetching and caching
 * - Role-based access control helpers
 * - Profile updates
 */
export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user, authStatus } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile when user changes
  useEffect(() => {
    if (authStatus === 'loading') {
      return;
    }

    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user?.id, authStatus]);

  /**
   * Fetch profile from database
   */
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const fetchCoreProfile = async () => {
        const fullResult = await (supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            updated_at,
            onboarding_complete,
            organization_id,
            is_trial,
            trial_started_at,
            trial_expires_at,
            trial_locked,
            phone,
            location,
            bio,
            username,
            instagram_handle,
            business_name,
            profile_completion
          `) as any)
          .eq('id', user.id)
          .maybeSingle();

        if (!fullResult.error) {
          return fullResult;
        }

        return await (supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            updated_at,
            onboarding_complete,
            organization_id,
            is_trial,
            trial_started_at,
            trial_expires_at,
            trial_locked,
            phone,
            location,
            bio,
            username,
            instagram_handle,
            business_name
          `) as any)
          .eq('id', user.id)
          .maybeSingle();
      };

      // Fetch core profile fields using type assertion for compatibility
      const { data: coreData, error: coreError } = await fetchCoreProfile();

      if (coreError) {
        logger.error('ProfileContext: Error fetching profile', coreError);
        // Try minimal fetch as fallback
        const { data: minimalData, error: minimalError } = await (supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, updated_at') as any)
          .eq('id', user.id)
          .maybeSingle();

        if (minimalError) {
          logger.error('ProfileContext: Minimal fetch also failed', minimalError);
          setProfile(null);
        } else if (minimalData) {
          const minimalProfile: Profile = {
            ...minimalData,
            onboarding_complete: false,
            organization_id: null,
            is_trial: false,
            trial_started_at: null,
            trial_expires_at: null,
            trial_locked: false,
            phone: null,
            location: null,
            bio: null,
            username: null,
            instagram_handle: null,
          } as Profile;
          setProfile(minimalProfile);
        }
      } else if (coreData) {
        setProfile(coreData as Profile);
      }
    } catch (err) {
      logger.error('ProfileContext: Unexpected error fetching profile', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Update profile fields
   */
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Use type assertion for Supabase client compatibility
      const query = supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any) as any;
      
      const { error } = await query.eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refetch to get updated data
      await fetchProfile();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  }, [user?.id, fetchProfile]);

  // Derived role helpers
  const isAdmin = profile?.role === 'admin';
  const isCreator = profile?.role === 'creator';
  const isBrand = profile?.role === 'brand';
  const isLawyer = profile?.role === 'lawyer';
  const isCA = profile?.role === 'chartered_accountant';
  const organizationId = profile?.organization_id || null;

  // Memoize context value
  const value = useMemo<ProfileContextType>(() => ({
    profile,
    loading,
    isAdmin,
    isCreator,
    isBrand,
    isLawyer,
    isCA,
    organizationId,
    refetchProfile: fetchProfile,
    updateProfile,
  }), [
    profile,
    loading,
    isAdmin,
    isCreator,
    isBrand,
    isLawyer,
    isCA,
    organizationId,
    fetchProfile,
    updateProfile,
  ]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

/**
 * Hook to access profile context
 * 
 * @throws Error if used outside ProfileProvider
 */
export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  
  return context;
}

export default ProfileContext;
