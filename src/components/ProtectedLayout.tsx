"use client";

import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'creator' | 'chartered_accountant' | 'lawyer')[];
}

const ProtectedLayout = ({ children, allowedRoles }: ProtectedLayoutProps) => {
  const location = useLocation();
  const isAdvisorRoute = location.pathname.startsWith('/advisor-dashboard');
  const isLawyerRoute = location.pathname.startsWith('/lawyer-dashboard');
  
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
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;