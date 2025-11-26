"use client";

import { ReactNode } from 'react';
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
  const isCreator = profile?.role === 'creator';
  const { isOpen } = useSidebar();

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
        {isCreator && <CreatorBottomNav />}
        
        {/* Footer - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block text-center py-8 text-sm text-white/30 mt-auto">
          <a href="#" className="hover:underline">Legal Resources</a> | <MadeWithDyad />
        </div>
      </div>
    </div>
  );
};

export default Layout;