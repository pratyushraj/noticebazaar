import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'; // Import useCallback
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery'; // Import useSupabaseQuery
import { lockTrialIfExpired, getTrialStatus, TrialStatus } from '@/lib/trial';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isCreator: boolean; // New: Add isCreator
  organizationId: string | null; // NEW: Add organizationId
  refetchProfile: () => void; // Add refetchProfile to the context type
  trialStatus: TrialStatus; // NEW: Add trial status
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Use useSupabaseQuery to fetch the profile, leveraging React Query's caching and stability
  const profileQueryFn = useCallback(async () => { // Memoize queryFn here
    if (!user?.id) return null; // Don't fetch if no user ID
    
    // Try to fetch with all fields first (including new creator profile fields)
    let { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id, is_trial, trial_started_at, trial_expires_at, trial_locked, creator_category, pricing_min, pricing_avg, pricing_max, bank_account_name, bank_account_number, bank_ifsc, bank_upi, gst_number, pan_number, referral_code, instagram_followers, youtube_subs, tiktok_followers, twitter_followers, facebook_followers, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle')
      .eq('id', user.id)
      .single();

    // If error is due to missing columns (400 or 42703), try with fewer fields
    if (error && ((error as any).code === '42703' || (error as any).code === 'P0001' || (error as any).message?.includes('column') || (error as any).status === 400)) {
      // Silently handle missing columns - expected if migrations haven't run yet
      
      // Retry with basic + trial fields only
      const { data: trialData, error: trialError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id, is_trial, trial_started_at, trial_expires_at, trial_locked, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle')
        .eq('id', user.id)
        .single();

      if (trialError && ((trialError as any).code === '42703' || (trialError as any).status === 400)) {
        // If trial fields also don't exist, try with just core basic fields (no social media)
        const { data: basicData, error: basicError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id')
          .eq('id', user.id)
          .single();

        if (basicError && ((basicError as any).code === '42703' || (basicError as any).status === 400)) {
          // If even basic fields are missing, try absolute minimum
          const { data: minimalData, error: minimalError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role')
            .eq('id', user.id)
            .single();

          if (minimalError && (minimalError as any).code !== 'PGRST116') {
            console.error('SessionContext: Error fetching profile:', minimalError);
            return null;
          }

          // Return with all defaults
          return {
            ...(minimalData as any),
            updated_at: new Date().toISOString(),
            business_name: null,
            gstin: null,
            business_entity_type: null,
            onboarding_complete: false,
            organization_id: null,
            is_trial: false,
            trial_started_at: null,
            trial_expires_at: null,
            trial_locked: false,
            creator_category: null,
            pricing_min: null,
            pricing_avg: null,
            pricing_max: null,
            bank_account_name: null,
            bank_account_number: null,
            bank_ifsc: null,
            bank_upi: null,
            gst_number: null,
            pan_number: null,
            referral_code: null,
            instagram_followers: null,
            youtube_subs: null,
            tiktok_followers: null,
            twitter_followers: null,
            facebook_followers: null,
            instagram_handle: null,
            youtube_channel_id: null,
            tiktok_handle: null,
            facebook_profile_url: null,
            twitter_handle: null,
          } as Profile | null;
        }

        if (basicError && (basicError as any).code !== 'PGRST116') {
          console.error('SessionContext: Error fetching profile:', basicError);
          return null;
        }
        
        // Add default values for missing fields
        return {
          ...(basicData as any),
          is_trial: false,
          trial_started_at: null,
          trial_expires_at: null,
          trial_locked: false,
          creator_category: null,
          pricing_min: null,
          pricing_avg: null,
          pricing_max: null,
          bank_account_name: null,
          bank_account_number: null,
          bank_ifsc: null,
          bank_upi: null,
          gst_number: null,
          pan_number: null,
          referral_code: null,
          instagram_followers: null,
          youtube_subs: null,
          tiktok_followers: null,
          twitter_followers: null,
          facebook_followers: null,
          instagram_handle: null,
          youtube_channel_id: null,
          tiktok_handle: null,
          facebook_profile_url: null,
          twitter_handle: null,
        } as Profile | null;
      }

      if (trialError && (trialError as any).code !== 'PGRST116') {
        console.error('SessionContext: Error fetching profile:', trialError);
        return null;
      }

      // Add default values for missing creator profile fields
      return {
        ...(trialData as any),
        creator_category: null,
        pricing_min: null,
        pricing_avg: null,
        pricing_max: null,
        bank_account_name: null,
        bank_account_number: null,
        bank_ifsc: null,
        bank_upi: null,
        gst_number: null,
        pan_number: null,
        referral_code: null,
        instagram_followers: null,
        youtube_subs: null,
        tiktok_followers: null,
        twitter_followers: null,
        facebook_followers: null,
        // Ensure social handles are included if not in trialData
        instagram_handle: (trialData as any)?.instagram_handle || null,
        youtube_channel_id: (trialData as any)?.youtube_channel_id || null,
        tiktok_handle: (trialData as any)?.tiktok_handle || null,
        facebook_profile_url: (trialData as any)?.facebook_profile_url || null,
        twitter_handle: (trialData as any)?.twitter_handle || null,
      } as Profile | null;
    }

    if (error && (error as any).code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
      console.error('SessionContext: Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  }, [user?.id]); // Dependency for useCallback

  const { data: profileData, isLoading: isLoadingProfile, refetch: refetchProfileQuery } = useSupabaseQuery<Profile | null, Error>( // Destructure refetch
    ['userProfile', user?.id], // Query key depends on user ID
    profileQueryFn, // Pass memoized queryFn
    {
      enabled: !!user?.id, // Only enable query if user ID is available
      staleTime: 5 * 60 * 1000, // Profile data can be considered fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch profile on window focus by default
      errorMessage: 'Failed to load user profile',
    }
  );

  // Type-safe profile conversion
  const profile = (profileData ?? null) as Profile | null;

  // Derive computed values from profile
  const isAdmin = profile?.role === 'admin';
  const isCreator = profile?.role === 'creator'; // New: Define isCreator
  const organizationId = profile?.organization_id || null; // Derive from profile
  const trialStatus = useMemo(() => getTrialStatus(profile), [profile]); // Calculate trial status
  // Overall loading state: true if initial session load is not complete OR profile is still loading
  const loading = !initialLoadComplete || isLoadingProfile;

  // Check and lock trial if expired on profile load
  useEffect(() => {
    if (user?.id && profile && profile.is_trial && !profile.trial_locked) {
      lockTrialIfExpired(user.id).then((locked) => {
        if (locked) {
          // Refetch profile to get updated trial_locked status
          refetchProfileQuery();
        }
      });
    }
  }, [user?.id, profile?.id, profile?.is_trial, profile?.trial_locked, refetchProfileQuery]);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error.message);
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (e: any) {
        console.error("Critical error initializing session:", e.message);
      } finally {
        setInitialLoadComplete(true); // Mark initial load as complete
      }
    };

    initializeSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setInitialLoadComplete(true); // Ensure this is set after any auth change
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run only once on mount

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    isAdmin,
    isCreator, // Include isCreator
    organizationId, // Include organizationId
    refetchProfile: refetchProfileQuery, // Expose refetch function
    trialStatus, // Include trial status
  }), [session, user, profile, loading, isAdmin, isCreator, organizationId, refetchProfileQuery, trialStatus]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};