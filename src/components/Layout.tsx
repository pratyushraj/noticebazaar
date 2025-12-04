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
  const { profile } = useSession();
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
                        location.pathname.startsWith('/create-deal');
  
  // Show bottom nav for creator routes (default for all users), hide for admin/CA/lawyer/advisor routes
  // Allow bottom nav even if profile role is null/undefined (new accounts default to creator)
  const shouldShowBottomNav = isCreatorRoute && !isOnboarding && !isAdminRoute && !isCARoute && !isLawyerRoute && !isAdvisorRoute && !isClientRoute && !!profile;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Skip to main content link */}
      <a 
        href="#main" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:bg-purple-600 focus:text-white focus:p-4 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-400/50"
      >
        Skip to main content
      </a>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Modern Navbar */}
        <Navbar />
        
        <div className="flex flex-1">
          <main 
            id="main"
            className={cn(
              "flex-1 w-full py-6 px-4 md:px-6 lg:px-8 pb-20 md:pb-24 transition-all duration-300 ease-in-out",
              isOpen && "md:ml-[280px]"
            )}
          >
            {children}
          </main>
        </div>
        
        {/* Bottom Navigation - Primary navigation for creators (all screen sizes) */}
        {shouldShowBottomNav && <CreatorBottomNav />}
        
        {/* Footer - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block text-center py-8 text-sm text-white/30 mt-auto">
          <a href="#" className="hover:underline">Legal Resources</a> | <MadeWithDyad />
        </div>
      </div>
    </div>
  );
};

export default Layout;