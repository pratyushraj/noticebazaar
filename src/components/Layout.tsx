"use client";

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';
import Navbar from '@/components/navbar/Navbar';
import CreatorBottomNav from '@/components/creator-dashboard/CreatorBottomNav';
import { useSession } from '@/contexts/SessionContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { profile, session } = useSession();
  const location = useLocation();
  const { isOpen } = useSidebar();
  
  // Show bottom nav for all users on creator routes (since creator dashboard is default)
  // Hide bottom nav during onboarding and for admin/CA/lawyer routes
  const isOnboarding = location.pathname === '/creator-onboarding';
  const isAdminRoute = location.pathname.startsWith('/admin-');
  const isCARoute = location.pathname.startsWith('/ca-dashboard');
  const isLawyerRoute = location.pathname.startsWith('/lawyer-dashboard');
  const isAdvisorRoute = location.pathname.startsWith('/advisor-dashboard');
  const isClientRoute = location.pathname.startsWith('/client-');
  const isCreatorRoute = location.pathname.startsWith('/creator-') || 
                        location.pathname.startsWith('/messages') ||
                        location.pathname.startsWith('/calendar') ||
                        location.pathname.startsWith('/payment/') ||
                        location.pathname.startsWith('/create-deal') ||
                        location.pathname.startsWith('/contract-upload');
  
  // Show bottom nav for creator routes (default for all users), hide for admin/CA/lawyer/advisor routes
  // Allow bottom nav if:
  // 1. User is logged in (has session)
  // 2. Profile exists OR profile is still loading (for new accounts, profile might be created by trigger)
  // 3. User is not explicitly an admin/CA/lawyer/advisor (if profile exists and has a different role)
  const isNonCreatorRole = profile && profile.role && !['creator', null, undefined].includes(profile.role);
  const shouldShowBottomNav = isCreatorRoute && 
                              !isOnboarding && 
                              !isAdminRoute && 
                              !isCARoute && 
                              !isLawyerRoute && 
                              !isAdvisorRoute && 
                              !isClientRoute && 
                              !!session && // User must be logged in
                              !isNonCreatorRole; // Don't show if user has a non-creator role

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white overflow-hidden md:overflow-visible">
      {/* Skip to main content link */}
      <a 
        href="#main" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:bg-purple-600 focus:text-white focus:p-4 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-400/50"
      >
        Skip to main content
      </a>
      
      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Modern Navbar */}
        <Navbar />
        
        <div className="flex flex-1 min-h-0 overflow-hidden md:overflow-visible flex-col">
          <main 
            id="main"
            className={cn(
              "relative min-h-dvh flex-1 w-full py-6 px-4 md:px-6 lg:px-8 transition-all duration-300 ease-in-out",
              "overflow-y-auto overscroll-contain",
              isOpen && "md:ml-[280px]"
            )}
            style={{
              // Ensure main content always clears the bottom nav (56px) + safe area
              // Bottom nav is h-14 (56px) + 12px padding (6px top + 6px bottom) = 68px base
              // Plus safe area inset for iOS
              paddingBottom: `calc(68px + env(safe-area-inset-bottom, 0px))`,
            }}
          >
            {children}
          </main>
          
          {/* Footer - Hidden on mobile, shown on desktop, positioned at bottom */}
          <div className="hidden md:block text-center py-4 text-sm text-white/30 mt-auto">
            <a href="#" className="hover:underline">Legal Resources</a> | <MadeWithDyad />
          </div>
        </div>
        
        {/* Bottom Navigation - Primary navigation for creators (all screen sizes) */}
        {shouldShowBottomNav && <CreatorBottomNav />}
      </div>
    </div>
  );
};

export default Layout;