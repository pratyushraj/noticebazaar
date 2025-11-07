"use client";

import React, { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { cn } from '@/lib/utils';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'chartered_accountant')[]; // Updated allowedRoles type
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, profile, isAdmin } = useSession();

  useEffect(() => {
    console.log('ProtectedRoute useEffect triggered:', {
      loading,
      sessionExists: !!session,
      profileExists: !!profile,
      isAdmin,
      profileRole: profile?.role, // Log profile role
      pathname: location.pathname,
      allowedRoles
    });

    if (loading) {
      // Still loading session/profile, do nothing yet
      return;
    }

    // --- Authentication Check ---
    if (session && profile) {
      // User is authenticated and profile is loaded
      let targetDashboard = '/client-dashboard'; // Default for clients
      if (profile.role === 'admin') {
        targetDashboard = '/admin-dashboard';
      } else if (profile.role === 'chartered_accountant') {
        targetDashboard = '/ca-dashboard';
      }

      // 1. If on login page or root, redirect to appropriate dashboard
      if (location.pathname === '/login' || location.pathname === '/') {
        console.log(`ProtectedRoute: Authenticated on ${location.pathname}, redirecting to ${targetDashboard}`);
        navigate(targetDashboard, { replace: true });
        return;
      }

      // 2. Check role for other protected routes
      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        console.log(`ProtectedRoute: Redirecting from ${location.pathname} to ${targetDashboard} (role not allowed)`);
        navigate(targetDashboard, { replace: true });
        return;
      }
    } else {
      // User is NOT authenticated or profile is missing
      const isRootPath = location.pathname === '/';
      const isLoginPage = location.pathname === '/login';

      // If trying to access a protected route (i.e., not '/' or '/login'), redirect to login
      if (!isRootPath && !isLoginPage) {
        console.log('ProtectedRoute: Not authenticated, redirecting to /login');
        navigate('/login', { replace: true });
      }
      // If on '/' or '/login', allow rendering (MarketingHome or Login component handles it)
    }
  }, [session, loading, profile, isAdmin, allowedRoles, navigate, location.pathname]);

  // Show loading spinner while the session/profile is being loaded.
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader2 className={cn("h-12 w-12 animate-spin text-blue-600")} />
        <p className="mt-4 text-lg text-blue-700">Loading application...</p>
        <MadeWithDyad />
      </div>
    );
  }

  // If the user is not authenticated AND they are on the root path, allow rendering the children (which will be MarketingHome).
  if (!session && location.pathname === '/') {
    return <>{children}</>;
  }

  // If we've made it here, and the user is not authenticated, they must be on /login or they are trying to access a protected route and will be redirected by useEffect.
  if (!session || !profile) {
    return null;
  }

  // If authenticated and all checks pass, render the protected content.
  return <>{children}</>;
};

export default ProtectedRoute;