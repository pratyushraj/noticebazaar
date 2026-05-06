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
import { gradients, spacing } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { useSignOut } from '@/lib/hooks/useAuth';
import { useNotifications } from '@/lib/hooks/useNotifications';
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
import { LogOut, Loader2, Menu, ArrowLeft, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatorNavigationWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string; // When set, back button navigates here instead of history back
  backIconOnly?: boolean; // Show only arrow in header
  rightActions?: React.ReactNode;
  hideBottomNav?: boolean;
  className?: string;
  compactHeader?: boolean; // ~30% less header height on mobile
  /** Payments/Deals style: minimal header (menu only), title in page content */
  hidePageTitle?: boolean;
}

export const CreatorNavigationWrapper: React.FC<CreatorNavigationWrapperProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  backTo,
  backIconOnly = false,
  rightActions,
  hideBottomNav = false,
  className,
  compactHeader = false,
  hidePageTitle = false,
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
    return 'Creator Armour';
  })();

  const isCreator = profile?.role === 'creator';
  const isOnboarding = location.pathname === '/creator-onboarding';
  const shouldShowBottomNav = isCreator && !isOnboarding && !hideBottomNav;
  const { unreadCount } = useNotifications();

  return (
    <div className={cn("nb-screen-height", gradients.page, "text-foreground overflow-x-hidden", className)}>
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
        counts={{ messages: unreadCount }} 
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-[#1E263A] via-[#182133] to-[#121722] backdrop-blur-xl border border-border text-foreground shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl flex items-center gap-2">
              <LogOut className="w-5 h-5 text-destructive" />
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/60">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
              }}
              className="bg-card text-foreground border-border hover:bg-secondary/50 focus:ring-2 focus:ring-blue-400/50"
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
              className="bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/40 focus:ring-2 focus:ring-red-400/50 disabled:opacity-50"
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

      {/* Unified Header */}
      {!hidePageTitle && (
        <header 
          className={cn(
            "sticky top-0 z-40 w-full backdrop-blur-md transition-all duration-300 border-b border-white/5",
            compactHeader ? "py-2" : "py-4",
            "bg-background/80"
          )}
          style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
        >
          <div className="px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {showBackButton ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    if (backTo) navigate(backTo);
                    else navigate(-1);
                  }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setShowMenu(true);
                  }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </motion.button>
              )}
              
              {!backIconOnly && (
                <div className="flex flex-col min-w-0">
                  <h1 className="text-lg font-black tracking-tight truncate">
                    {pageTitle}
                  </h1>
                  {subtitle && (
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {rightActions}
              {!showBackButton && (
                <div className="relative">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-[1px]">
                    <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black">{profile?.full_name?.charAt(0) || 'C'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "relative z-10",
          spacing.page,
        )}
        style={{
          paddingBottom: shouldShowBottomNav
            ? `calc(6rem + env(safe-area-inset-bottom, 16px))`
            : `calc(1.5rem + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {shouldShowBottomNav && <CreatorBottomNav />}
    </div>
  );
};

