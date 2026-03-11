"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import FullScreenLoader from '@/components/FullScreenLoader';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { getCollabReadiness } from '@/lib/collab/readiness';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer' | 'brand')[]; // Updated allowedRoles type to include lawyer and brand
}

const PROTECTED_LOADER_TIMEOUT_MS = 8000;

const isCreatorCollabProfileComplete = (profile: any): boolean => {
  const readiness = getCollabReadiness({
    instagramHandle: profile?.instagram_handle || profile?.username || null,
    category: profile?.creator_category || null,
    niches: profile?.content_niches || null,
    topCities: profile?.top_cities || null,
    audienceGenderSplit: profile?.audience_gender_split || null,
    primaryAudienceLanguage: profile?.primary_audience_language || null,
    postingFrequency: profile?.posting_frequency || null,
    avgReelViews: profile?.avg_reel_views_manual || null,
    avgLikes: profile?.avg_likes_manual || null,
    openToCollabs: profile?.open_to_collabs,
    avgRateReel: profile?.avg_rate_reel || null,
    pricingMin: profile?.pricing_min || null,
    pricingAvg: profile?.pricing_avg || null,
    pricingMax: profile?.pricing_max || null,
    regionLabel: profile?.collab_region_label || null,
    mediaKitUrl: profile?.media_kit_url || null,
  });

  return readiness.stageKey === 'collaboration_ready' || readiness.stageKey === 'campaign_ready';
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, authStatus, profile, isAdmin, isCreator, refetchProfile, user, isAuthInitializing } = useSession();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileCreationAttempts, setProfileCreationAttempts] = useState(0);
  const [loaderTimedOut, setLoaderTimedOut] = useState(false);

  // If we're stuck on "Preparing your protected workspace...", show a way out after 8s
  const showingLoader = authStatus === 'loading' || isCreatingProfile;
  useEffect(() => {
    if (!showingLoader) {
      setLoaderTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setLoaderTimedOut(true), PROTECTED_LOADER_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [showingLoader]);

  // Function to manually create profile if trigger fails
  const createProfileManually = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'creator',
          onboarding_complete: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error && error.code !== '23505') { // 23505 is unique violation (profile already exists)
        console.error('Error creating profile:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception creating profile:', err);
      return false;
    }
  };

  useEffect(() => {
    // Don't run any routing logic until auth + profile state are resolved
    if (authStatus === 'loading') {
      return;
    }

    // If user has session but no profile yet, try to create it or wait for trigger
    if (session && !profile && user) {
      setIsCreatingProfile(true);

      // Try multiple times with increasing delays
      const maxAttempts = 5;
      let attempt = profileCreationAttempts;

      const tryGetProfile = async () => {
        if (attempt < maxAttempts) {
          // First, try to refetch
          if (refetchProfile) {
            refetchProfile();
          }

          // Wait a bit, then check if profile exists
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', user.id)
              .single();

            if (profileData) {
              // Profile exists, refetch it
              if (refetchProfile) {
                refetchProfile();
              }
              setIsCreatingProfile(false);
              setProfileCreationAttempts(0);
            } else if (attempt < maxAttempts - 1) {
              // Profile still doesn't exist, try again
              setProfileCreationAttempts(attempt + 1);
            } else {
              // Last attempt: try to create profile manually
              const created = await createProfileManually(user.id);
              if (created) {
                if (refetchProfile) {
                  refetchProfile();
                }
              }
              setIsCreatingProfile(false);
              setProfileCreationAttempts(0);
            }
          }, (attempt + 1) * 1000); // Exponential backoff: 1s, 2s, 3s, 4s, 5s
        }
      };

      tryGetProfile();
      return;
    }

    if (session && profile) {
      setIsCreatingProfile(false);
      setProfileCreationAttempts(0);

      // Default to Creator Dashboard for ALL users (including clients)
      let targetDashboard = '/creator-dashboard';
      const isCreatorOrSimilarRole = !profile.role || profile.role === 'creator' || profile.role === 'client';
      const creatorHandle = (profile.instagram_handle || profile.username || '').replace(/^@/, '').trim();
      const collabCompletionRoute = creatorHandle
        ? `/${creatorHandle}?edit=true&required=1`
        : '/creator-profile?required=1';
      const collabProfileComplete = isCreatorOrSimilarRole
        ? (profile.onboarding_complete ? true : isCreatorCollabProfileComplete(profile))
        : true;
      const collabBypassRoutes = ['/creator-onboarding', '/creator-profile', '/collab/'];
      const isOnHandleCollabRoute = Boolean(creatorHandle) && location.pathname === `/${creatorHandle}`;
      const isOnCollabBypassRoute = collabBypassRoutes.some((route) =>
        route === '/collab/' ? location.pathname.startsWith(route) : location.pathname.startsWith(route)
      ) || isOnHandleCollabRoute;
      const isOnOnboardingRoute = location.pathname.startsWith('/creator-onboarding');

      // Special case: pratyushraj@outlook.com always gets creator dashboard
      const userEmail = user?.email?.toLowerCase();
      const isPratyush = userEmail === 'pratyushraj@outlook.com';

      // Only redirect to specific dashboards for explicit roles (admin, CA, lawyer)
      // But always use creator dashboard for pratyushraj@outlook.com
      if (isPratyush) {
        targetDashboard = '/creator-dashboard';
      } else if (profile.role === 'admin') {
        targetDashboard = '/admin-dashboard';
      } else if (profile.role === 'chartered_accountant') {
        targetDashboard = '/ca-dashboard';
      } else if (profile.role === 'brand') {
        targetDashboard = '/brand-dashboard';
      } else if (profile.role === 'lawyer') {
        targetDashboard = '/lawyer-dashboard';
      } else {
        // Default: Creator (or client/null role)
        if (isCreatorOrSimilarRole && !profile.onboarding_complete) {
          targetDashboard = '/creator-onboarding';
        } else if (isCreatorOrSimilarRole && !collabProfileComplete) {
          targetDashboard = collabCompletionRoute;
        } else {
          targetDashboard = '/creator-dashboard';
        }
      }

      // Only redirect from login or root - don't redirect if already on a valid route
      if (location.pathname === '/login' || location.pathname === '/') {
        navigate(targetDashboard, { replace: true });
        return;
      }

      // Hard gate: onboarding must be completed before creators can access dashboard/app routes.
      if (isCreatorOrSimilarRole && !profile.onboarding_complete && !isOnOnboardingRoute) {
        navigate('/creator-onboarding', { replace: true });
        return;
      }

      // Hard gate: creator must complete collab profile before entering dashboard/app routes.
      if (
        isCreatorOrSimilarRole &&
        profile.onboarding_complete &&
        !collabProfileComplete &&
        !isOnCollabBypassRoute
      ) {
        navigate(collabCompletionRoute, { replace: true });
        return;
      }

      // Check if user has required role
      // For new accounts, if role is null/undefined, default to 'creator' role
      const userRole = profile.role || 'creator';

      // List of valid creator routes that should be accessible
      const validCreatorRoutes = [
        '/creator-dashboard',
        '/creator-contracts',
        '/creator-payments',
        '/creator-content-protection',
        '/messages',
        '/calendar',
        '/create-deal',
        '/payment',
        '/deal',
        '/contract-upload',
        '/contract-analyzer',
        '/contract-comparison',
        '/contract-protection',
        '/rate-calculator',
        '/ai-pitch-generator',
        '/creator-profile',
        '/creator-analytics',
        '/brand-directory',
        '/brands',
      ];

      // List of lawyer-specific routes
      const validLawyerRoutes = [
        '/lawyer-dashboard',
      ];

      // Check if current path is a valid creator route
      const isOnValidCreatorRoute = validCreatorRoutes.some(route =>
        location.pathname === route || location.pathname.startsWith(route + '/')
      );

      // Check if current path is a lawyer route
      const isLawyerRoute = location.pathname.startsWith('/lawyer-dashboard');
      const isAdvisorRoute = location.pathname.startsWith('/advisor-dashboard');
      const isAdminRoute = location.pathname.startsWith('/admin-');
      const isCARoute = location.pathname.startsWith('/ca-dashboard');

      if (allowedRoles && allowedRoles.length > 0) {
        // If profile role is null/undefined, treat as 'creator' for new accounts
        // For new accounts, if role is null/undefined and allowedRoles includes 'creator', allow access
        const isNewAccountWithNullRole = !profile.role && allowedRoles.includes('creator');
        if (!isNewAccountWithNullRole && !allowedRoles.includes(userRole)) {
          // User doesn't have required role - redirect to their dashboard
          navigate(targetDashboard, { replace: true });
          return;
        }

        // User has required role - but check if they're trying to access wrong dashboard
        // Lawyers should only access lawyer routes, not creator routes
        const isOnValidLawyerRoute = validLawyerRoutes.some(route =>
          location.pathname === route || location.pathname.startsWith(route + '/')
        );

        if (userRole === 'lawyer') {
          // Lawyers should only access lawyer routes
          if (isOnValidCreatorRoute && !isOnValidLawyerRoute) {
            // Lawyer trying to access creator route - redirect to lawyer dashboard
            navigate('/lawyer-dashboard', { replace: true });
            return;
          }
          // If lawyer is on a valid lawyer route, allow access
          if (isOnValidLawyerRoute) {
            return; // Allow the route to render
          }
        }

        // Creators should only access creator routes, not lawyer routes
        if (userRole === 'creator' && (isLawyerRoute || isAdvisorRoute || isAdminRoute || isCARoute)) {
          // Creator trying to access non-creator route - redirect to creator dashboard
          navigate('/creator-dashboard', { replace: true });
          return;
        }
      }

      // If user is on a valid creator route and has the right role, allow access
      // Don't redirect if already on a valid route
      if (isOnValidCreatorRoute && (allowedRoles?.includes(userRole) || !allowedRoles || allowedRoles.length === 0)) {
        // But only if user is actually a creator (or no role restrictions)
        if (!allowedRoles || allowedRoles.length === 0 || userRole === 'creator') {
          return; // Allow the route to render
        }
      }
    } else if (!session && authStatus === 'unauthenticated') {
      const isRootPath = location.pathname === '/';
      const isLoginPage = location.pathname === '/login';

      if (!isRootPath && !isLoginPage) {
        navigate('/login', { replace: true });
      }
    }
  }, [session, authStatus, loading, profile, isAdmin, isCreator, allowedRoles, navigate, location.pathname, user, refetchProfile, profileCreationAttempts]);

  // Show AuthLoadingScreen only while we have no profile during auth init.
  // Once profile is loaded, render the dashboard immediately to avoid a loader loop
  // (previously we always returned AuthLoadingScreen when isAuthInitializing, which kept users stuck)
  if (isAuthInitializing && session && !profile) {
    return <AuthLoadingScreen />;
  }

  // Global auth/profile loading gate for all protected routes
  if (authStatus === 'loading' || isCreatingProfile) {
    if (loaderTimedOut && session) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-teal-50 px-4">
          <p className="text-lg text-slate-900 text-center font-semibold mb-2">Taking longer than usual?</p>
          <p className="text-sm text-slate-600 text-center max-w-md mb-6">
            You can continue to your dashboard. Your profile will finish loading there.
          </p>
          <button
            type="button"
            onClick={() => window.location.replace('/creator-dashboard')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
          >
            Continue to dashboard
          </button>
        </div>
      );
    }
    return (
      <FullScreenLoader
        message={isCreatingProfile ? 'Setting up your account...' : 'Preparing your protected workspace...'}
        secondaryMessage={isCreatingProfile ? 'This may take a few seconds' : undefined}
      />
    );
  }

  if (!session && location.pathname === '/') {
    return <>{children}</>;
  }

  // If we have a session but no profile after all attempts, show error message
  if (session && !profile && user) {
    return (
      <div className="nb-screen-height flex flex-col items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Account Setup Issue</h2>
          <p className="text-slate-600 mb-6">
            We're having trouble setting up your account. Please try refreshing the page or contact support if the issue persists.
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Allow rendering if user has session, even if profile is still loading
  // The route permission checks above will handle role-based access
  // For new accounts, profile might be null but they should still be able to access creator routes
  if (!session) {
    return null;
  }

  // If profile doesn't exist but user has session and is on a creator route with 'creator' in allowedRoles, allow access
  if (!profile && session && allowedRoles?.includes('creator')) {
    const validCreatorRoutesList = [
      '/creator-dashboard',
      '/creator-contracts',
      '/creator-payments',
      '/creator-content-protection',
      '/messages',
      '/calendar',
      '/create-deal',
      '/payment',
      '/deal',
      '/contract-upload',
      '/contract-analyzer',
      '/contract-comparison',
      '/contract-protection',
      '/rate-calculator',
      '/ai-pitch-generator',
      '/creator-profile',
      '/creator-analytics',
      '/brand-directory',
      '/brands',
    ];
    const isOnValidCreatorRoute = validCreatorRoutesList.some((route: string) =>
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
    if (isOnValidCreatorRoute) {
      return <>{children}</>;
    }
  }

  if (!profile) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
