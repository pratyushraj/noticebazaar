import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery'; // Import useSupabaseQuery
import { lockTrialIfExpired, getTrialStatus, TrialStatus } from '@/lib/trial';
import { analytics } from '@/utils/analytics';
import { logger } from '@/lib/utils/logger';

const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

const debugWarn = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.warn(...args);
};

const debugError = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.error(...args);
};

type RedirectProfile = {
  role: string | null;
  onboarding_complete: boolean | null;
  creator_stage?: string | null;
  profile_completion?: number | null;
};

const fetchRedirectProfile = async (userId: string): Promise<RedirectProfile | null> => {
  const fullResult = await (supabase
    .from('profiles')
    .select('role, onboarding_complete, creator_stage, profile_completion') as any)
    .eq('id', userId)
    .single();

  if (!fullResult.error) {
    return (fullResult.data as RedirectProfile | null) ?? null;
  }

  const fallbackResult = await (supabase
    .from('profiles')
    .select('role, onboarding_complete') as any)
    .eq('id', userId)
    .single();

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  return (fallbackResult.data as RedirectProfile | null) ?? null;
};

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
  isCreator: boolean;
  isBrand: boolean;
  organizationId: string | null;
  refetchProfile: () => void; // Add refetchProfile to the context type
  trialStatus: TrialStatus; // NEW: Add trial status
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isAuthInitializing, setIsAuthInitializing] = useState(false);
  const navigate = useNavigate();

  // Use useSupabaseQuery to fetch the profile, leveraging React Query's caching and stability
  const profileQueryFn = useCallback(async () => { // Memoize queryFn here
    if (!user?.id) return null; // Don't fetch if no user ID

    try {
      const fetchOptionalProfileFields = async (fields: string[]): Promise<Record<string, any>> => {
        if (fields.length === 0) return {};

        try {
          const { data, error } = await (supabase
            .from('profiles')
            .select(fields.join(', ')) as any)
            .eq('id', user.id)
            .single();

          if (error) {
            throw error;
          }

          return (data as Record<string, any>) || {};
        } catch (error: any) {
          // In partially migrated environments, one missing column breaks the whole select.
          // Split the request until we isolate only the columns that actually exist.
          if (fields.length === 1) {
            return {};
          }

          const midpoint = Math.ceil(fields.length / 2);
          const [left, right] = await Promise.all([
            fetchOptionalProfileFields(fields.slice(0, midpoint)),
            fetchOptionalProfileFields(fields.slice(midpoint)),
          ]);

          return { ...left, ...right };
        }
      };

      // Keep the profile query intentionally narrow so it doesn't fail in partially-migrated environments.
      const { data: coreData, error: coreError } = await (supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, updated_at, onboarding_complete, organization_id, is_trial, trial_started_at, trial_expires_at, trial_locked, phone, location, bio') as any)
        .eq('id', user.id)
        .single();

      if (coreError) {
        const { data: minimalData, error: minimalError } = await (supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, role, updated_at') as any)
          .eq('id', user.id)
          .single();

        if (minimalError && (minimalError as any).code !== 'PGRST116') {
          logger.error('SessionContext: Error fetching profile', minimalError);
          return null;
        }

        if (!minimalData) return null;

        return {
          ...(minimalData as any),
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
        } as Profile | null;
      }

      let usernameValue: string | null = null;
      let instagramHandleValue: string | null = null;
      let optionalFields: Partial<Profile> = {
        creator_category: null,
        instagram_followers: null,
        last_instagram_sync: null,
        instagram_profile_photo: null,
        avg_rate_reel: null,
        pricing_min: null,
        pricing_avg: null,
        pricing_max: null,
        open_to_collabs: true,
        content_niches: [],
        media_kit_url: null,
        avg_reel_views_manual: null,
        avg_likes_manual: null,
        audience_gender_split: null,
        top_cities: [],
        audience_age_range: null,
        primary_audience_language: null,
        posting_frequency: null,
        active_brand_collabs_month: null,
        campaign_slot_note: null,
        collab_brands_count_override: null,
        collab_response_hours_override: null,
        collab_cancellations_percent_override: null,
        collab_region_label: null,
        collab_intro_line: null,
        collab_audience_fit_note: null,
        collab_recent_activity_note: null,
        collab_audience_relevance_note: null,
        collab_delivery_reliability_note: null,
        collab_engagement_confidence_note: null,
        collab_response_behavior_note: null,
        collab_cta_trust_note: null,
        collab_cta_dm_note: null,
        collab_cta_platform_note: null,
        collab_show_packages: true,
        collab_show_trust_signals: true,
        collab_show_audience_snapshot: true,
        collab_show_past_work: true,
        collab_past_work_items: [],
      };
      try {
        const handleData = await fetchOptionalProfileFields([
          'username',
          'instagram_handle',
        ]);

        if (Object.keys(handleData).length > 0) {
          usernameValue = (handleData as any)?.username || null;
          instagramHandleValue = (handleData as any)?.instagram_handle || null;
        }
      } catch (_error) {
        // Optional fields may not exist in older schemas.
      }

      // Brand-specific fields are not part of the narrow "core" query above.
      // Fetch them opportunistically so the brand console can render name/email,
      // but don't fail if the columns don't exist in older environments.
      let brandFields: Partial<Profile> = {};
      try {
        const { data: brandData, error: brandError } = await (supabase
          .from('profiles')
          // `profiles.email` doesn't exist in many environments (auth email lives in `auth.users`).
          // Only read `business_name` here to avoid noisy 400s.
          .select('business_name') as any)
          .eq('id', user.id)
          .single();
        if (!brandError && brandData) {
          brandFields = {
            business_name: (brandData as any)?.business_name ?? null,
          } as any;
        }
      } catch (_error) {
        // ignore brand fields
      }

      // Fallback to user metadata if profile doesn't have the handle
      const metadataHandle = user?.user_metadata?.instagram_handle || null;
      const finalInstagramHandle = instagramHandleValue || metadataHandle;
      const finalUsername = usernameValue || metadataHandle;

      return {
        ...(coreData as any),
        username: finalUsername,
        instagram_handle: finalInstagramHandle,
        ...optionalFields,
        ...brandFields,
      } as Profile | null;
    } catch (err: any) {
      logger.error('SessionContext: Unexpected error fetching profile', err);
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
  const isCreator = profile?.role === 'creator';
  const isBrand = profile?.role === 'brand';
  const organizationId = profile?.organization_id || null;
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
          debugLog('[SessionContext] Detected double hash format, extracting route and tokens...', hash);
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
            'creators', 'consumer-complaints', 'plan', 'p', 'creator-sign',
            'contract-ready', 'ship', 'deal-details', 'deal', 'feedback',
            'brand-reply', 'brand/response', 'deal/brand-response'];

          // Pathname-based check: /collab/:username or legacy /:username (no hash) are public
          const pathname = window.location.pathname || '';
          const isCollabPathname = /^\/collab\/[^/]+/.test(pathname);
          const isLegacyUsernamePathname = /^\/[^/]+$/.test(pathname) && pathname.length > 1 &&
            !pathname.startsWith('/creator-') && !pathname.startsWith('/admin-') &&
            !pathname.startsWith('/client-') && !pathname.startsWith('/ca-') &&
            !pathname.startsWith('/lawyer-') && !publicRoutes.includes(pathname.slice(1));
          const isCreatorSignPathname = pathname.startsWith('/creator-sign/');
          const isPublicPathname = isCollabPathname || isLegacyUsernamePathname || isCreatorSignPathname ||
            pathname.startsWith('/contract-ready/') ||
            pathname.startsWith('/ship/') ||
            pathname.startsWith('/deal-details/') ||
            pathname.startsWith('/deal/') ||
            pathname.startsWith('/feedback/') ||
            pathname.startsWith('/brand-reply/') ||
            pathname.startsWith('/brand/response/') ||
            pathname.startsWith('/deal/brand-response/') ||
            pathname.startsWith('/creator-contracts/');

          // Check if current route is a public route (like /:username for collab links)
          // Username routes don't match any of the reserved/public routes above
          const isPublicRoute = publicRoutes.includes(intendedRoute || '');
          const isUsernameRoute = intendedRoute && !publicRoutes.includes(intendedRoute) &&
            !intendedRoute.startsWith('creator-') && !intendedRoute.startsWith('admin-') &&
            !intendedRoute.startsWith('client-') && !intendedRoute.startsWith('ca-') &&
            !intendedRoute.startsWith('lawyer-') && !intendedRoute.includes('/');

          // If we're on a public pathname (e.g. /collab/rahul) with no hash, don't default intended route
          if (isPublicPathname && !hasAccessToken) {
            intendedRoute = null;
            // Only log in dev to avoid noise
            if (import.meta.env?.DEV && isCollabPathname) {
              debugLog('[SessionContext] Collab pathname detected, skipping default route');
            }
          } else if (!isPublicRoute && !isUsernameRoute && (!intendedRoute || intendedRoute === 'login')) {
            // If we're on /login but have tokens, the intended route should be dashboard/onboarding
            // Check sessionStorage for stored intended route from OAuth call
            const storedRoute = sessionStorage.getItem('oauth_intended_route');
            if (storedRoute && storedRoute !== 'login') {
              intendedRoute = storedRoute;
              if (import.meta.env?.DEV) {
                debugLog('[SessionContext] Using stored intended route from sessionStorage:', intendedRoute);
              }
            } else if (!intendedRoute || intendedRoute === 'login') {
              intendedRoute = 'creator-onboarding';
              if (import.meta.env?.DEV) {
                debugLog('[SessionContext] No intended route found, defaulting to creator-onboarding');
              }
            }
          } else if (isUsernameRoute) {
            debugLog('[SessionContext] Username route detected, skipping redirect logic:', intendedRoute);
            intendedRoute = null;
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
              debugLog('[SessionContext] Extracted token hash from double hash format');
            }
          }

          debugLog('[SessionContext] Parsing tokens from hash:', tokenHash.substring(0, 50) + '...');
          debugLog('[SessionContext] Stored intended route:', intendedRoute);

          // Parse tokens from hash
          const hashParams = new URLSearchParams(tokenHash.substring(1)); // Remove #
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            debugLog('[SessionContext] Parsed tokens from hash, setting session manually...');
            try {
              // Set the session directly using Supabase's setSession method
              const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (setSessionError) {
                debugError('[SessionContext] Error setting session:', setSessionError);
              } else if (sessionData.session) {
                debugLog('[SessionContext] Session set successfully via manual token parsing');
                // Use path-based route (BrowserRouter).
                let redirectPath = '/creator-onboarding';

                if (intendedRoute && intendedRoute !== 'login' && intendedRoute !== 'signup') {
                  redirectPath = `/${intendedRoute}`;
                } else if (sessionData.session.user?.id) {
                  try {
                    const profileData = await fetchRedirectProfile(sessionData.session.user.id);

                    if (profileData) {
                      const userEmail = sessionData.session.user.email?.toLowerCase();
                      const isPratyush = userEmail === 'pratyushraj@outlook.com';

                      const p = (profileData as any);
                      if (isPratyush) {
                        redirectPath = '/creator-dashboard';
                      } else if (p?.role === 'admin') {
                        redirectPath = '/admin-dashboard';
                        debugLog('[SessionContext] Admin user detected in initializeSession');
                      } else if (p?.role === 'brand') {
                        redirectPath = '/brand-dashboard';
                      } else if (p?.role === 'chartered_accountant') {
                        redirectPath = '/ca-dashboard';
                      } else if (p?.role === 'lawyer') {
                        redirectPath = '/lawyer-dashboard';
                      } else {
                        redirectPath = (p?.creator_stage === 'new' && !p?.onboarding_complete) ? '/creator-onboarding' : '/creator-dashboard';
                      }
                    }
                  } catch (error) {
                    debugError('[SessionContext] Error fetching profile in initializeSession:', error);
                  }
                }

                // Navigate using React Router to be safer and avoid Safari loops
                debugLog('[SessionContext] Navigating to:', redirectPath);
                navigate(redirectPath, { replace: true });
              }
            } catch (err) {
              debugError('[SessionContext] Exception setting session:', err);
            }
          } else {
            debugWarn('[SessionContext] Could not parse tokens from hash', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
          }
        }

        // Get session - check if we successfully set it manually
        let { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error("Error getting session", error);
          // Auto-recovery for stuck refresh tokens:
          // If the token is completely invalid/revoked, force sign-out to clear local storage and avoid infinite loops.
          if (error.message.includes("Refresh Token Not Found") || error.message.includes("Invalid Refresh Token")) {
            debugWarn("[SessionContext] Invalid refresh token detected. Clearing local session state...");
            await supabase.auth.signOut();
            currentSession = null;
          }
        } else {
          debugLog('[SessionContext] Initial session check:', {
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
            debugLog('[SessionContext] Hash tokens found but no session yet, waiting for onAuthStateChange...');
            // onAuthStateChange will clean the hash after processing tokens
          }

          // If we have a session but we're truly on a "no-route" root/login page, redirect to dashboard.
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
            debugLog('[SessionContext] Session exists on bare root/login, navigating to dashboard...');
            navigate('/creator-dashboard', { replace: true });
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
        debugLog('[SessionContext] Auth state change:', event, {
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
            debugLog('[SessionContext] Normalized double hash in onAuthStateChange, intended route:', intendedRoute);
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
              debugLog('[SessionContext] Retrieved intended route from sessionStorage:', intendedRoute);
            }
          }
        }

        const hasHashTokens = hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('type=magiclink');
        const hasQueryCode = urlParams.get('code') !== null;
        const isOAuthCallback = hasHashTokens || hasQueryCode;

        // Handle INITIAL_SESSION with tokens but no session yet
        // This happens when OAuth tokens are present but Supabase hasn't processed them yet
        if (event === 'INITIAL_SESSION' && !session && hasHashTokens) {
          debugLog('[SessionContext] INITIAL_SESSION: Tokens detected but no session yet, waiting for SIGNED_IN event...');
          // Don't clean hash yet - wait for SIGNED_IN event to process tokens
        } else if (event === 'INITIAL_SESSION' && !session) {
          debugLog('[SessionContext] INITIAL_SESSION: No session found (normal on first load)');
        }

        // If we have a session after OAuth callback or SIGNED_IN event
        // Also check sessionStorage for intended route in case hash was already normalized
        if (session && (event === 'SIGNED_IN' || isOAuthCallback || (event === 'INITIAL_SESSION' && hasHashTokens))) {
          // Set auth initializing state for OAuth callbacks too
          setIsAuthInitializing(true);
          const pathname = window.location.pathname || '';

          // Get intended route from sessionStorage if not already extracted from hash
          if (!intendedRoute) {
            const storedRoute = sessionStorage.getItem('oauth_intended_route');
            if (storedRoute) {
              intendedRoute = storedRoute;
              sessionStorage.removeItem('oauth_intended_route');
              debugLog('[SessionContext] Retrieved intended route from sessionStorage:', intendedRoute);
            }
          }

          // List of public routes that should not trigger redirects
          const publicRoutes = ['login', 'signup', 'reset-password', 'about', 'blog', 'careers',
            'free-influencer-contract', 'collaboration-agreement-generator', 'pricing-comparison',
            'privacy-policy', 'terms-of-service', 'refund-policy', 'delete-data', 'sitemap',
            'free-legal-check', 'thank-you', 'dashboard-white-preview', 'dashboard-preview',
            'creators', 'consumer-complaints', 'plan', 'p', 'creator-sign',
            'contract-ready', 'ship', 'deal-details', 'deal', 'feedback',
            'brand-reply', 'brand/response', 'deal/brand-response'];

          // Check if current route is a username route (collab link)
          const isUsernameRoute = intendedRoute && !publicRoutes.includes(intendedRoute) &&
            !intendedRoute.startsWith('creator-') && !intendedRoute.startsWith('admin-') &&
            !intendedRoute.startsWith('client-') && !intendedRoute.startsWith('ca-') &&
            !intendedRoute.startsWith('lawyer-') && !intendedRoute.includes('/');

          // Skip redirect for public routes and username routes (collab links)
          const isPublicRoute = intendedRoute && publicRoutes.includes(intendedRoute);
          const isCreatorSignPathname = pathname.startsWith('/creator-sign/');
          const isPublicPathname = isCreatorSignPathname ||
            pathname.startsWith('/contract-ready/') ||
            pathname.startsWith('/ship/') ||
            pathname.startsWith('/deal-details/') ||
            pathname.startsWith('/deal/') ||
            pathname.startsWith('/feedback/') ||
            pathname.startsWith('/brand-reply/') ||
            pathname.startsWith('/brand/response/') ||
            pathname.startsWith('/deal/brand-response/') ||
            pathname.startsWith('/creator-contracts/');

          if (isUsernameRoute || isPublicRoute || isPublicPathname || (!isOAuthCallback && pathname !== '/' && pathname !== '/login')) {
            debugLog('[SessionContext] Skipping redirect (already on valid path or not an auth flow):', pathname);
            setIsAuthInitializing(false);
            return;
          }

          // If we're already on a dashboard path, skip profile fetch and redirect (avoids timeout + log spam on token refresh / repeated SIGNED_IN)
          const dashboardPaths = ['/creator-dashboard', '/admin-dashboard', '/ca-dashboard', '/lawyer-dashboard', '/creator-onboarding'];
          if (dashboardPaths.includes(pathname)) {
            setIsAuthInitializing(false);
            return;
          }

          debugLog('[SessionContext] Session established after OAuth, redirecting...', {
            event,
            isOAuthCallback,
            hasHashTokens,
            hasQueryCode,
            intendedRoute,
            userEmail: session?.user?.email
          });

          let targetPath = '/creator-onboarding';

          // Routes that should redirect admin users to admin dashboard instead
          const adminOnlyRoutes = ['admin-influencers', 'admin-discovery'];

          if (intendedRoute && intendedRoute !== 'login' && intendedRoute !== 'signup') {
            // Check if this is an influencer route - we'll redirect admin users away from these
            const isInfluencerRoute = intendedRoute.includes('influencer') || intendedRoute.includes('discovery');

            if (isInfluencerRoute) {
              debugLog('[SessionContext] Influencer route detected, will redirect based on role');
              // Don't use intended route if it's an influencer route - let role-based redirect handle it
            } else {
              targetPath = `/${intendedRoute}`;
              debugLog('[SessionContext] Using intended route:', targetPath);
            }
          }

          if ((targetPath === '/creator-dashboard' || targetPath === '/creator-onboarding') && session?.user?.id) {
            // Fetch profile to determine role-based redirect and onboarding status, with 2.5s timeout
            const profileFetchTimeoutMs = 2500;
            try {
              debugLog('[SessionContext] Fetching profile for user:', session.user.id);
                const profilePromise = (supabase
                  .from('profiles')
                  .select('role, onboarding_complete, creator_stage, profile_completion') as any)
                  .eq('id', session.user.id)
                  .single();
              const timeoutFallback = { data: null as { role: string; onboarding_complete?: boolean } | null, error: { message: 'timeout' } };
              const result = await Promise.race([
                  fetchRedirectProfile(session.user.id),
                  new Promise<typeof timeoutFallback>((resolve) =>
                    setTimeout(() => resolve(timeoutFallback), profileFetchTimeoutMs)
                  ),
              ]);
              const profileData = result?.data ?? null;
              const profileError = result?.error;

              if (profileError) {
                debugWarn('[SessionContext] Profile fetch for redirect:', profileError.message);
              }

              if (profileData) {
                debugLog('[SessionContext] Profile fetched, role:', profileData.role, 'onboarding_complete:', profileData.onboarding_complete);
                const userEmail = session.user.email?.toLowerCase();
                const isPratyush = userEmail === 'pratyushraj@outlook.com';

                const p = (profileData as any);
                if (isPratyush) {
                  targetPath = '/creator-dashboard';
                } else if (p?.role === 'admin') {
                  targetPath = '/admin-dashboard';
                  debugLog('[SessionContext] Admin user detected, redirecting to admin dashboard');
                } else if (p?.role === 'brand') {
                  targetPath = '/brand-dashboard';
                } else if (p?.role === 'chartered_accountant') {
                  targetPath = '/ca-dashboard';
                } else if (p?.role === 'lawyer') {
                  targetPath = '/lawyer-dashboard';
                } else {
                  targetPath = (p?.creator_stage === 'new' && !p?.onboarding_complete) ? '/creator-onboarding' : '/creator-dashboard';
                }
              } else {
                debugLog('[SessionContext] No profile data / timeout, defaulting to creator-onboarding');
                targetPath = '/creator-onboarding';
              }
            } catch (error) {
              debugWarn('[SessionContext] Profile fetch for redirect failed, redirecting to creator-onboarding:', error);
              targetPath = '/creator-onboarding';
            }
          }

          // Skip redirect if we're already on the target route (avoids full-page reload / re-navigation)
          const currentPath = window.location.pathname.replace(/\/$/, ''); // Remove trailing slash
          const normalizedTargetPath = targetPath.replace(/\/$/, '');

          if (currentPath === normalizedTargetPath) {
            debugLog('[SessionContext] Already on target route, skipping navigation:', currentPath);
            setIsAuthInitializing(false);
            return;
          }

          debugLog('[SessionContext] Navigating after SIGNED_IN/OAuth:', targetPath);
          navigate(targetPath, { replace: true });
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
    isCreator,
    isBrand,
    organizationId,
    refetchProfile: refetchProfileQuery || (() => { }), // Expose refetch function with fallback
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
      isBrand: false,
      organizationId: null,
      refetchProfile: () => { },
      trialStatus: { isTrial: false, isExpired: false, daysLeft: 0, trialLocked: false, trialStartedAt: null, trialExpiresAt: null },
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
    debugError('[useSession] Context is undefined. This may indicate a component is outside SessionContextProvider or a timing issue.');

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
      isBrand: false,
      organizationId: null,
      refetchProfile: () => { },
      trialStatus: { isTrial: false, isExpired: false, daysLeft: 0, trialLocked: false, trialStartedAt: null, trialExpiresAt: null },
    };
  }
  return context;
};
