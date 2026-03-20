"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { isCreatorPro } from '@/lib/subscription';
import { Loader2 } from 'lucide-react';

interface ProProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route protection component that ensures only Creator Pro users can access the route
 * Redirects non-Pro users to upgrade page
 */
const ProProtectedRoute = ({ children }: ProProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, loading } = useSession();
  const [isChecking, setIsChecking] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const checkProStatus = async () => {
      if (loading || !user || !profile) {
        return;
      }

      setIsChecking(true);
      
      // Check Pro status
      const proStatus = await isCreatorPro(user.id);
      setIsPro(proStatus);

      if (!proStatus) {
        // Redirect to upgrade page with source parameter
        const source = location.pathname.includes('consumer-complaints') 
          ? 'consumer-complaints' 
          : 'feature';
        navigate(`/upgrade?source=${source}`, { replace: true });
      }

      setIsChecking(false);
    };

    checkProStatus();
  }, [loading, user, profile, navigate, location.pathname]);

  if (loading || isChecking) {
    return (
      <div className="nb-screen-height flex items-center justify-center bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return null; // Redirect will happen
  }

  return <>{children}</>;
};

export default ProProtectedRoute;





