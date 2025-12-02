"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Briefcase, 
  Wallet, 
  Shield, 
  MessageCircle, 
  Calendar, 
  Plus, 
  Upload, 
  Settings, 
  LogOut, 
  Bell,
  HelpCircle,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Search,
  CalendarCheck
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { getInitials } from "@/lib/utils/avatar";
import { cn } from "@/lib/utils";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";
import { spacing, typography, iconSizes, separators, glass, animations, shadows, spotlight, radius } from "@/lib/design-system";
import { useMotionValue, useTransform, useSpring } from "framer-motion";
import { AppsGridMenu } from "@/components/navigation/AppsGridMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEFAULT_AVATAR_URL } from "@/lib/utils/avatar";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DrawerMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  tab?: string;
  badge?: number;
  variant?: 'default' | 'primary' | 'accent' | 'danger';
}

export interface DrawerMenuData {
  main: DrawerMenuItem[];
  quickActions: DrawerMenuItem[];
  settings: DrawerMenuItem[];
}

interface PremiumDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
  onSetActiveTab?: (tab: string) => void;
  onLogout?: () => void;
  activeItem?: string;
  counts?: {
    messages?: number;
  };
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface DrawerHeaderProps {
  userName: string;
  userHandle: string;
  userAvatar?: string | null;
  userInitials: string;
  onProfileClick: () => void;
}

function DrawerHeader({ userName, userHandle, userAvatar, userInitials, onProfileClick }: DrawerHeaderProps) {
  const handleProfileClick = () => {
    triggerHaptic(HapticPatterns.light);
    onProfileClick();
  };

  // Parallax motion for avatar
  const y = useMotionValue(0);
  const avatarY = useTransform(y, [0, 100], [0, 20]);
  const avatarScale = useTransform(y, [0, 100], [1, 0.95]);
  const avatarSpring = useSpring(avatarY, { damping: 20, stiffness: 300 });

  return (
    <motion.div 
      className={cn(spacing.cardPadding.tertiary, "pb-4 relative")}
      onScroll={(e) => {
        const target = e.currentTarget;
        y.set(target.scrollTop);
      }}
    >
      {/* Spotlight gradient */}
      <div className={cn(spotlight.top, "opacity-60")} />
      
      {/* Profile Section */}
      <motion.button
        onClick={handleProfileClick}
        className={cn(
          "flex items-center gap-3 w-full mb-4 relative",
          "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 focus-visible:outline-offset-2",
          radius.md,
          spacing.cardPadding.tertiary,
          animations.cardPress
        )}
        aria-label={`View profile for ${userName}`}
        whileTap={animations.microTap}
      >
        <motion.div
          style={{ y: avatarSpring, scale: avatarScale }}
        >
          <Avatar className="h-12 w-12 ring-2 ring-white/10 shadow-[0_0_20px_rgba(110,231,255,0.3)]">
            <AvatarImage 
              src={userAvatar || DEFAULT_AVATAR_URL} 
              alt={`${userName}'s avatar`} 
            />
            <AvatarFallback className="bg-gradient-to-br from-[#6EE7FF] to-[#8B5CF6] text-white text-sm font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div className="flex-1 text-left min-w-0">
          <p className={cn(typography.h4, "truncate")}>
            {userName}
          </p>
          <p className={cn(typography.bodySmall, "truncate")}>
            @{userHandle}
          </p>
        </div>
        <ChevronRight className={cn(iconSizes.sm, "flex-shrink-0 text-white/70")} />
      </motion.button>

      {/* Icon Buttons Row with AppsGridMenu */}
      <div className="flex items-center gap-2">
        <AppsGridMenu
          trigger={
            <button
              className={cn(
                "w-10 h-10 rounded-xl",
                glass.base,
                "flex items-center justify-center transition-all",
                animations.cardHover,
                animations.cardPress
              )}
              aria-label="Open apps menu"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none"
                className="text-white/70"
              >
                <circle cx="4" cy="4" r="2.2" fill="currentColor"/>
                <circle cx="12" cy="4" r="2.2" fill="currentColor"/>
                <circle cx="20" cy="4" r="2.2" fill="currentColor"/>
                <circle cx="4" cy="12" r="2.2" fill="currentColor"/>
                <circle cx="12" cy="12" r="2.2" fill="currentColor"/>
                <circle cx="20" cy="12" r="2.2" fill="currentColor"/>
                <circle cx="4" cy="20" r="2.2" fill="currentColor"/>
                <circle cx="12" cy="20" r="2.2" fill="currentColor"/>
                <circle cx="20" cy="20" r="2.2" fill="currentColor"/>
              </svg>
            </button>
          }
        />
        <button
          className={cn(
            "w-10 h-10 rounded-xl",
            glass.base,
            "flex items-center justify-center transition-all",
            animations.cardHover,
            animations.cardPress
          )}
          aria-label="Refresh"
          onClick={() => triggerHaptic(HapticPatterns.light)}
        >
          <RefreshCw className={cn(iconSizes.md, "text-white/70")} />
        </button>
        <button
          className={cn(
            "w-10 h-10 rounded-xl",
            glass.base,
            "flex items-center justify-center transition-all",
            animations.cardHover,
            animations.cardPress
          )}
          aria-label="Calendar"
          onClick={() => triggerHaptic(HapticPatterns.light)}
        >
          <Calendar className={cn(iconSizes.md, "text-white/70")} />
        </button>
        <button
          className={cn(
            "w-10 h-10 rounded-xl relative",
            glass.base,
            "flex items-center justify-center transition-all",
            animations.cardHover,
            animations.cardPress
          )}
          aria-label="Notifications"
          onClick={() => triggerHaptic(HapticPatterns.light)}
        >
          <Bell className={cn(iconSizes.md, "text-white/70")} />
        </button>
        <button
          className={cn(
            "w-10 h-10 rounded-xl",
            glass.base,
            "flex items-center justify-center transition-all",
            animations.cardHover,
            animations.cardPress
          )}
          aria-label="Search"
          onClick={() => triggerHaptic(HapticPatterns.light)}
        >
          <Search className={cn(iconSizes.md, "text-white/70")} />
        </button>
      </div>
    </motion.div>
  );
}

interface DrawerSectionProps {
  title: string;
  children: React.ReactNode;
  showSeparator?: boolean;
}

function DrawerSection({ title, children, showSeparator = true }: DrawerSectionProps) {
  return (
    <div className="mt-5 first:mt-0">
      {showSeparator && <div className={separators.section} />}
      <p className={cn(typography.label, "mb-3 px-1")}>
        {title}
      </p>
      <div className={spacing.compact}>
        {children}
      </div>
    </div>
  );
}

interface DrawerItemProps {
  item: DrawerMenuItem;
  isActive: boolean;
  onClick: () => void;
}

function DrawerItem({ item, isActive, onClick }: DrawerItemProps) {
  const Icon = item.icon;

  const handleClick = () => {
    triggerHaptic(HapticPatterns.light);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      whileTap={animations.microTap}
      whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
      className={cn(
        "relative flex items-center w-full overflow-hidden transition-all duration-150",
        radius.lg,
        spacing.cardPadding.tertiary,
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 focus-visible:outline-offset-2",
        isActive
          ? "bg-gradient-to-r from-[#6EE7FF] to-[#8B5CF6] text-white shadow-lg"
          : cn(
              glass.apple,
              "text-white/90 hover:bg-white/8"
            )
      )}
    >
      {/* Spotlight gradient for active items */}
      {isActive && <div className={cn(spotlight.top, "opacity-30")} />}
      <Icon className={cn(iconSizes.md, "flex-shrink-0 mr-3 relative z-10")} />
      <span className={cn(typography.body, "flex-1 text-left relative z-10")}>{item.label}</span>
      
      {item.badge && (
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className={cn(
            "w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full bg-red-500 text-white ml-2 relative z-10",
            radius.full
          )}
        >
          {item.badge}
        </motion.span>
      )}
    </motion.button>
  );
}

interface QuickActionButtonProps {
  item: DrawerMenuItem;
  onClick: () => void;
}

function QuickActionButton({ item, onClick }: QuickActionButtonProps) {
  const Icon = item.icon;
  const isPrimary = item.variant === 'primary';
  const isAccent = item.variant === 'accent';

  const handleClick = () => {
    triggerHaptic(HapticPatterns.medium);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      aria-label={item.label}
      whileTap={animations.microTap}
      whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
      className={cn(
        "relative flex items-center w-full overflow-hidden transition-all duration-150",
        radius.lg,
        spacing.cardPadding.tertiary,
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 focus-visible:outline-offset-2",
        isPrimary
          ? "bg-gradient-to-r from-[#6EE7FF] to-[#8B5CF6] text-white shadow-lg"
          : isAccent
          ? "bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] hover:bg-[rgba(16,185,129,0.2)]"
          : cn(
              glass.apple,
              "text-white/90 hover:bg-white/8"
            )
      )}
    >
      {/* Spotlight gradient for primary actions */}
      {isPrimary && <div className={cn(spotlight.top, "opacity-30")} />}
      <Icon className={cn(iconSizes.md, "flex-shrink-0 mr-3 relative z-10")} />
      <span className={cn(typography.body, "flex-1 text-left relative z-10")}>{item.label}</span>
    </motion.button>
  );
}

interface LogoutButtonProps {
  onClick: () => void;
}

function LogoutButton({ onClick }: LogoutButtonProps) {
  const handleClick = () => {
    triggerHaptic(HapticPatterns.medium);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      aria-label="Log out"
      whileTap={animations.microTap}
      whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
      className={cn(
        "w-full overflow-hidden transition-all duration-150",
        "flex items-center gap-3",
        radius.lg,
        spacing.cardPadding.tertiary,
        "bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.25)]",
        "text-[#ff6b6b] hover:bg-[rgba(255,0,0,0.15)]",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500/30 focus-visible:outline-offset-2"
      )}
    >
      <LogOut className={cn(iconSizes.md, "relative z-10")} />
      <span className={cn(typography.body, "flex-1 text-left relative z-10")}>Log Out</span>
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PremiumDrawer({
  open,
  onClose,
  onNavigate,
  onSetActiveTab,
  onLogout,
  activeItem,
  counts = {},
}: PremiumDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useSession();

  // Get user display info
  const userName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
    : 'User';
  const userHandle = profile?.instagram_handle || user?.email?.split('@')[0] || 'user';
  const userInitials = getInitials(profile?.first_name || null, profile?.last_name || null) || 'U';
  const userAvatar = profile?.avatar_url;

  // Menu data structure
  const menuData: DrawerMenuData = {
    main: [
      { id: 'home', label: 'Home', icon: Home, tab: 'home' },
      { id: 'deals', label: 'Brand Deals', icon: Briefcase, tab: 'deals' },
      { id: 'payments', label: 'Payments', icon: Wallet, tab: 'payments' },
      { id: 'protection', label: 'Content Protection', icon: Shield, tab: 'protection' },
      { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/messages', badge: counts.messages },
      { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
    ],
    quickActions: [
      { id: 'upload-contract', label: 'Upload Contract', icon: Upload, path: '/contract-upload', variant: 'default' },
      { id: 'add-deal', label: 'Add New Deal', icon: Plus, path: '/contract-upload', variant: 'primary' },
      { id: 'schedule-call', label: 'Schedule Call', icon: CalendarCheck, variant: 'accent' },
    ],
    settings: [
      { id: 'profile', label: 'Profile Settings', icon: Settings, path: '/creator-profile' },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'help', label: 'Help & Support', icon: HelpCircle },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/creator-analytics' },
    ],
  };

  // Determine active item
  const getActiveItem = (item: DrawerMenuItem): boolean => {
    if (activeItem) {
      return item.id === activeItem || item.tab === activeItem;
    }

    // Fallback to location-based detection
    if (item.path) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    }

    if (item.tab) {
      // Check if we're on dashboard with matching tab
      if (location.pathname === '/creator-dashboard') {
        const tabParam = new URLSearchParams(location.search).get('tab');
        return tabParam === item.tab;
      }
      // Check tab-based routes
      const tabRoutes: Record<string, string> = {
        home: '/creator-dashboard',
        deals: '/creator-contracts',
        payments: '/creator-payments',
        protection: '/creator-content-protection',
      };
      return location.pathname === tabRoutes[item.tab] || location.pathname.startsWith(tabRoutes[item.tab] + '/');
    }

    return false;
  };

  const handleItemClick = (item: DrawerMenuItem) => {
    if (item.path) {
      if (onNavigate) {
        onNavigate(item.path);
      } else {
        navigate(item.path);
      }
    } else if (item.tab) {
      if (onSetActiveTab) {
        onSetActiveTab(item.tab);
      } else if (item.tab === 'home') {
        navigate('/creator-dashboard');
      } else {
        const tabRoutes: Record<string, string> = {
          deals: '/creator-contracts',
          payments: '/creator-payments',
          protection: '/creator-content-protection',
        };
        navigate(tabRoutes[item.tab] || '/creator-dashboard');
      }
    }
    onClose();
  };

  const handleProfileClick = () => {
    navigate('/creator-profile');
    onClose();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop - covers bottom nav too */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={animations.spring}
            className={cn(
              "absolute left-0 top-0 h-full relative",
              "w-[78%] max-w-[320px] md:w-[300px]",
              radius.xl,
              glass.appleStrong,
              shadows.depth,
              spacing.cardPadding.secondary,
              "flex flex-col",
              "text-white",
              // Hide scrollbar but keep scrolling
              "[&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0",
              "overscroll-contain",
              // Inner border for depth
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            )}
            style={{
              background: 'linear-gradient(180deg, rgba(75, 12, 255, 0.95) 0%, rgba(45, 0, 79, 0.95) 100%)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            role="navigation"
            aria-label="Navigation menu"
          >
            {/* Spotlight gradient at top */}
            <div className={cn(spotlight.top, "opacity-40")} />
            {/* Header */}
            <DrawerHeader
              userName={userName}
              userHandle={userHandle}
              userAvatar={userAvatar}
              userInitials={userInitials}
              onProfileClick={handleProfileClick}
            />

            {/* Scrollable Content - Hidden scrollbar */}
            <div 
              className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden min-h-0",
                "-mx-5 px-5",
                // Hide scrollbar
                "[&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0",
                // Smooth overscroll
                "overscroll-contain",
                "overscroll-y-contain"
              )}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* Main Section */}
              <DrawerSection title="MAIN" showSeparator={false}>
                {menuData.main.map((item) => (
                  <DrawerItem
                    key={item.id}
                    item={item}
                    isActive={getActiveItem(item)}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </DrawerSection>

              {/* Quick Actions */}
              <DrawerSection title="QUICK ACTIONS">
                {menuData.quickActions.map((item) => (
                  <QuickActionButton
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </DrawerSection>

              {/* Settings */}
              <DrawerSection title="SETTINGS">
                {menuData.settings.map((item) => (
                  <DrawerItem
                    key={item.id}
                    item={item}
                    isActive={getActiveItem(item)}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </DrawerSection>
            </div>

            {/* Footer - Logout */}
            <div className={cn("mt-auto pt-4 border-t border-white/10")}>
              <LogoutButton onClick={handleLogout} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// EXPORT MENU DATA STRUCTURE FOR DYNAMIC RENDERING
// ============================================================================

export const DEFAULT_MENU_DATA: DrawerMenuData = {
  main: [
    { id: 'home', label: 'Home', icon: Home, tab: 'home' },
    { id: 'deals', label: 'Brand Deals', icon: Briefcase, tab: 'deals' },
    { id: 'payments', label: 'Payments', icon: Wallet, tab: 'payments' },
    { id: 'protection', label: 'Content Protection', icon: Shield, tab: 'protection' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/messages' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  ],
  quickActions: [
    { id: 'upload-contract', label: 'Upload Contract', icon: Upload, path: '/contract-upload', variant: 'default' },
    { id: 'add-deal', label: 'Add New Deal', icon: Plus, path: '/contract-upload', variant: 'primary' },
    { id: 'schedule-call', label: 'Schedule Call', icon: CalendarCheck, variant: 'accent' },
  ],
  settings: [
    { id: 'profile', label: 'Profile Settings', icon: Settings, path: '/creator-profile' },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/creator-analytics' },
  ],
};
