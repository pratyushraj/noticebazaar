"use client";

import React, { ReactNode } from 'react';
import Header from '@/components/Header';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useSession } from '@/contexts/SessionContext';
import BottomNavigationBar from './BottomNavigationBar';
import { useQueryClient } from '@tanstack/react-query';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAdmin, profile } = useSession(); // Get isAdmin status and profile
  const queryClient = useQueryClient(); // Initialize queryClient

  // Functions to refetch data after quick actions
  const refetchDocuments = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['activity_log', profile?.id] });
  };

  const refetchConsultations = () => {
    queryClient.invalidateQueries({ queryKey: ['consultations', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['activity_log', profile?.id] });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar hidden - navigation now in top navbar */}
        <main className="flex-1 w-full py-6 px-4 md:px-6 lg:px-8 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      {/* Bottom navigation is now mobile-only */}
      <BottomNavigationBar
        onDocumentUploadSuccess={refetchDocuments}
        onConsultationBookingSuccess={refetchConsultations}
      />
      {/* Footer - Only visible when content is scrolled to bottom */}
      <div className="text-center py-6 md:py-8 text-sm text-muted-foreground mt-auto">
        <a href="#" className="hover:underline">Legal Resources</a> | <MadeWithDyad />
      </div>
    </div>
  );
};

export default Layout;