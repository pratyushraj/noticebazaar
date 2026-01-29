import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'; // Import useCallback
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery'; // Import useSupabaseQuery
import { lockTrialIfExpired, getTrialStatus, TrialStatus } from '@/lib/trial';
import { analytics } from '@/utils/analytics';
import { logger } from '@/lib/utils/logger';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /**
   * Overall loading flag for auth + profile.
   * This remains true until we've resolved the current session
   * AND finished (or skipped) initial profile fetch.
   */
  loading: boolean;
  /**
   * Single source of truth for auth state.
   * - "loading": still resolving session/profile
   * - "authenticated": session + (attempted) profile fetch complete
   * - "unauthenticated": no active session after initial check
   */
  authStatus: AuthStatus;
  /**
   * True when user just authenticated and we're bootstrapping (loading profile + initial data).
   * This is used to show AuthLoadingScreen instead of dashboard during the transition.
   */
  isAuthInitializing: boolean;
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
  const [isAuthInitializing, setIsAuthInitializing] = useState(false);

  // Use useSupabaseQuery to fetch the profile, leveraging React Query's caching and stability
  const profileQueryFn = useCallback(async () => { // Memoize queryFn here
    if (!user?.id) return null; // Don't fetch if no user ID
    
    try {
      // Start with core fields that should always exist to avoid 400 errors
      // Extended creator profile fields will be fetched separately if needed
      // Include phone for eSign functionality (email is in auth.users, not profiles)
      // Include location and bio for profile settings
      const { data, error } = await (supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id, is_trial, trial_started_at, trial_expires_at, trial_locked, phone, location, bio, username, instagram_handle') as any)
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
      
      // Retry with basic + trial fields only (excluding bank fields and social media fields that may not exist)
      // Include username and instagram_handle as they're essential for collab links
      const { data: trialData, error: trialError } = await (supabase
        .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id, is_trial, trial_started_at, trial_expires_at, trial_locked, phone, location, bio, username, instagram_handle') as any)
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
        // Include username and instagram_handle as they're essential for collab links
        const { data: basicData, error: basicError } = await (supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete, organization_id, phone, location, bio, username, instagram_handle') as any)
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
          // Try without username first in case column doesn't exist
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

          // Try to fetch username separately if column exists
          let usernameValue = null;
          if (minimalData && !minimalError) {
            try {
              const { data: usernameData } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();
              usernameValue = usernameData?.username || null;
            } catch (e) {
              // Username column might not exist, that's okay - will be null
              usernameValue = null;
            }
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
            phone: null,
            location: null,
            bio: null,
            email: null,
            username: usernameValue, // Fetch username separately if column exists
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
          location: (basicData as any)?.location || null,
          bio: (basicData as any)?.bio || null,
          username: (basicData as any)?.username || null, // Preserve username if it exists
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
        // Ensure location and bio are included if not in trialData
        location: (trialData as any)?.location || null,
        bio: (trialData as any)?.bio || null,
        // Ensure username is preserved - essential for collab links
        username: (trialData as any)?.username || null,
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
  // Overall loading state: initial session not complete, OR profile loading when we have no profile yet.
  // Once we have profile data, don't gate on refetches — avoids loop where dashboard mounts, refetches profile, loading flips true, loader shows again.
  const loading = !initialLoadComplete || (isLoadingProfile && !profile);
  const authStatus: AuthStatus = loading
    ? 'loading'
    : session
      ? 'authenticated'
      : 'unauthenticated';

  // Clear auth initialization state once profile is loaded
  // Add a small delay to ensure smooth transition and let dashboard start fetching data
  useEffect(() => {
    if (isAuthInitializing && profile && !isLoadingProfile) {
      // Delay to ensure smooth transition and give dashboard time to start fetching
      // This prevents flicker between loading screen and dashboard loading states
      const timer = setTimeout(() => {
        setIsAuthInitializing(false);
      }, 800); // Increased delay to ensure dashboard has time to start fetching
      return () => clearTimeout(timer);
    }
  }, [isAuthInitializing, profile, isLoadingProfile]);

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
        // We need to extract the route, let Supabase process tokens, then clean hash IMMEDIATELY
        // to prevent React Router from routing to /access_token=...
        let hash = window.location.hash;
        let hasAccessToken = false;
        let intendedRoute: string | null = null;
        
        // Check for double hash format: #/route#access_token=...
        const doubleHashMatch = hash.match(/^#\/([^#]+)#(access_token|type=)/);
        if (doubleHashMatch) {
          console.log('[SessionContext] Detected double hash format, extracting route and tokens...', hash);
          // Extract the intended route (e.g., "creator-onboarding")
          intendedRoute = doubleHashMatch[1];
          // Extract the access_token part (everything after the second #)
          const secondHashIndex = hash.indexOf('#', 1);
          if (secondHashIndex !== -1) {
            const tokenPart = hash.substring(secondHashIndex + 1);
            // Normalize to #access_token=... format that Supabase expects
            hash = '#' + tokenPart;
            // Store the normalized hash temporarily - we'll set it just before getSession()
            hasAccessToken = true;
          }
        } else {
          // Normal hash format: #access_token=... or #/route?access_token=...
          const hashParams = new URLSearchParams(hash.substring(1));
          hasAccessToken = hashParams.get('access_token') !== null || 
                          hashParams.get('type') === 'magiclink' || 
                          hashParams.get('type') === 'recovery';
          
          // Check if there's a route in the hash (e.g., #/creator-onboarding?access_token=...)
          const routeMatch = hash.match(/^#\/([^?#]+)/);
          if (routeMatch) {
            intendedRoute = routeMatch[1];
          }
          
          // List of public routes that should not trigger redirects
          const publicRoutes = ['login', 'signup', 'reset-password', 'about', 'blog', 'careers', 
            'free-influencer-contract', 'collaboration-agreement-generator', 'pricing-comparison',
            'privacy-policy', 'terms-of-service', 'refund-policy', 'delete-data', 'sitemap',
            'free-legal-check', 'thank-you', 'dashboard-white-preview', 'dashboard-preview',
            'creators', 'consumer-complaints', 'plan', 'p'];
          
          // Check if current route is a public route (like /:username for collab links)
          // Username routes don't match any of the reserved/public routes above
          const isPublicRoute = publicRoutes.includes(intendedRoute || '');
          const isUsernameRoute = intendedRoute && !publicRoutes.includes(intendedRoute) && 
            !intendedRoute.startsWith('creator-') && !intendedRoute.startsWith('admin-') && 
            !intendedRoute.startsWith('client-') && !intendedRoute.startsWith('ca-') && 
            !intendedRoute.startsWith('lawyer-') && !intendedRoute.includes('/');
          
          // If we're on /login but have tokens, the intended route should be dashboard/onboarding
          // Check sessionStorage for stored intended route from OAuth call
          // Skip redirect logic for public routes and username routes
          if (!isPublicRoute && !isUsernameRoute && (!intendedRoute || intendedRoute === 'login')) {
            const storedRoute = sessionStorage.getItem('oauth_intended_route');
            if (storedRoute && storedRoute !== 'login') {
              intendedRoute = storedRoute;
              console.log('[SessionContext] Using stored intended route from sessionStorage:', intendedRoute);
            } else if (!intendedRoute || intendedRoute === 'login') {
              // Default to dashboard if no route specified (only for authenticated users)
              // Don't set default if we're on a public route
              intendedRoute = 'creator-dashboard';
              console.log('[SessionContext] No intended route found, defaulting to creator-dashboard');
            }
          } else if (isUsernameRoute) {
            // For username routes (collab links), don't set a default intended route
            console.log('[SessionContext] Username route detected, skipping redirect logic:', intendedRoute);
            intendedRoute = null; // Clear intended route to prevent redirect
          }
        }
        
        // If we have tokens, manually parse and set session
        // This is more reliable than waiting for Supabase's automatic processing
        if (hasAccessToken) {
          // Store intended route in sessionStorage so onAuthStateChange can access it
          if (intendedRoute) {
            sessionStorage.setItem('oauth_intended_route', intendedRoute);
          }
          
          // Determine which hash to parse tokens from
          let tokenHash = hash;
          if (doubleHashMatch) {
            // Extract token part from double hash
            const secondHashIndex = hash.indexOf('#', 1);
            if (secondHashIndex !== -1) {
              tokenHash = '#' + hash.substring(secondHashIndex + 1);
              console.log('[SessionContext] Extracted token hash from double hash format');
            }
          }
          
          console.log('[SessionContext] Parsing tokens from hash:', tokenHash.substring(0, 50) + '...');
          console.log('[SessionContext] Stored intended route:', intendedRoute);
          
          // Parse tokens from hash
          const hashParams = new URLSearchParams(tokenHash.substring(1)); // Remove #
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('[SessionContext] Parsed tokens from hash, setting session manually...');
            try {
              // Set the session directly using Supabase's setSession method
              const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (setSessionError) {
                console.error('[SessionContext] Error setting session:', setSessionError);
              } else if (sessionData.session) {
                console.log('[SessionContext] Session set successfully via manual token parsing');
                // Use path-based route (BrowserRouter), e.g. /creator-dashboard
                let redirectPath = '/creator-dashboard';
                
                if (intendedRoute && intendedRoute !== 'login' && intendedRoute !== 'signup') {
                  redirectPath = `/${intendedRoute}`;
                } else if (sessionData.session.user?.id) {
                  try {
                    const { data: profileData } = await supabase
                      .from('profiles')
                      .select('role')
                      .eq('id', sessionData.session.user.id)
                      .single();
                    
                    if (profileData) {
                      const userEmail = sessionData.session.user.email?.toLowerCase();
                      const isPratyush = userEmail === 'pratyushraj@outlook.com';
                      
                      if (isPratyush) {
                        redirectPath = '/creator-dashboard';
                      } else if (profileData.role === 'admin') {
                        redirectPath = '/admin-dashboard';
                        console.log('[SessionContext] Admin user detected in initializeSession');
                      } else if (profileData.role === 'chartered_accountant') {
                        redirectPath = '/ca-dashboard';
                      } else if (profileData.role === 'lawyer') {
                        redirectPath = '/lawyer-dashboard';
                      }
                    }
                  } catch (error) {
                    console.error('[SessionContext] Error fetching profile in initializeSession:', error);
                  }
                }
                
                // Navigate to path so BrowserRouter shows the correct route
                window.location.replace(redirectPath);
                console.log('[SessionContext] Redirecting to:', redirectPath);
            }
            } catch (err) {
              console.error('[SessionContext] Exception setting session:', err);
        }
          } else {
            console.warn('[SessionContext] Could not parse tokens from hash', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
          }
        }
        
        // Get session - check if we successfully set it manually
        let { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
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
          // Don't clean the hash here - let onAuthStateChange do it after processing tokens
          if (hasAccessToken && !currentSession) {
            console.log('[SessionContext] Hash tokens found but no session yet, waiting for onAuthStateChange...');
            // onAuthStateChange will clean the hash after processing tokens
          }
          
          // If we have a session but we're truly on a "no-route" root/login page, redirect to dashboard.
          // IMPORTANT: We MUST NOT do this when there's a hash-based route like "#/contract-ready/:token" or "#/brand-reply/:token"
          // because public, token-based pages (contract ready, feedback, etc.) rely on hash routing.
          //
          // Heuristic:
          // - pathname is "/" or "/login"
          // - no OAuth tokens in the hash
          // - AND the hash does NOT start with "#/" (i.e. no hash-route segment present)
          const hashValue = window.location.hash || '';
          const hasRouteInHash = hashValue.startsWith('#/');
          const isRootOrLoginPath = window.location.pathname === '/' || window.location.pathname === '/login';
          const hasOauthTokensInHash = hashValue.includes('access_token') || hashValue.includes('type=');

          if (
            currentSession &&
            isRootOrLoginPath &&
            !hasAccessToken &&
            !hasOauthTokensInHash &&
            !hasRouteInHash
          ) {
            console.log('[SessionContext] Session exists on bare root/login, redirecting to dashboard...');
            setTimeout(() => {
              window.location.replace('/creator-dashboard');
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
        
        // Track auth initialization state - true when user just signed in
        if (event === 'SIGNED_IN' && session) {
          setIsAuthInitializing(true);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthInitializing(false);
        }
        
        // Initialize analytics with user ID
        if (currentUser?.id) {
          analytics.setUserId(currentUser.id);
        } else if (event === 'SIGNED_OUT') {
          analytics.clearUserId();
        }

        // Token refresh only updates session/user; skip OAuth redirect and profile fetch
        if (event === 'TOKEN_REFRESHED') return;

        // Handle OAuth callback - check for hash tokens or successful sign-in
        let hash = window.location.hash;
        const urlParams = new URLSearchParams(window.location.search);
        let intendedRoute: string | null = null;
        
        // Check for double hash format: #/route#access_token=...
        // Extract route BEFORE normalizing (in case hash was already normalized by initializeSession)
        const doubleHashMatch = hash.match(/^#\/([^#]+)#(access_token|type=)/);
        if (doubleHashMatch) {
          // Extract the intended route before normalizing
          intendedRoute = doubleHashMatch[1];
          // Normalize double hash to single hash format for Supabase
          const secondHashIndex = hash.indexOf('#', 1);
          if (secondHashIndex !== -1) {
            hash = '#' + hash.substring(secondHashIndex + 1);
            // Use replaceState to avoid triggering React Router
            window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
            console.log('[SessionContext] Normalized double hash in onAuthStateChange, intended route:', intendedRoute);
          }
        } else {
          // Hash might already be normalized (#access_token=...) or have route in query (#/route?access_token=...)
          // Check if there's a route in the hash (e.g., #/creator-onboarding?access_token=...)
          const routeMatch = hash.match(/^#\/([^?#]+)/);
          if (routeMatch) {
            intendedRoute = routeMatch[1];
          }
          // If hash is normalized (#access_token=...), we need to get route from sessionStorage or check if it's a known OAuth route
          // For now, if no route found and we have tokens, default to creator-onboarding (common OAuth target)
          if (!intendedRoute && (hash.includes('access_token') || hash.includes('type='))) {
            // Try to get intended route from sessionStorage (set by initializeSession)
            const storedRoute = sessionStorage.getItem('oauth_intended_route');
            if (storedRoute) {
              intendedRoute = storedRoute;
              sessionStorage.removeItem('oauth_intended_route');
            }
          }
        }
        
        const hasHashTokens = hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('type=magiclink');
        const hasQueryCode = urlParams.get('code') !== null;
        const isOAuthCallback = hasHashTokens || hasQueryCode;
        
        // Handle INITIAL_SESSION with tokens but no session yet
        // This happens when OAuth tokens are present but Supabase hasn't processed them yet
        if (event === 'INITIAL_SESSION' && !session && hasHashTokens) {
          console.log('[SessionContext] INITIAL_SESSION: Tokens detected but no session yet, waiting for SIGNED_IN event...');
          // Don't clean hash yet - wait for SIGNED_IN event to process tokens
        } else if (event === 'INITIAL_SESSION' && !session) {
          console.log('[SessionContext] INITIAL_SESSION: No session found (normal on first load)');
        }
        
        // If we have a session after OAuth callback or SIGNED_IN event
        // Also check sessionStorage for intended route in case hash was already normalized
        if (session && (event === 'SIGNED_IN' || isOAuthCallback || (event === 'INITIAL_SESSION' && hasHashTokens))) {
          // Set auth initializing state for OAuth callbacks too
          setIsAuthInitializing(true);
          // Get intended route from sessionStorage if not already extracted from hash
          if (!intendedRoute) {
            const storedRoute = sessionStorage.getItem('oauth_intended_route');
            if (storedRoute) {
              intendedRoute = storedRoute;
              sessionStorage.removeItem('oauth_intended_route');
              console.log('[SessionContext] Retrieved intended route from sessionStorage:', intendedRoute);
            }
          }
          
          // List of public routes that should not trigger redirects
          const publicRoutes = ['login', 'signup', 'reset-password', 'about', 'blog', 'careers', 
            'free-influencer-contract', 'collaboration-agreement-generator', 'pricing-comparison',
            'privacy-policy', 'terms-of-service', 'refund-policy', 'delete-data', 'sitemap',
            'free-legal-check', 'thank-you', 'dashboard-white-preview', 'dashboard-preview',
            'creators', 'consumer-complaints', 'plan', 'p'];
          
          // Check if current route is a username route (collab link)
          const isUsernameRoute = intendedRoute && !publicRoutes.includes(intendedRoute) && 
            !intendedRoute.startsWith('creator-') && !intendedRoute.startsWith('admin-') && 
            !intendedRoute.startsWith('client-') && !intendedRoute.startsWith('ca-') && 
            !intendedRoute.startsWith('lawyer-') && !intendedRoute.includes('/');
          
          // Skip redirect for public routes and username routes (collab links)
          if (isUsernameRoute) {
            console.log('[SessionContext] Username route detected, skipping redirect:', intendedRoute);
            setIsAuthInitializing(false);
            return;
          }
          
          console.log('[SessionContext] Session established after OAuth, redirecting...', {
            event,
            isOAuthCallback,
            hasHashTokens,
            hasQueryCode,
            intendedRoute,
            userEmail: session?.user?.email
          });
          
          // Use path-based routes (BrowserRouter), not hash — so /creator-dashboard not #/creator-dashboard
          let targetPath = '/creator-dashboard';
          
          // Routes that should redirect admin users to admin dashboard instead
          const adminOnlyRoutes = ['admin-influencers', 'admin-discovery'];
          
          if (intendedRoute && intendedRoute !== 'login' && intendedRoute !== 'signup') {
            // Check if this is an influencer route - we'll redirect admin users away from these
            const isInfluencerRoute = intendedRoute.includes('influencer') || intendedRoute.includes('discovery');
            
            if (isInfluencerRoute) {
              console.log('[SessionContext] Influencer route detected, will redirect based on role');
              // Don't use intended route if it's an influencer route - let role-based redirect handle it
            } else {
              targetPath = `/${intendedRoute}`;
              console.log('[SessionContext] Using intended route:', targetPath);
            }
          }
          
          if (targetPath === '/creator-dashboard' && session?.user?.id) {
            // Fetch profile to determine role-based redirect, with 2.5s timeout so we never block redirect
            const profileFetchTimeoutMs = 2500;
            try {
              console.log('[SessionContext] Fetching profile for user:', session.user.id);
              const profilePromise = supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
              const timeoutFallback = { data: null as { role: string } | null, error: { message: 'timeout' } };
              const result = await Promise.race([
                profilePromise,
                new Promise<typeof timeoutFallback>((resolve) =>
                  setTimeout(() => resolve(timeoutFallback), profileFetchTimeoutMs)
                ),
              ]);
              const profileData = result?.data ?? null;
              const profileError = result?.error;
              
              if (profileError) {
                console.warn('[SessionContext] Profile fetch for redirect:', profileError.message);
              }
              
              if (profileData) {
                console.log('[SessionContext] Profile fetched, role:', profileData.role);
                const userEmail = session.user.email?.toLowerCase();
                const isPratyush = userEmail === 'pratyushraj@outlook.com';
                
                if (isPratyush) {
                  targetPath = '/creator-dashboard';
                } else if (profileData.role === 'admin') {
                  targetPath = '/admin-dashboard';
                  console.log('[SessionContext] Admin user detected, redirecting to admin dashboard');
                } else if (profileData.role === 'chartered_accountant') {
                  targetPath = '/ca-dashboard';
                } else if (profileData.role === 'lawyer') {
                  targetPath = '/lawyer-dashboard';
                } else {
                  targetPath = '/creator-dashboard';
                }
              } else {
                console.log('[SessionContext] No profile data / timeout, defaulting to creator dashboard');
              }
            } catch (error) {
              console.warn('[SessionContext] Profile fetch for redirect failed, redirecting to creator-dashboard:', error);
              targetPath = '/creator-dashboard';
            }
          }
          
          // Skip redirect if we're already on the target route (avoids full-page reload when SIGNED_IN fires again, e.g. token refresh)
          if (window.location.pathname === targetPath) {
            console.log('[SessionContext] Already on target route, skipping redirect to avoid reload');
            setIsAuthInitializing(false);
            return;
          }
          
          console.log('[SessionContext] Redirecting to:', targetPath);
          
          // Navigate immediately; don't defer or user can stay stuck on login
          window.location.replace(targetPath);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run only once on mount

  // Memoize the context value to prevent unnecessary re-renders of consumers
  // Always provide a value - never undefined - to prevent "must be used within provider" errors
  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    authStatus,
    isAuthInitializing,
    isAdmin,
    isCreator, // Include isCreator
    organizationId, // Include organizationId
    refetchProfile: refetchProfileQuery || (() => {}), // Expose refetch function with fallback
    trialStatus, // Include trial status
  }), [session, user, profile, loading, authStatus, isAuthInitializing, isAdmin, isCreator, organizationId, refetchProfileQuery, trialStatus]);

  // Ensure context value is always defined before rendering children
  // This prevents timing issues during React's initial render
  if (contextValue === undefined) {
    // This should never happen, but provide a fallback just in case
    const fallbackValue: SessionContextType = {
      session: null,
      user: null,
      profile: null,
      loading: true,
      authStatus: 'loading',
      isAuthInitializing: false,
      isAdmin: false,
      isCreator: false,
      organizationId: null,
      refetchProfile: () => {},
      trialStatus: { isTrial: false, isExpired: false, daysRemaining: 0, isLocked: false },
    };
    return (
      <SessionContext.Provider value={fallbackValue}>
        {children}
      </SessionContext.Provider>
    );
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    // This should never happen if component is within SessionContextProvider
    // But during React's initial render or strict mode double-render, it might be temporarily undefined
    // Provide a fallback value instead of throwing to prevent crashes
    console.error('[useSession] Context is undefined. This may indicate a component is outside SessionContextProvider or a timing issue.');
    
    // Return a safe fallback value to prevent crashes
    return {
      session: null,
      user: null,
      profile: null,
      loading: true,
      authStatus: 'loading' as const,
      isAuthInitializing: true,
      isAdmin: false,
      isCreator: false,
      organizationId: null,
      refetchProfile: () => {},
      trialStatus: { isTrial: false, isExpired: false, daysRemaining: 0, isLocked: false },
    };
  }
  return context;
};