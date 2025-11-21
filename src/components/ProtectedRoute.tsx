"use client";

import React, { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MadeWithDyad } from '@/components/made-with-dyad';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'chartered_accountant' | 'creator')[]; // Updated allowedRoles type
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, profile, isAdmin, isCreator } = useSession(); // Added isCreator

  useEffect(() => {
    if (loading) {
      return;
    }

    if (session && profile) {
      let targetDashboard = '/client-dashboard';
      if (profile.role === 'admin') {
        targetDashboard = '/admin-dashboard';
      } else if (profile.role === 'chartered_accountant') {
        targetDashboard = '/ca-dashboard';
      } else if (profile.role === 'creator') {
        // NEW: Creator Onboarding Check
        if (!profile.onboarding_complete && location.pathname !== '/creator-onboarding') {
          targetDashboard = '/creator-onboarding';
          navigate(targetDashboard, { replace: true });
          return;
        }
        targetDashboard = '/creator-dashboard';
      }

      if (location.pathname === '/login' || location.pathname === '/') {
        navigate(targetDashboard, { replace: true });
        return;
      }

      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        navigate(targetDashboard, { replace: true });
        return;
      }
    } else {
      const isRootPath = location.pathname === '/';
      const isLoginPage = location.pathname === '/login';

      if (!isRootPath && !isLoginPage) {
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