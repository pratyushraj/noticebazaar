"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import FullScreenLoader from '@/components/FullScreenLoader';
import { getCollabReadiness } from '@/lib/collab/readiness';
import { routes } from '@/lib/routes';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer' | 'brand')[];
  requiredRole?: 'client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer' | 'brand';
}

// Production safety: don't render protected UI until session + profile are resolved.

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
    // Keep onboarding optional; creators should still be able to access the dashboard.
    default: return '/creator-dashboard';
  }
}

type AppRole = 'client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer' | 'brand';

const inferRequestedRole = (
  path: string,
  allowedRoles?: AppRole[],
  metadata?: Record<string, unknown> | null,
): AppRole => {
  const metadataRole = typeof metadata?.role === 'string' ? metadata.role : typeof metadata?.account_mode === 'string' ? metadata.account_mode : null;
  if (metadataRole === 'brand') return 'brand';
  if (metadataRole === 'admin' || metadataRole === 'lawyer' || metadataRole === 'chartered_accountant' || metadataRole === 'client') {
    return metadataRole;
  }
  if (path.startsWith('/brand-') || allowedRoles?.includes('brand')) return 'brand';
  if (path.startsWith('/admin-') || allowedRoles?.includes('admin')) return 'admin';
  if (path.startsWith('/lawyer-') || allowedRoles?.includes('lawyer')) return 'lawyer';
  if (path.startsWith('/ca-') || allowedRoles?.includes('chartered_accountant')) return 'chartered_accountant';
  return 'creator';
};

const ProtectedRoute = ({ children, allowedRoles, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, authStatus, profile, refetchProfile, user, isAuthInitializing } = useSession();
  const requestedRole = inferRequestedRole(location.pathname, allowedRoles, (user?.user_metadata || {}) as Record<string, unknown>);
  const isLoading = authStatus === 'loading' || (session && !profile);

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

  // Loading gate (no bypass)
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-teal-50 px-4">
        <FullScreenLoader message="Preparing your protected workspace..." />
        {session && (
          <button
            onClick={() => refetchProfile?.()}
            className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
          >
            Retry loading profile
          </button>
        )}
      </div>
    );
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
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => refetchProfile?.()} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors">
              Retry
            </button>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white border border-emerald-200 text-emerald-800 rounded-lg font-semibold transition-colors">
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
