/**
 * CreatorNavigationWrapper Component
 * 
 * Unified navigation wrapper for all creator pages
 * Ensures consistent PremiumDrawer integration, headers, and bottom nav
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import PremiumDrawer from '@/components/drawer/PremiumDrawer';
import CreatorBottomNav from '@/components/creator-dashboard/CreatorBottomNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { gradients, spacing, zIndex } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { useSignOut } from '@/lib/hooks/useAuth';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogOut, Loader2 } from 'lucide-react';

interface CreatorNavigationWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
  hideBottomNav?: boolean;
  className?: string;
  compactHeader?: boolean; // ~30% less header height on mobile
}

export const CreatorNavigationWrapper: React.FC<CreatorNavigationWrapperProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  rightActions,
  hideBottomNav = false,
  className,
  compactHeader = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const signOutMutation = useSignOut();

  // Determine active tab from location
  React.useEffect(() => {
    if (location.pathname === '/creator-dashboard') {
      const tab = new URLSearchParams(location.search).get('tab') || 'home';
      setActiveTab(tab);
    } else if (location.pathname.startsWith('/creator-contracts')) {
      setActiveTab('deals');
    } else if (location.pathname.startsWith('/creator-payments')) {
      setActiveTab('payments');
    }
    // Protection tab removed - protection features are now integrated into Deals
  }, [location]);

  // Auto-detect title from location if not provided
  const pageTitle = title || (() => {
    if (location.pathname === '/creator-dashboard') return 'Dashboard';
    if (location.pathname.startsWith('/creator-contracts')) return 'Brand Deals';
    if (location.pathname.startsWith('/creator-payments')) return 'Payments';
    return 'NoticeBazaar';
  })();

  const isCreator = profile?.role === 'creator';
  const isOnboarding = location.pathname === '/creator-onboarding';
  const shouldShowBottomNav = isCreator && !isOnboarding && !hideBottomNav;

  return (
    <div className={cn("nb-screen-height", gradients.page, "text-white overflow-x-hidden", className)}>
      {/* Page Header */}
      {title !== undefined && (
        <PageHeader
          title={pageTitle}
          subtitle={subtitle}
          showBackButton={showBackButton}
          showMenuButton={!showBackButton}
          onMenuClick={() => setShowMenu(true)}
          rightActions={rightActions}
          premium={location.pathname.startsWith('/creator-contracts')}
          compact={compactHeader}
        />
      )}

      {/* Premium Drawer */}
      <PremiumDrawer
        open={showMenu}
        onClose={() => {
          setShowMenu(false);
          triggerHaptic(HapticPatterns.light);
        }}
        onNavigate={(path) => {
          navigate(path);
          triggerHaptic(HapticPatterns.light);
        }}
        onSetActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'home') {
            navigate('/creator-dashboard');
          } else {
            const tabRoutes: Record<string, string> = {
              deals: '/creator-contracts',
              payments: '/creator-payments',
            };
            navigate(tabRoutes[tab] || '/creator-dashboard');
          }
        }}
        onLogout={() => {
          triggerHaptic(HapticPatterns.medium);
          setShowLogoutDialog(true);
        }}
        activeItem={activeTab}
        counts={{ messages: 3 }} // TODO: Get real count
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-400" />
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
              }}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 focus:ring-2 focus:ring-purple-400/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  triggerHaptic(HapticPatterns.medium);
                  
                  // Analytics tracking
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'logout', {
                      event_category: 'engagement',
                      event_label: 'user_logout',
                      method: 'navigation_wrapper'
                    });
                  }
                  
                  await signOutMutation.mutateAsync();
                  setShowMenu(false);
                  setShowLogoutDialog(false);
                } catch (error: any) {
                  console.error('Logout failed', error);
                }
              }}
              disabled={signOutMutation.isPending}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 focus:ring-2 focus:ring-red-400/50 disabled:opacity-50"
            >
              {signOutMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      <main
        className={cn(
          "relative z-10",
          spacing.page,
          "pb-24",
          shouldShowBottomNav && "pb-24"
        )}
        style={{
          paddingBottom: shouldShowBottomNav 
            ? `calc(96px + env(safe-area-inset-bottom, 0px))`
            : `calc(24px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {shouldShowBottomNav && <CreatorBottomNav />}
    </div>
  );
};

