"use client";

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/navbar/Navbar';
import CreatorBottomNav from '@/components/creator-dashboard/CreatorBottomNav';
import { useSession } from '@/contexts/SessionContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { useKeyboardAware } from '@/hooks/useKeyboardAware';
import { routes } from '@/lib/routes';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { profile, session } = useSession();
  const location = useLocation();
  const { isOpen } = useSidebar();
  const { isKeyboardVisible } = useKeyboardAware();
  const path = location.pathname;

  const isNonCreatorRole = profile?.role && !['creator', null, undefined].includes(profile.role);
  const shouldShowBottomNav =
    routes.isCreator(path) &&
    !routes.isOnboarding(path) &&
    !routes.isAdmin(path) &&
    !routes.isCA(path) &&
    !routes.isLawyer(path) &&
    !routes.isAdvisor(path) &&
    !routes.isClient(path) &&
    !routes.isDemoOverride(path) &&
    !!session &&
    !isNonCreatorRole &&
    !isKeyboardVisible;

  const isFullScreen = routes.isFullScreen(path);

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground overflow-hidden md:overflow-visible flex flex-col">
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <Navbar />

        <div className="flex flex-1 min-h-0 overflow-hidden md:overflow-visible flex-col">
          <main
            id="main"
            className={cn(
              "relative flex-1 w-full py-6 px-4 md:px-6 lg:px-8 transition-all duration-300 ease-in-out",
              isFullScreen ? "overflow-hidden p-0" : "overflow-y-auto overscroll-contain",
              isOpen && "md:ml-[280px]"
            )}
          >
            {children}
          </main>

          <div className="hidden md:block text-center py-4 text-sm text-white/30 mt-auto">
            <span>© 2026 Creator Armour</span>
          </div>
        </div>

        {shouldShowBottomNav && <CreatorBottomNav />}
      </div>
    </div>
  );
};

export default Layout;
