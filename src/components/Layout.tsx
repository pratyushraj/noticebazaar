"use client";

import { ReactNode } from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0C0F13] to-[#131720] overflow-hidden">
      {/* Blue Glow */}
      <div className="pointer-events-none absolute top-[-12rem] right-[-12rem] w-[50rem] h-[50rem] bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent)] blur-3xl opacity-90" />
      
      {/* Purple Glow */}
      <div className="pointer-events-none absolute bottom-[-14rem] left-[-14rem] w-[50rem] h-[50rem] bg-[radial-gradient(circle,rgba(168,85,247,0.18),transparent)] blur-3xl opacity-90" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex flex-1">
          {/* Sidebar hidden - navigation now in top navbar */}
          <main className="flex-1 w-full py-6 px-4 md:px-6 lg:px-8">
            {children}
          </main>
        </div>
        {/* Footer - Only visible when content is scrolled to bottom - Mobile: text-[10px], reduced padding */}
        <div className="text-center py-3 md:py-8 text-[10px] md:text-sm text-muted-foreground mt-auto">
          <a href="#" className="hover:underline">Legal Resources</a> | <MadeWithDyad />
        </div>
      </div>
    </div>
  );
};

export default Layout;