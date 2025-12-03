"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'chartered_accountant' | 'creator')[]; // Updated allowedRoles type
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, profile, isAdmin, isCreator, refetchProfile, user } = useSession(); // Added refetchProfile and user
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileCreationAttempts, setProfileCreationAttempts] = useState(0);

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
    if (loading) {
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
      
      // Special case: pratyushraj@outlook.com always gets creator dashboard
      const userEmail = user?.email?.toLowerCase();
      const isPratyush = userEmail === 'pratyushraj@outlook.com';
      
      // Only redirect to specific dashboards for explicit roles (admin, CA)
      // But always use creator dashboard for pratyushraj@outlook.com
      if (isPratyush) {
        targetDashboard = '/creator-dashboard';
      } else if (profile.role === 'admin') {
        targetDashboard = '/admin-dashboard';
      } else if (profile.role === 'chartered_accountant') {
        targetDashboard = '/ca-dashboard';
      } else {
        // Default: Creator Dashboard (for 'creator', 'client', null role, or any other role)
        // Allow access to dashboard even if onboarding isn't complete
        // Users can complete onboarding later if needed
        targetDashboard = '/creator-dashboard';
      }

      // Only redirect from login or root - don't redirect if already on a valid route
      if (location.pathname === '/login' || location.pathname === '/') {
        navigate(targetDashboard, { replace: true });
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
      ];
      
      // Check if current path is a valid creator route
      const isOnValidCreatorRoute = validCreatorRoutes.some(route => 
        location.pathname === route || location.pathname.startsWith(route + '/')
      );
      
      if (allowedRoles && allowedRoles.length > 0) {
        // If profile role is null/undefined, treat as 'creator' for new accounts
        if (!allowedRoles.includes(userRole)) {
          // Only redirect if not already on a valid creator route
          // This prevents redirect loops when navigating between creator pages
          if (!isOnValidCreatorRoute) {
            navigate(targetDashboard, { replace: true });
          }
          return;
        }
      }
      
      // If user is on a valid creator route and has the right role, allow access
      // Don't redirect if already on a valid route
      if (isOnValidCreatorRoute && (allowedRoles?.includes(userRole) || !allowedRoles || allowedRoles.length === 0)) {
        return; // Allow the route to render
      }
    } else if (!session) {
      const isRootPath = location.pathname === '/';
      const isLoginPage = location.pathname === '/login';

      if (!isRootPath && !isLoginPage) {
        navigate('/login', { replace: true });
      }
    }
  }, [session, loading, profile, isAdmin, isCreator, allowedRoles, navigate, location.pathname, user, refetchProfile, profileCreationAttempts]);

  if (loading || isCreatingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Loader2 className={cn("h-12 w-12 animate-spin text-purple-400")} />
        <p className="mt-4 text-lg text-white/90">
          {isCreatingProfile ? 'Setting up your account...' : 'Loading application...'}
        </p>
        {isCreatingProfile && (
          <p className="mt-2 text-sm text-white/70">
            This may take a few seconds
          </p>
        )}
        <MadeWithDyad />
      </div>
    );
  }

  if (!session && location.pathname === '/') {
    return <>{children}</>;
  }

  // If we have a session but no profile after all attempts, show error message
  if (session && !profile && user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Account Setup Issue</h2>
          <p className="text-white/80 mb-6">
            We're having trouble setting up your account. Please try refreshing the page or contact support if the issue persists.
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Refresh Page
          </button>
        </div>
        <MadeWithDyad />
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;