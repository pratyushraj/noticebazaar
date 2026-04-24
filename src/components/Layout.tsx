

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
    <div className="relative min-h-[100dvh] bg-background text-foreground overflow-x-hidden flex flex-col">
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <Navbar />

        <div className="flex flex-1 min-h-0 overflow-x-hidden flex-col">
          <main
            id="main"
            className={cn(
              "relative flex-1 w-full transition-all duration-300",
              // Mobile: generous horizontal padding, bottom safe area for nav
              "px-4 pb-24 pt-4",
              // Tablet
              "md:px-6 md:pb-8 md:pt-6",
              // Desktop: sidebar offset when open
              "lg:px-8 lg:py-6",
              isFullScreen ? "overflow-hidden p-0" : "overflow-y-auto overscroll-contain",
              isOpen && "md:ml-[320px]"
            )}
          >
            {children}
          </main>

          <div className="hidden md:block text-center py-4 text-xs text-muted-foreground">
            © 2026 Creator Armour
          </div>
        </div>

        {shouldShowBottomNav && <CreatorBottomNav />}
      </div>
    </div>
  );
};

export default Layout;
