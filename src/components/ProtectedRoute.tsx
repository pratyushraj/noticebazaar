"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import FullScreenLoader from '@/components/FullScreenLoader';
import { supabase } from '@/integrations/supabase/client';
import { getCollabReadiness } from '@/lib/collab/readiness';
import { routes } from '@/lib/routes';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer' | 'brand')[];
  requiredRole?: 'client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer' | 'brand';
}

const LOADER_TIMEOUT_MS = 8000;
const MAX_PROFILE_RETRIES = 5;

/** Check if creator collab profile is complete */
function isCollabProfileComplete(profile: any): boolean {
  if (!profile) return false;
  const readiness = getCollabReadiness({
    instagramHandle: profile.instagram_handle || profile.username || null,
    category: profile.creator_category || null,
    niches: profile.content_niches || null,
    topCities: profile.top_cities || null,
    audienceGenderSplit: profile.audience_gender_split || null,
    primaryAudienceLanguage: profile.primary_audience_language || null,
    postingFrequency: profile.posting_frequency || null,
    avgReelViews: profile.avg_reel_views_manual || null,
    avgLikes: profile.avg_likes_manual || null,
    openToCollabs: profile.open_to_collabs,
    avgRateReel: profile.avg_rate_reel || null,
    pricingMin: profile.pricing_min || null,
    pricingAvg: profile.pricing_avg || null,
    pricingMax: profile.pricing_max || null,
    regionLabel: profile.collab_region_label || null,
    mediaKitUrl: profile.media_kit_url || null,
  });
  return readiness.stageKey === 'collaboration_ready' || readiness.stageKey === 'campaign_ready';
}

/** Determine the target dashboard for a user based on role */
function getTargetDashboard(profile: any): string {
  switch (profile?.role) {
    case 'admin': return '/admin-dashboard';
    case 'chartered_accountant': return '/ca-dashboard';
    case 'brand': return '/brand-dashboard';
    case 'lawyer': return '/lawyer-dashboard';
    default: return profile?.onboarding_complete ? '/creator-dashboard' : '/creator-onboarding';
  }
}

/** Fallback: create profile if DB trigger failed */
async function createProfileFallback(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({ id: userId, role: 'creator', onboarding_complete: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    return !error || error.code === '23505';
  } catch {
    return false;
  }
}

const ProtectedRoute = ({ children, allowedRoles, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, authStatus, profile, refetchProfile, user, isAuthInitializing } = useSession();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [loaderTimedOut, setLoaderTimedOut] = useState(false);

  const isLoading = authStatus === 'loading' || isCreatingProfile;

  // Loader timeout — give user an escape hatch after 8s
  useEffect(() => {
    if (!isLoading) { setLoaderTimedOut(false); return; }
    const timer = setTimeout(() => setLoaderTimedOut(true), LOADER_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Profile creation retry logic
  useEffect(() => {
    if (authStatus === 'loading' || !session || profile || !user) return;

    setIsCreatingProfile(true);
    let attempt = 0;

    const tryGetProfile = async () => {
      if (attempt >= MAX_PROFILE_RETRIES) {
        await createProfileFallback(user.id);
        refetchProfile?.();
        setIsCreatingProfile(false);
        return;
      }
      refetchProfile?.();
      attempt++;
      setTimeout(async () => {
        const { data } = await supabase.from('profiles').select('id').eq('id', user.id as any).single();
        if (data) {
          refetchProfile?.();
          setIsCreatingProfile(false);
        } else {
          tryGetProfile();
        }
      }, attempt * 1000);
    };

    tryGetProfile();
  }, [session, profile, user, authStatus, refetchProfile]);

  // Route guard logic
  useEffect(() => {
    if (authStatus === 'loading') return;

    const path = location.pathname;
    const handle = (profile?.instagram_handle || profile?.username || '').replace(/^@/, '').trim();
    const userRole = profile?.role || 'creator';

    // Unauthenticated — redirect to login
    if (!session && authStatus === 'unauthenticated' && !routes.isRoot(path) && !routes.isAuth(path)) {
      navigate('/login', { replace: true });
      return;
    }

    if (!session || !profile) return;

    const targetDashboard = getTargetDashboard(profile);

    // Redirect from login/root to dashboard
    if (routes.isRoot(path) || routes.isAuth(path)) {
      navigate(targetDashboard, { replace: true });
      return;
    }

    // Role-based access control
    const effectiveAllowedRoles = allowedRoles ?? (requiredRole ? [requiredRole] : undefined);

    if (effectiveAllowedRoles && effectiveAllowedRoles.length > 0) {
      const hasRole = effectiveAllowedRoles.includes(userRole) || (!profile.role && effectiveAllowedRoles.includes('creator'));
      if (!hasRole) {
        navigate(targetDashboard, { replace: true });
        return;
      }

      // Enforce route/role boundaries
      if (userRole === 'lawyer' && routes.isCreator(path)) {
        navigate('/lawyer-dashboard', { replace: true });
        return;
      }
      if ((userRole === 'creator' || !userRole) && (routes.isLawyer(path) || routes.isAdvisor(path) || routes.isAdmin(path) || routes.isCA(path))) {
        navigate('/creator-dashboard', { replace: true });
        return;
      }
    }
  }, [session, authStatus, profile, allowedRoles, requiredRole, navigate, location.pathname, user, refetchProfile]);

  // --- Render logic ---

  // Show auth init screen while bootstrapping
  if (isAuthInitializing && session && !profile) {
    return <AuthLoadingScreen />;
  }

  // Loading gate with timeout escape
  if (isLoading) {
    if (loaderTimedOut && session) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-teal-50 px-4">
          <p className="text-lg text-slate-900 text-center font-semibold mb-2">Taking longer than usual?</p>
          <p className="text-sm text-slate-600 text-center max-w-md mb-6">You can continue to your dashboard. Your profile will finish loading there.</p>
          <button onClick={() => navigate('/creator-dashboard', { replace: true })} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-lg">
            Continue to dashboard
          </button>
        </div>
      );
    }
    return <FullScreenLoader message={isCreatingProfile ? 'Setting up your account...' : 'Preparing your protected workspace...'} secondaryMessage={isCreatingProfile ? 'This may take a few seconds' : undefined} />;
  }

  // No session
  if (!session) return null;

  // Session but no profile — show error
  if (session && !profile && user) {
    return (
      <div className="nb-screen-height flex flex-col items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Account Setup Issue</h2>
          <p className="text-slate-600 mb-6">We're having trouble setting up your account. Please try refreshing the page or contact support if the issue persists.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors">
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
