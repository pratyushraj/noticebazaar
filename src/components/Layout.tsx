"use client";

import { ReactNode } from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import Navbar from '@/components/navbar/Navbar';
import CreatorBottomNav from '@/components/creator-dashboard/CreatorBottomNav';
import { useSession } from '@/contexts/SessionContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { profile } = useSession();
  const isCreator = profile?.role === 'creator';

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 animate-gradient-shift" />
      
      {/* Subtle animated orbs for depth */}
      <div className="fixed top-20 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div 
        className="fixed bottom-20 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-pulse pointer-events-none" 
        style={{ animationDelay: '2s' }} 
      />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Modern Navbar */}
        <Navbar />
        
        <div className="flex flex-1">
          {/* Sidebar hidden - navigation now in top navbar */}
          <main className="flex-1 w-full py-6 px-4 md:px-6 lg:px-8 pb-24 md:pb-6">
            {children}
          </main>
        </div>
        
        {/* Bottom Navigation - Only for creators on mobile */}
        {isCreator && <CreatorBottomNav />}
        
        {/* Footer - Only visible when content is scrolled to bottom - Mobile: text-[10px], reduced padding */}
        <div className="text-center py-3 md:py-8 text-[10px] md:text-sm text-white/30 mt-auto">
          <a href="#" className="hover:underline">Legal Resources</a> | <MadeWithDyad />
        </div>
      </div>
    </div>
  );
};

export default Layout;