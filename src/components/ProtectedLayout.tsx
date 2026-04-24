

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import CreatorAppModeGate from '@/components/pwa/CreatorAppModeGate';
import { useSession } from '@/contexts/SessionContext';

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'creator' | 'chartered_accountant' | 'lawyer' | 'brand')[];
}

const ProtectedLayout = ({ children, allowedRoles }: ProtectedLayoutProps) => {
  const location = useLocation();
  const { profile } = useSession();
  const isAdvisorRoute = location.pathname.startsWith('/advisor-dashboard');
  const isLawyerRoute = location.pathname.startsWith('/lawyer-dashboard');
  const creatorAllowed = !!allowedRoles?.includes('creator');
  const isCreatorProfile = profile?.role === 'creator';
  const enforceAppMode = creatorAllowed && isCreatorProfile;

  // Standalone dashboards (advisor/lawyer) don't need Layout wrapper
  if (isAdvisorRoute || isLawyerRoute) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        {children}
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <CreatorAppModeGate enabled={enforceAppMode}>
        <Layout>
          {children}
        </Layout>
      </CreatorAppModeGate>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;
