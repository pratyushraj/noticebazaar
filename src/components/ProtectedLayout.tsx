"use client";

import React, { ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'admin' | 'creator' | 'chartered_accountant' | 'lawyer')[];
}

const ProtectedLayout = ({ children, allowedRoles }: ProtectedLayoutProps) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;