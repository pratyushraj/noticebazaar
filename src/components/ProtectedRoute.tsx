"use client";

import React, { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { cn } from '@/lib/utils';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'chartered_accountant' | 'creator')[]; // Updated allowedRoles type
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, profile, isAdmin, isCreator } = useSession(); // Added isCreator

  useEffect(() => {
    console.log('ProtectedRoute useEffect triggered:', {
      loading,
      sessionExists: !!session,
      profileExists: !!profile,
      isAdmin,
      isCreator, // Log isCreator
      profileRole: profile?.role,
      pathname: location.pathname,
      allowedRoles
    });

    if (loading) {
      return;
    }

    if (session && profile) {
      let targetDashboard = '/client-dashboard';
      if (profile.role === 'admin') {
        targetDashboard = '/admin-dashboard';
      } else if (profile.role === 'chartered_accountant') {
        targetDashboard = '/ca-dashboard';
      } else if (profile.role === 'creator') { // New: Redirect creator to their dashboard
        targetDashboard = '/creator-dashboard';
      }

      if (location.pathname === '/login' || location.pathname === '/') {
        console.log(`ProtectedRoute: Authenticated on ${location.pathname}, redirecting to ${targetDashboard}`);
        navigate(targetDashboard, { replace: true });
        return;
      }

      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        console.log(`ProtectedRoute: Redirecting from ${location.pathname} to ${targetDashboard} (role not allowed)`);
        navigate(targetDashboard, { replace: true });
        return;
      }
    } else {
      const isRootPath = location.pathname === '/';
      const isLoginPage = location.pathname === '/login';

      if (!isRootPath && !isLoginPage) {
        console.log('ProtectedRoute: Not authenticated, redirecting to /login');
        navigate('/login', { replace: true });
      }
    }
  }, [session, loading, profile, isAdmin, isCreator, allowedRoles, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader2 className={cn("h-12 w-12 animate-spin text-blue-600")} />
        <p className="mt-4 text-lg text-blue-700">Loading application...</p>
        <MadeWithDyad />
      </div>
    );
  }

  if (!session && location.pathname === '/') {
    return <>{children}</>;
  }

  if (!session || !profile) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;