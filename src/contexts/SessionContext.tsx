import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'; // Import useCallback
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery'; // Import useSupabaseQuery
import { lockTrialIfExpired, getTrialStatus, TrialStatus } from '@/lib/trial';
import { analytics } from '@/utils/analytics';
import { logger } from '@/lib/utils/logger';

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
    
    try {
      // Start with core fields that should always exist to avoid 400 errors
      // Extended creator profile fields will be fetched separately if needed
      const { data, error } = await (supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id, is_trial, trial_started_at, trial_expires_at, trial_locked') as any)
        .eq('id', user.id)
        .single();

    // If error is due to missing columns (400 or 42703), try with fewer fields
    // Check for various error indicators: PostgreSQL column errors, HTTP 400, or column-related messages
    const isColumnError = error && (
      (error as any).code === '42703' || 
      (error as any).code === 'P0001' || 
      (error as any).message?.includes('column') || 
      (error as any).message?.includes('does not exist') ||
      (error as any).status === 400 ||
      (error as any).statusCode === 400 ||
      (error as any).hint?.includes('column') ||
      // Check if error message contains "Bad Request" or HTTP 400 indicators
      String((error as any).message || '').toLowerCase().includes('bad request') ||
      // Check response status if available
      ((error as any).response?.status === 400)
    );
    
    if (isColumnError) {
      // Silently handle missing columns - expected if migrations haven't run yet
      
      // Retry with basic + trial fields only (excluding bank fields that may not exist)
      const { data: trialData, error: trialError } = await (supabase
        .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id, is_trial, trial_started_at, trial_expires_at, trial_locked, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle, phone, location, bio, platforms, goals') as any)
        .eq('id', user.id)
        .single();

      const isTrialColumnError = trialError && (
        (trialError as any).code === '42703' || 
        (trialError as any).status === 400 ||
        (trialError as any).statusCode === 400 ||
        (trialError as any).message?.includes('column') ||
        (trialError as any).message?.includes('does not exist') ||
        String((trialError as any).message || '').toLowerCase().includes('bad request') ||
        ((trialError as any).response?.status === 400)
      );
      
      if (isTrialColumnError) {
        // If trial fields also don't exist, try with just core basic fields (no social media)
        const { data: basicData, error: basicError } = await (supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id') as any)
          .eq('id', user.id)
          .single();

        const isBasicColumnError = basicError && (
          (basicError as any).code === '42703' || 
          (basicError as any).status === 400 ||
          (basicError as any).statusCode === 400 ||
          (basicError as any).message?.includes('column') ||
          (basicError as any).message?.includes('does not exist') ||
          String((basicError as any).message || '').toLowerCase().includes('bad request') ||
          ((basicError as any).response?.status === 400)
        );
        
        if (isBasicColumnError) {
          // If even basic fields are missing, try absolute minimum
          const { data: minimalData, error: minimalError } = await (supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role') as any)
            .eq('id', user.id)
            .single();

          if (minimalError && (minimalError as any).code !== 'PGRST116') {
            // Only log non-column errors (PGRST116 is "not found", which is fine)
            const isMinimalColumnError = (minimalError as any).code === '42703' || 
              (minimalError as any).status === 400 ||
              (minimalError as any).statusCode === 400 ||
              (minimalError as any).message?.includes('column');
            if (!isMinimalColumnError) {
              logger.error('SessionContext: Error fetching profile', minimalError);
            }
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
          logger.error('SessionContext: Error fetching profile', basicError);
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
        logger.error('SessionContext: Error fetching profile', trialError);
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
        logger.error('SessionContext: Error fetching profile', error);
        return null;
      }
      return data as Profile | null;
    } catch (err: any) {
      // Catch any unexpected errors (network, parsing, etc.)
      // Check if it's a 400 error (column doesn't exist)
      if (err?.status === 400 || err?.statusCode === 400 || err?.message?.includes('Bad Request')) {
        // Silently handle - will fall through to basic query
        logger.warn('SessionContext: Column error detected, using fallback query');
      } else {
        logger.error('SessionContext: Unexpected error fetching profile', err);
      }
      return null;
    }
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
        // Handle hash fragments from OAuth callbacks
        // Supabase sometimes appends tokens as #route#access_token=... (double hash)
        // We need to normalize this to #access_token=... for Supabase to process it
        let hash = window.location.hash;
        let hasAccessToken = false;
        
        // Check for double hash format: #/route#access_token=...
        const doubleHashMatch = hash.match(/^#\/[^#]*#(access_token|type=)/);
        if (doubleHashMatch) {
          console.log('[SessionContext] Detected double hash format, normalizing...', hash);
          // Extract the access_token part (everything after the second #)
          const secondHashIndex = hash.indexOf('#', 1); // Find second #
          if (secondHashIndex !== -1) {
            const tokenPart = hash.substring(secondHashIndex + 1); // Everything after second #
            // Normalize to #access_token=... format that Supabase expects
            hash = '#' + tokenPart;
            // Update the URL hash so Supabase can process it
            window.location.hash = hash;
            console.log('[SessionContext] Normalized hash to:', hash.substring(0, 50) + '...');
            hasAccessToken = true;
          }
        } else {
          // Normal hash format: #access_token=... or #/route?access_token=...
          const hashParams = new URLSearchParams(hash.substring(1));
          hasAccessToken = hashParams.get('access_token') !== null || 
                          hashParams.get('type') === 'magiclink' || 
                          hashParams.get('type') === 'recovery';
        }
        
        if (hasAccessToken) {
          console.log('[SessionContext] OAuth tokens detected in hash, processing...');
          // Supabase will automatically process this via onAuthStateChange
          // The normalized hash should now be processable
          // Clean up hash after a short delay to let Supabase process it, but before React Router routes
          setTimeout(() => {
            // Only clean if hash still contains tokens (Supabase hasn't processed it yet)
            const currentHash = window.location.hash;
            if (currentHash.includes('access_token') || currentHash.includes('type=')) {
              // Extract just the route part if there's a route, otherwise go to dashboard
              const routeMatch = currentHash.match(/^#\/([^#?]+)/);
              if (routeMatch) {
                window.location.hash = `#/${routeMatch[1]}`;
              } else {
                // No route in hash, clean it completely
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }
            }
          }, 200);
        }

        // Get session - Supabase will automatically process hash tokens
        // But first, if we normalized the hash, give it a moment to process
        if (hasAccessToken && hash !== window.location.hash) {
          // Hash was normalized, wait a bit for Supabase to process it
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error("Error getting session", error);
        } else {
          console.log('[SessionContext] Initial session check:', {
            hasSession: !!currentSession,
            userEmail: currentSession?.user?.email,
            hasHashTokens: hasAccessToken,
            hash: window.location.hash.substring(0, 80) + '...'
          });
          
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          // Initialize analytics with user ID
          if (currentUser?.id) {
            analytics.setUserId(currentUser.id);
          }
          
          // If we have hash tokens but no session yet, wait for onAuthStateChange to process them
          if (hasAccessToken && !currentSession) {
            console.log('[SessionContext] Hash tokens found but no session yet, waiting for onAuthStateChange...');
            // Don't redirect here - let onAuthStateChange handle it after session is established
          }
          
          // If we have a session but we're on root or login page, redirect to dashboard
          // This handles the case where Supabase redirects to Site URL after OAuth
          if (currentSession && (window.location.pathname === '/' || window.location.pathname === '/login') && !hasAccessToken) {
            console.log('[SessionContext] Session exists but on root/login, redirecting to dashboard...');
            setTimeout(() => {
              window.location.href = '/#/creator-dashboard';
            }, 100);
          }
        }
      } catch (e: any) {
        logger.error("Critical error initializing session", e);
      } finally {
        setInitialLoadComplete(true); // Mark initial load as complete
      }
    };

    initializeSession();

    // Listen for auth state changes (this handles hash fragments automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SessionContext] Auth state change:', event, {
          hasSession: !!session,
          userEmail: session?.user?.email,
          hash: window.location.hash.substring(0, 50) + '...',
          pathname: window.location.pathname
        });
        
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setInitialLoadComplete(true); // Ensure this is set after any auth change
        
        // Initialize analytics with user ID
        if (currentUser?.id) {
          analytics.setUserId(currentUser.id);
        } else if (event === 'SIGNED_OUT') {
          analytics.clearUserId();
        }
        
        // Handle OAuth callback - check for hash tokens or successful sign-in
        let hash = window.location.hash;
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for double hash format: #/route#access_token=...
        const doubleHashMatch = hash.match(/^#\/[^#]*#(access_token|type=)/);
        if (doubleHashMatch) {
          // Normalize double hash to single hash format
          const secondHashIndex = hash.indexOf('#', 1);
          if (secondHashIndex !== -1) {
            hash = '#' + hash.substring(secondHashIndex + 1);
            window.location.hash = hash;
            console.log('[SessionContext] Normalized double hash in onAuthStateChange');
          }
        }
        
        const hasHashTokens = hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('type=magiclink');
        const hasQueryCode = urlParams.get('code') !== null;
        const isOAuthCallback = hasHashTokens || hasQueryCode;
        
        // If we have a session after OAuth callback or SIGNED_IN event
        if (session && (event === 'SIGNED_IN' || isOAuthCallback || (event === 'INITIAL_SESSION' && hasHashTokens))) {
          console.log('[SessionContext] Session established after OAuth, redirecting to dashboard...', {
            event,
            isOAuthCallback,
            hasHashTokens,
            hasQueryCode,
            userEmail: session?.user?.email
          });
          
          // Clean up the hash/query params first
          const cleanPath = window.location.pathname;
          window.history.replaceState(null, '', cleanPath);
          
          // Wait a moment for session to be fully established, then redirect
          setTimeout(() => {
            // Force redirect to dashboard - this ensures we don't stay on login page
            console.log('[SessionContext] Redirecting to dashboard now...');
            window.location.href = '/#/creator-dashboard';
          }, 300);
        }
        
        // Handle INITIAL_SESSION with no session - this is normal on first load
        if (event === 'INITIAL_SESSION' && !session) {
          console.log('[SessionContext] INITIAL_SESSION: No session found (normal on first load)');
        }
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