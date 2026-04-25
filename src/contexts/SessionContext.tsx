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

const formatUnknownError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return {
      name: typeof record.name === 'string' ? record.name : 'NonErrorObject',
      message:
        typeof record.message === 'string'
          ? record.message
          : typeof record.error_description === 'string'
            ? record.error_description
            : JSON.stringify(record),
      stack: typeof record.stack === 'string' ? record.stack : undefined,
      details: record,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
    stack: undefined,
  };
};

let hasLoggedMissingSessionProvider = false;

type RedirectProfile = {
  role: string | null;
  onboarding_complete: boolean | null;
  profile_completion?: number | null;
};

const getMetadataRole = (user: { user_metadata?: Record<string, unknown> | null } | null | undefined): string | null => {
  const metadata = user?.user_metadata || {};
  if (typeof metadata.role === 'string') return metadata.role;
  if (typeof metadata.account_mode === 'string') return metadata.account_mode;
  return null;
};

const fetchRedirectProfile = async (userId: string): Promise<RedirectProfile | null> => {
  const fetchPromise = (async () => {
    const fullResult = await (supabase
      .from('profiles')
      .select('role, onboarding_complete, profile_completion') as any)
      .eq('id', userId)
      .maybeSingle();

    if (!fullResult.error) {
      return (fullResult.data as RedirectProfile | null) ?? null;
    }

    const fallbackResult = await (supabase
      .from('profiles')
      .select('role, onboarding_complete') as any)
      .eq('id', userId)
      .maybeSingle();

    if (fallbackResult.error) {
      throw fallbackResult.error;
    }

    return (fallbackResult.data as RedirectProfile | null) ?? null;
  })();

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('FETCH_REDIRECT_PROFILE_TIMEOUT')), 5000)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
};

const getFallbackRedirectPath = (
  role: string | null | undefined,
  onboardingComplete?: boolean | null,
) => {
  if (role === 'brand') return onboardingComplete ? '/brand-dashboard' : '/brand-onboarding';
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'chartered_accountant') return '/ca-dashboard';
  if (role === 'lawyer') return '/lawyer-dashboard';
  return '/creator-dashboard';
};

const isRecoveryAuthFlow = (hash: string, event?: string) =>
  event === 'PASSWORD_RECOVERY' ||
  hash.includes('type=recovery') ||
  hash.includes('PASSWORD_RECOVERY');

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
  const [isProfileSlow, setIsProfileSlow] = useState(false);
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
            .maybeSingle();

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

      // Core query: only the 6 columns guaranteed to exist in every environment.
      // Any schema-optional columns are fetched below via fetchOptionalProfileFields.
      const { data: coreData, error: coreError } = await (supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, updated_at') as any)
        .eq('id', user.id)
        .maybeSingle();

      if (coreError) {
        if ((coreError as any).code !== 'PGRST116') {
          logger.error('SessionContext: Error fetching profile', coreError);
        }
        return null;
      }

      if (!coreData) return null;

      let usernameValue: string | null = null;
      let instagramHandleValue: string | null = null;
      let optionalFields: Partial<Profile> = {
        creator_category: null,
        instagram_followers: null,
        last_instagram_sync: null,
        instagram_profile_photo: null,
        avg_rate_reel: null,
        bank_account_name: null,
        bank_upi: null,
        payout_upi: null,
        pricing_min: null,
        pricing_avg: null,
        pricing_max: null,
        open_to_collabs: true,
        content_niches: [],
        content_vibes: [],
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
        shipping_address: null,
        pincode: null,
        follower_count_range: null,
      };
      // 1. Fetch critical onboarding field alone first
      try {
        const { data: onboardingData } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle();
        if (onboardingData) {
          optionalFields.onboarding_complete = onboardingData.onboarding_complete;
        }
      } catch (e) {
        debugWarn('[SessionContext] onboarding_complete field not found in profiles table');
      }

      let brandFields: Partial<Profile> = {};
      // 2. Fetch other groups sequentially but with internal parallelism for those that are likely to exist
      const fetchGroup = async () => {
        // Group handles and basic info
        try {
          const handleData = await fetchOptionalProfileFields(['username', 'instagram_handle', 'instagram_profile_photo']);
          usernameValue = handleData?.username || null;
          instagramHandleValue = handleData?.instagram_handle || null;
          optionalFields.instagram_profile_photo = handleData?.instagram_profile_photo || null;
        } catch (e) {}

        // Group trial and bio
        try {
          const trialData = await fetchOptionalProfileFields(['is_trial', 'trial_started_at', 'trial_expires_at', 'trial_locked', 'bio']);
          optionalFields = { ...optionalFields, ...trialData } as any;
        } catch (e) {}

        // Group core extensions (minus onboarding_complete which we already got)
        try {
          const extData = await fetchOptionalProfileFields([
            'organization_id',
            'phone',
            'location',
            'content_niches',
            'content_vibes',
            'top_cities',
            'audience_gender_split',
            'audience_age_range',
            'primary_audience_language',
            'collab_region_label',
          ]);
          optionalFields = { ...optionalFields, ...extData } as any;
        } catch (e) {}

        // Group pricing
        try {
          const pricingData = await fetchOptionalProfileFields(['avg_rate_reel', 'reel_price', 'pricing_min', 'pricing_avg', 'pricing_max', 'story_price', 'instagram_followers', 'last_instagram_sync']);
          optionalFields = { ...optionalFields, ...pricingData } as any;
        } catch (e) {}

        // Group payout
        try {
          const payoutData = await fetchOptionalProfileFields(['bank_account_name', 'bank_upi', 'payout_upi']);
          if (payoutData.bank_upi || payoutData.payout_upi) {
            optionalFields.bank_upi = payoutData.bank_upi || payoutData.payout_upi;
            optionalFields.payout_upi = payoutData.payout_upi || payoutData.bank_upi;
          }
          if (payoutData.bank_account_name) optionalFields.bank_account_name = payoutData.bank_account_name;
        } catch (e) {}

        // Group portfolio and media
        try {
          const mediaData = await fetchOptionalProfileFields(['portfolio_links', 'media_kit_url', 'discovery_video_url', 'portfolio_videos']);
          optionalFields = { ...optionalFields, ...mediaData } as any;
        } catch (e) {}

        // Brand fields
        try {
          const { data: brandData } = await supabase.from('profiles').select('business_name').eq('id', user.id).maybeSingle();
          if (brandData) brandFields.business_name = brandData.business_name;
        } catch (e) {}
      };

      await fetchGroup();

      // Fallback to user metadata if profile doesn't have the handle
      const metadataHandle = user?.user_metadata?.instagram_handle || null;
      const finalInstagramHandle = instagramHandleValue || metadataHandle;
      const finalUsername = usernameValue || metadataHandle;

      // Prefer metadata for name if DB is empty (common in fresh signups)
      const metadataFirstName = user?.user_metadata?.first_name || null;
      const metadataLastName = user?.user_metadata?.last_name || null;
      const metadataFullName = user?.user_metadata?.full_name || null;

      let finalProfile = {
        ...(coreData as any),
        first_name: (coreData as any)?.first_name || metadataFirstName,
        last_name: (coreData as any)?.last_name || metadataLastName,
        full_name: (coreData as any)?.full_name || metadataFullName || 
                  ((coreData as any)?.first_name || metadataFirstName ? `${(coreData as any)?.first_name || metadataFirstName} ${(coreData as any)?.last_name || metadataLastName || ''}`.trim() : null),
        username: finalUsername,
        instagram_handle: finalInstagramHandle,
        ...optionalFields,
        ...brandFields,
      } as Profile | null;

      // Virat Kohli Hardcoded Override for consistency in Demo
      if (user?.email?.toLowerCase() === 'virat@yopmail.com') {
        const currentPhoto = finalProfile?.avatar_url || finalProfile?.instagram_profile_photo || '';
        const isSupabase = currentPhoto.includes('supabase.co') || currentPhoto.includes('v1/object/public');
        const isPlaceholder = !currentPhoto || 
                             currentPhoto.includes('photo-1531415074968-036ba1b575da') || 
                             currentPhoto.includes('photo-1541233349642-6e425fe6190e') || 
                             currentPhoto.includes('placeholder') || 
                             (currentPhoto.includes('unsplash.com') && !isSupabase);
        
        if (isPlaceholder && !isSupabase) {
          finalProfile = {
            ...finalProfile,
            first_name: 'Virat',
            last_name: 'Kohli',
            full_name: 'Virat Kohli',
            avatar_url: 'https://images.unsplash.com/photo-1541233349642-6e425fe6190e?auto=format&fit=crop&q=80&w=800&h=800',
            instagram_profile_photo: 'https://images.unsplash.com/photo-1541233349642-6e425fe6190e?auto=format&fit=crop&q=80&w=800&h=800',
          } as any;
        }
      }

      // Beyoncé Hardcoded Override for consistency in Demo
      if (user?.email?.toLowerCase() === 'beyonce@yopmail.com') {
        const currentPhoto = finalProfile?.avatar_url || finalProfile?.instagram_profile_photo || '';
        const isSupabase = currentPhoto.includes('supabase.co') || currentPhoto.includes('v1/object/public');
        const isPlaceholder = !currentPhoto || 
                             currentPhoto.includes('photo-1493225255756-d9584f8606e9') || 
                             currentPhoto.includes('photo-1516280440614-37939bbacd81') || 
                             currentPhoto.includes('placeholder') || 
                             (currentPhoto.includes('unsplash.com') && !isSupabase);

        if (isPlaceholder && !isSupabase) {
          finalProfile = {
            ...finalProfile,
            first_name: 'Beyoncé',
            last_name: '',
            full_name: 'Beyoncé',
            avatar_url: 'https://images.unsplash.com/photo-1570715316024-8973d70f03f3?auto=format&fit=crop&q=80&w=800&h=800',
            instagram_profile_photo: 'https://images.unsplash.com/photo-1570715316024-8973d70f03f3?auto=format&fit=crop&q=80&w=800&h=800',
          } as any;
        }
      }

      return finalProfile;
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
  // Safety timeout for profile loading
  useEffect(() => {
    if (isLoadingProfile && !profile) {
      const timer = setTimeout(() => {
        setIsProfileSlow(true);
      }, 7000);
      return () => clearTimeout(timer);
    } else {
      setIsProfileSlow(false);
    }
  }, [isLoadingProfile, !!profile]);

  // Overall loading state: initial session not complete, OR profile loading when we have no profile yet.
  // If profile is taking too long (isProfileSlow), we stop gating here and let ProtectedRoute handle the fallback/retry.
  const loading = !initialLoadComplete || (isLoadingProfile && !profile && !isProfileSlow);
  const authStatus: AuthStatus = loading
    ? 'loading'
    : session
      ? 'authenticated'
      : 'unauthenticated';

  // Clear auth initialization state once profile is loaded
  // Add a small delay to ensure smooth transition and let dashboard start fetching data
  useEffect(() => {
    // If loading is finished, we should clear the initialization state
    // We check initialLoadComplete to ensure we've at least tried to fetch the session
    if (isAuthInitializing && !isLoadingProfile && initialLoadComplete) {
      // Delay to ensure smooth transition and give dashboard time to start fetching
      const timer = setTimeout(() => {
        setIsAuthInitializing(false);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [isAuthInitializing, isLoadingProfile, initialLoadComplete]);

  // Safety timeout: clear isAuthInitializing after 4 seconds even if profile fetch is slow
  useEffect(() => {
    if (isAuthInitializing) {
      const timer = setTimeout(() => {
        setIsAuthInitializing(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isAuthInitializing]);

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
      let hasAccessToken = false;
      try {
        // PKCE OAuth callback support (Supabase returns `?code=...`).
        // In some environments, `getSession()` does not reliably exchange the code for a session
        // before our app starts routing. Make the exchange explicit and then clean the URL to
        // avoid re-processing the code on refresh.
        const initialUrl = new URL(window.location.href);
        const oauthCode = initialUrl.searchParams.get('code');
        if (oauthCode) {
          debugLog('[SessionContext] Detected OAuth code in URL, exchanging for session...');
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(oauthCode);
            if (error) {
              debugError('[SessionContext] Failed to exchange OAuth code for session:', error);
            } else if (data?.session) {
              debugLog('[SessionContext] OAuth code exchanged successfully');
            }
          } catch (err) {
            debugError('[SessionContext] Exception exchanging OAuth code for session:', err);
          } finally {
            // Always remove auth artifacts from the URL so refresh doesn't repeat the exchange.
            initialUrl.searchParams.delete('code');
            initialUrl.searchParams.delete('state');
            initialUrl.searchParams.delete('error');
            initialUrl.searchParams.delete('error_code');
            initialUrl.searchParams.delete('error_description');
            const cleanedSearch = initialUrl.searchParams.toString();
            const cleaned =
              initialUrl.pathname +
              (cleanedSearch ? `?${cleanedSearch}` : '') +
              initialUrl.hash;
            window.history.replaceState({}, '', cleaned);
          }
        }

        // Handle hash fragments from OAuth callbacks
        // Supabase sometimes appends tokens as #route#access_token=... (double hash)
        // We need to extract the route, let Supabase process tokens, then clean hash IMMEDIATELY
        // to prevent React Router from routing to /access_token=...
        let hash = window.location.hash;
        hasAccessToken = false;
        let intendedRoute: string | null = null;

        // Check for double hash format: #/route#access_token=...
        const doubleHashMatch = hash.match(/^#\/([^#]+)#(access_token|type=)/);
        if (doubleHashMatch) {
          debugLog('[SessionContext] Detected double hash format, extracting route and tokens...', hash);
          // Extract the intended route (e.g., "creator-dashboard")
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

          // Check if there's a route in the hash (e.g., #/creator-dashboard?access_token=...)
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
              const metadataRole = getMetadataRole(null);
              intendedRoute = getFallbackRedirectPath(metadataRole, metadataRole === 'brand' ? false : null).replace(/^\//, '');
              if (import.meta.env?.DEV) {
                debugLog('[SessionContext] No intended route found, defaulting from metadata role:', intendedRoute);
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
                // Check for lock acquisition timeout - common in multi-tab scenarios or race conditions
                if (setSessionError.name === 'NavigatorLockAcquireTimeoutError' || setSessionError.message?.includes('Lock')) {
                  debugWarn('[SessionContext] Lock acquisition timeout in initializeSession, will rely on background processing');
                } else {
                  debugError('[SessionContext] Error setting session:', setSessionError);
                }
              } else if (sessionData.session) {
                debugLog('[SessionContext] Session set successfully via manual token parsing');
                // Use path-based route (BrowserRouter).
                // Production safety: `profiles.role` is the only source of truth for redirects.
                // Do not redirect based solely on user_metadata; wait for profile.
                let redirectPath = getFallbackRedirectPath(getMetadataRole(sessionData.session.user), getMetadataRole(sessionData.session.user) === 'brand' ? false : null);

                if (intendedRoute && intendedRoute !== 'login' && intendedRoute !== 'signup') {
                  redirectPath = `/${intendedRoute}`;
                } else if (sessionData.session.user?.id) {
                  try {
                    const profileData = await fetchRedirectProfile(sessionData.session.user.id);
                    const userEmail = sessionData.session.user.email?.toLowerCase();
                    const isPratyush = userEmail === 'pratyushraj@outlook.com';
                    const p = (profileData as any);

                    if (isPratyush) redirectPath = '/creator-dashboard';
                    else redirectPath = getFallbackRedirectPath(p?.role, p?.onboarding_complete);
                  } catch (error) {
                    debugWarn('[SessionContext] Error fetching profile in initializeSession, using metadata fallback:', error);
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
          const isExpectedAuthError = error.message.includes("Refresh Token Not Found") || 
                                      error.message.includes("Invalid Refresh Token") ||
                                      error.message.includes("session_not_found");
          
          if (isExpectedAuthError) {
            debugWarn("[SessionContext] Auth session refresh needed or token expired:", error.message);
          } else {
            logger.error("Error getting session", error);
          }

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
            try {
              const profileData = await fetchRedirectProfile(currentSession.user.id);
              const p = (profileData as any);
              const defaultPath = getFallbackRedirectPath(
                p?.role || getMetadataRole(currentSession.user),
                p?.onboarding_complete ?? (getMetadataRole(currentSession.user) === 'brand' ? false : null),
              );
              navigate(defaultPath, { replace: true });
            } catch (e) {
              debugWarn('[SessionContext] Unable to fetch profile for root/login redirect; skipping redirect until profile is available.');
              return;
            }
          }
        }
      } catch (e: any) {
        const formattedError = formatUnknownError(e);
        logger.error('Critical error initializing session', formattedError, {
          pathname: window.location.pathname,
          hash: window.location.hash?.slice(0, 120) || '',
          search: window.location.search || '',
        });

        const message = String(formattedError.message || '').toLowerCase();
        const shouldResetSession =
          message.includes('refresh token') ||
          message.includes('auth session missing') ||
          message.includes('invalid jwt') ||
          message.includes('jwt') ||
          message.includes('session');

        if (shouldResetSession) {
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            logger.error('Failed to clear invalid session after init error', formatUnknownError(signOutError));
          }
          setSession(null);
          setUser(null);
        }
      } finally {
        // Safety delay to ensure onAuthStateChange has a chance to fire
        // if getSession() returned null but tokens exist in storage
        if (hasAccessToken) {
          debugLog('[SessionContext] Waiting for onAuthStateChange to process hash tokens...');
          // Don't set initialLoadComplete yet
        } else {
          setInitialLoadComplete(true);
        }
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
        
        // Ensure initialLoadComplete is set after any auth change
        // We use a small timeout to let the state propagate smoothly
        setTimeout(() => {
          setInitialLoadComplete(true);
        }, 50);

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
          // Check if there's a route in the hash (e.g., #/creator-dashboard?access_token=...)
          const routeMatch = hash.match(/^#\/([^?#]+)/);
          if (routeMatch) {
            intendedRoute = routeMatch[1];
          }
          // If hash is normalized (#access_token=...), we need to get route from sessionStorage or check if it's a known OAuth route
          // If no route found and we have tokens, default to creator-dashboard
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
          const recoveryFlow = isRecoveryAuthFlow(window.location.hash || '', event);

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

          if (recoveryFlow) {
            debugLog('[SessionContext] Recovery flow detected; forcing reset-password route');
          } else if (isUsernameRoute || isPublicRoute || isPublicPathname || (!isOAuthCallback && pathname !== '/' && pathname !== '/login')) {
            debugLog('[SessionContext] Skipping redirect (already on valid path or not an auth flow):', pathname);
            setIsAuthInitializing(false);
            return;
          }

          // If we're already on a dashboard path, skip profile fetch and redirect (avoids timeout + log spam on token refresh / repeated SIGNED_IN)
          const dashboardPaths = ['/creator-dashboard', '/brand-dashboard', '/brand-onboarding', '/admin-dashboard', '/ca-dashboard', '/lawyer-dashboard'];
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

          let targetPath = recoveryFlow
            ? '/reset-password'
            : getFallbackRedirectPath(getMetadataRole(session?.user || null), getMetadataRole(session?.user || null) === 'brand' ? false : null);

          // Routes that should redirect admin users to admin dashboard instead
          const adminOnlyRoutes = ['admin-influencers', 'admin-discovery'];

          if (recoveryFlow) {
            targetPath = '/reset-password';
          } else if (intendedRoute && intendedRoute !== 'login' && intendedRoute !== 'signup') {
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

          if (session?.user?.id && !recoveryFlow) {
            try {
              debugLog('[SessionContext] Fetching profile for redirect (profiles.role source of truth):', session.user.id);
              const profileData = await fetchRedirectProfile(session.user.id);
              const userEmail = session.user.email?.toLowerCase();
              const isPratyush = userEmail === 'pratyushraj@outlook.com';
              const p = (profileData as any);
              if (isPratyush) targetPath = '/creator-dashboard';
              else targetPath = getFallbackRedirectPath(
                p?.role || getMetadataRole(session.user),
                p?.onboarding_complete ?? (getMetadataRole(session.user) === 'brand' ? false : null),
              );
            } catch (error) {
              debugWarn('[SessionContext] Profile fetch for redirect failed; using metadata fallback:', error);
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
    if (import.meta.env.DEV && !hasLoggedMissingSessionProvider) {
      hasLoggedMissingSessionProvider = true;
      // Use warn (not error) so we don't spam giant stacks during hot reload / strict-mode remounts.
      debugWarn('[useSession] Context is undefined. This may indicate a component is outside SessionContextProvider or a timing issue.');
    }

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
