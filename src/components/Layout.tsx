"use client";

import React, { ReactNode } from 'react';
import Header from '@/components/Header';
import { MadeWithDyad } from '@/components/made-with-dyad';
import Sidebar from '@/components/Sidebar'; // Import Sidebar
import { useSession } from '@/contexts/SessionContext'; // Import useSession
import BottomNavigationBar from './BottomNavigationBar'; // Import BottomNavigationBar
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

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
    <div className="min-h-screen bg-background flex flex-col"> {/* Changed bg-gray-100 to bg-background */}
      <Header />
      <div className="flex flex-1"> {/* Flex container for sidebar and main content */}
        <Sidebar className="w-64 hidden md:flex" /> {/* Always render sidebar on md+ screens */}
        <main className="flex-1 py-8 px-3 md:px-4 pb-20 md:pb-8"> {/* Reduced mobile px to px-3 */}
          {children}
        </main>
      </div>
      {/* Bottom navigation is now mobile-only */}
      <BottomNavigationBar
        onDocumentUploadSuccess={refetchDocuments}
        onConsultationBookingSuccess={refetchConsultations}
      />
      <div className="text-center py-4 text-sm text-muted-foreground">
        <a href="#" className="hover:underline">Legal Resources</a> | <MadeWithDyad />
      </div>
    </div>
  );
};

export default Layout;