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

interface CreatorNavigationWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
  hideBottomNav?: boolean;
  className?: string;
}

export const CreatorNavigationWrapper: React.FC<CreatorNavigationWrapperProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  rightActions,
  hideBottomNav = false,
  className,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Determine active tab from location
  React.useEffect(() => {
    if (location.pathname === '/creator-dashboard') {
      const tab = new URLSearchParams(location.search).get('tab') || 'home';
      setActiveTab(tab);
    } else if (location.pathname.startsWith('/creator-contracts')) {
      setActiveTab('deals');
    } else if (location.pathname.startsWith('/creator-payments')) {
      setActiveTab('payments');
    } else if (location.pathname.startsWith('/creator-content-protection')) {
      setActiveTab('protection');
    }
  }, [location]);

  // Auto-detect title from location if not provided
  const pageTitle = title || (() => {
    if (location.pathname === '/creator-dashboard') return 'Dashboard';
    if (location.pathname.startsWith('/creator-contracts')) return 'Brand Deals';
    if (location.pathname.startsWith('/creator-payments')) return 'Payments';
    if (location.pathname.startsWith('/creator-content-protection')) return 'Content Protection';
    return 'NoticeBazaar';
  })();

  const isCreator = profile?.role === 'creator';
  const isOnboarding = location.pathname === '/creator-onboarding';
  const shouldShowBottomNav = isCreator && !isOnboarding && !hideBottomNav;

  return (
    <div className={cn("min-h-screen", gradients.page, "text-white overflow-x-hidden", className)}>
      {/* Page Header */}
      {title !== undefined && (
        <PageHeader
          title={pageTitle}
          subtitle={subtitle}
          showBackButton={showBackButton}
          showMenuButton={!showBackButton}
          onMenuClick={() => setShowMenu(true)}
          rightActions={rightActions}
        />
      )}

      {/* Premium Drawer */}
      <PremiumDrawer
        open={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={(path) => {
          navigate(path);
        }}
        onSetActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'home') {
            navigate('/creator-dashboard');
          } else {
            const tabRoutes: Record<string, string> = {
              deals: '/creator-contracts',
              payments: '/creator-payments',
              protection: '/creator-content-protection',
            };
            navigate(tabRoutes[tab] || '/creator-dashboard');
          }
        }}
        activeItem={activeTab}
        counts={{ messages: 3 }} // TODO: Get real count
      />

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

