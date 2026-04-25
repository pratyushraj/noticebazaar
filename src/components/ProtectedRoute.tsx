

import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSignOut } from '@/lib/hooks/useAuth';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import FullScreenLoader from '@/components/FullScreenLoader';
import { getCollabReadiness } from '@/lib/collab/readiness';
import { routes } from '@/lib/routes';
import { Shield } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils/haptics';

const debugLog = (...args: any[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

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
    case 'brand': return profile?.onboarding_complete ? '/brand-dashboard' : '/brand-onboarding';
    case 'lawyer': return '/lawyer-dashboard';
    case 'creator': return profile?.onboarding_complete ? '/creator-dashboard' : '/creator-onboarding';
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
    const signOutMutation = useSignOut();
    // Do not infer role from path/metadata for authorization decisions.
    // `profiles.role` is the single source of truth.
    const isLoading = authStatus === 'loading';

  // Route guard logic
  useEffect(() => {
    if (authStatus === 'loading') return;

    const path = location.pathname;
    const userRole = profile?.role || null;

    // Unauthenticated — redirect to login
    // Safety: Wait for initialLoadComplete to be true before deciding user is unauthenticated
    if (!session && authStatus === 'unauthenticated' && !routes.isRoot(path) && !routes.isAuth(path)) {
      debugLog('[ProtectedRoute] Unauthenticated, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    if (!session || !profile) return;

    const targetDashboard = getTargetDashboard(profile);

    // Role-based access control
    const effectiveAllowedRoles = allowedRoles ?? (requiredRole ? [requiredRole] : undefined);

    if (effectiveAllowedRoles && effectiveAllowedRoles.length > 0) {
      // If role is missing, treat as setup issue (don't silently treat as creator).
      const hasRole = !!userRole && effectiveAllowedRoles.includes(userRole as AppRole);
      if (!hasRole) {
        navigate(targetDashboard, { replace: true });
        return;
      }

      // Enforce route/role boundaries
      if (userRole === 'lawyer' && routes.isCreator(path)) {
        navigate('/lawyer-dashboard', { replace: true });
        return;
      }
      if (userRole === 'creator' && (routes.isLawyer(path) || routes.isAdvisor(path) || routes.isAdmin(path) || routes.isCA(path))) {
        navigate('/creator-dashboard', { replace: true });
        return;
      }
    }
  }, [session, authStatus, profile, allowedRoles, requiredRole, navigate, location.pathname]);

  // --- Render logic ---

  // Unified loading gate to prevent screen flicker between different loaders
  if (isAuthInitializing || isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#020D0A]">
        <FullScreenLoader message="" />
      </div>
    );
  }

  // No session
  if (!session) return null;

  // Session but no profile — show error
  if (session && !profile && user) {
    return (
      <div className="nb-screen-height flex flex-col items-center justify-center bg-[#020D0A] p-4 font-outfit relative overflow-hidden">
        {/* Emerald Background Accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="text-center max-w-md relative z-10">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-3 uppercase tracking-wider">Account Setup Issue</h2>
          <p className="text-emerald-100/50 text-[13px] font-medium mb-8 leading-relaxed">
            We're having trouble retrieving your profile data. This can happen during high traffic or temporary connectivity shifts.
          </p>
         <div className="flex flex-col items-center gap-3">
           <button 
             onClick={() => {
               triggerHaptic?.();
               refetchProfile?.();
             }} 
             className="w-full max-w-[200px] px-6 py-3 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
           >
             Retry Connection
           </button>
           <button 
             onClick={() => {
               triggerHaptic?.();
               signOutMutation.mutateAsync(undefined).catch(() => {
                 // If signOut fails, still force reload as fallback
                 window.location.reload();
               });
             }} 
             className="w-full max-w-[200px] px-6 py-3 bg-emerald-500/20 text-emerald-500 rounded-xl text-[11px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all hover:bg-emerald-500/30 active:scale-95"
           >
             Sign In Again
           </button>
           <button 
             onClick={() => window.location.reload()} 
             className="text-[10px] text-emerald-500/40 hover:text-emerald-500/60 font-black uppercase tracking-widest transition-colors"
           >
             Force Reload Page
           </button>
         </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
