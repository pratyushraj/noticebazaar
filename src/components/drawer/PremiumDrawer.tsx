"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
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
import { spacing, iconSizes, separators, animations, spotlight, radius } from "@/lib/design-system";
import { useMotionValue, useTransform, useSpring } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DEFAULT_AVATAR_URL, generateAvatarUrl } from "@/lib/utils/avatar";

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
  lifestyleShield?: DrawerMenuItem[];
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
  onCalendarClick?: () => void;
}

function DrawerHeader({ userName, userHandle, userAvatar, userInitials, onProfileClick, onCalendarClick }: DrawerHeaderProps) {
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
      className={cn("p-3 md:p-4 pb-2 md:pb-4 relative")}
      onScroll={(e) => {
        const target = e.currentTarget;
        y.set(target.scrollTop);
      }}
    >
      {/* Enhanced spotlight gradient */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-16 md:h-24",
        "bg-gradient-to-b from-white/25 via-white/15 to-transparent",
        "pointer-events-none"
      )} />
      
      {/* Profile Section - More compact on mobile */}
      <motion.button
        onClick={handleProfileClick}
        className={cn(
          "rounded-2xl",
          "bg-white/5",
          "backdrop-blur-xl",
          "p-4",
          "flex items-center gap-4",
          "border border-white/10",
          "shadow-[0_4px_20px_-2px_rgba(0,0,0,0.35)]",
          "w-full mb-2 md:mb-4 relative",
          "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 focus-visible:outline-offset-2",
          animations.cardPress
        )}
        aria-label={`View profile for ${userName}`}
        whileTap={animations.microTap}
      >
        <motion.div
          style={{ y: avatarSpring, scale: avatarScale }}
        >
          <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-white/10 shadow-[0_0_20px_rgba(160,107,255,0.45)]">
            <AvatarImage 
              src={userAvatar || DEFAULT_AVATAR_URL} 
              alt={`${userName}'s avatar`} 
            />
            <AvatarFallback className="bg-gradient-to-br from-[#A06BFF] to-[#7E36FF] text-white text-xs md:text-sm font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-white text-[15px] md:text-[17px] font-semibold truncate">
            {userName}
          </p>
          <p className="text-white/40 text-xs md:text-sm truncate">
            @{userHandle}
          </p>
        </div>
        <ChevronRight className={cn(iconSizes.xs, "md:w-4 md:h-4 flex-shrink-0 text-white/70")} />
      </motion.button>
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
    <div className="mt-3 md:mt-5 first:mt-0">
      {showSeparator && <div className={cn(separators.section, "my-3 md:my-6")} />}
      <p className="text-[10px] md:text-[11px] tracking-wide uppercase text-white/40 mb-1.5 md:mb-2 ml-1.5 md:ml-2">
        {title}
      </p>
      <div className="space-y-1.5 md:space-y-2">
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
        "group relative flex items-center w-full overflow-hidden transition-all duration-150",
        radius.lg,
        spacing.cardPadding.tertiary,
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 focus-visible:outline-offset-2",
        isActive
          ? cn(
              "bg-gradient-to-r from-[#A06BFF]/80 to-[#7E36FF]/80",
              "text-white",
              "shadow-[0_0_25px_rgba(160,107,255,0.35)]"
            )
          : cn(
              "bg-gradient-to-r from-[#5516CC]/40 to-[#7E36FF]/30",
              "hover:from-[#7E36FF]/40 hover:to-[#A06BFF]/40",
              "border border-white/10",
              "text-white/90",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/15 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-all before:duration-300"
            )
      )}
    >
      {/* Spotlight gradient for active items */}
      {isActive && <div className={cn(spotlight.top, "opacity-30")} />}
      <Icon className={cn(iconSizes.sm, "md:w-5 md:h-5 flex-shrink-0 mr-2 md:mr-3 relative z-10 text-white/80 group-hover:text-white")} />
      <span className={cn("text-sm md:text-base text-white/90 flex-1 text-left relative z-10")}>{item.label}</span>
      
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
        "w-full",
        "rounded-2xl",
        "bg-white/5",
        "backdrop-blur-xl",
        "px-4 py-4",
        "flex items-center justify-between",
        "text-white/90",
        "border border-white/10",
        "shadow-[0_3px_16px_-3px_rgba(0,0,0,0.35)]",
        "active:scale-[0.97] transition-all",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 focus-visible:outline-offset-2"
      )}
    >
      <Icon className={cn(iconSizes.sm, "md:w-5 md:h-5 flex-shrink-0 mr-2 md:mr-3 relative z-10 text-white/80")} />
      <span className={cn("text-sm md:text-base flex-1 text-left relative z-10")}>{item.label}</span>
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
        "flex items-center gap-2 md:gap-3",
        radius.lg,
        "p-2.5 md:p-3",
        "bg-gradient-to-br from-[#5516CC]/40 to-[#2E0B66]/40",
        "hover:from-[#5516CC]/60 hover:to-[#2E0B66]/60",
        "text-red-300",
        "border border-red-400/20",
        "hover:shadow-[0_0_20px_rgba(160,107,255,0.35)]",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500/30 focus-visible:outline-offset-2"
      )}
    >
      <LogOut className={cn(iconSizes.sm, "md:w-5 md:h-5 relative z-10")} />
      <span className={cn("text-sm md:text-base flex-1 text-left relative z-10")}>Log Out</span>
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
  const userAvatar = profile?.avatar_url || generateAvatarUrl(profile?.first_name || null, profile?.last_name || null);

  // Menu data structure
  const menuData: DrawerMenuData = {
    main: [
      { id: 'deals', label: 'Brand Deals', icon: Briefcase, tab: 'deals' },
      { id: 'payments', label: 'Payments', icon: Wallet, tab: 'payments' },
      { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/messages', badge: counts.messages },
      { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
    ],
    quickActions: [
      { id: 'upload-contract', label: 'Upload Contract', icon: Upload, path: '/contract-upload', variant: 'default' },
      { id: 'add-deal', label: 'Add New Deal', icon: Plus, path: '/contract-upload', variant: 'primary' },
      { id: 'schedule-call', label: 'Schedule Call', icon: CalendarCheck, variant: 'accent' },
    ],
    lifestyleShield: [
      { id: 'consumer-complaints', label: 'Consumer Complaints', icon: Shield, path: '/lifestyle/consumer-complaints', variant: 'accent' },
    ],
    settings: [
      { id: 'profile', label: 'Profile Settings', icon: Settings, path: '/creator-profile' },
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

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
              "fixed top-0 left-0 h-full",
              "w-[75vw] max-w-[320px]",
              "bg-[radial-gradient(ellipse_at_top,_rgba(130,60,255,0.25),_rgba(60,0,130,0.35))]",
              "backdrop-blur-2xl",
              "rounded-r-3xl shadow-2xl shadow-black/40",
              "border-r border-white/10",
              "overflow-y-auto",
              "px-6 py-6",
              "premium-drawer drawer-container",
              // Hide scrollbar but keep scrolling
              "[&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0",
              "overscroll-contain"
            )}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            role="navigation"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <DrawerHeader
              userName={userName}
              userHandle={userHandle}
              userAvatar={userAvatar}
              userInitials={userInitials}
              onProfileClick={handleProfileClick}
              onCalendarClick={() => {
                navigate('/calendar');
                onClose();
              }}
            />

            {/* Scrollable Content - Hidden scrollbar */}
            <div 
              className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-6",
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
              {/* LIFESTYLE SHIELD */}
              {menuData.lifestyleShield && menuData.lifestyleShield.length > 0 && (
                <DrawerSection title="🛡 LIFESTYLE SHIELD">
                  {menuData.lifestyleShield.map((item) => (
                    <DrawerItem
                      key={item.id}
                      item={item}
                      isActive={getActiveItem(item)}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </DrawerSection>
              )}

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
                {/* Log Out button */}
                <div className={cn(
                  "pt-2 md:pt-4 border-t border-white/10 mt-2",
                  "pb-[max(calc(env(safe-area-inset-bottom,0px)+12px),12px)]"
                )}>
                  <LogoutButton onClick={handleLogout} />
                </div>
              </DrawerSection>
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
    { id: 'deals', label: 'Brand Deals', icon: Briefcase, tab: 'deals' },
    { id: 'payments', label: 'Payments', icon: Wallet, tab: 'payments' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/messages' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  ],
  quickActions: [
    { id: 'upload-contract', label: 'Upload Contract', icon: Upload, path: '/contract-upload', variant: 'default' },
    { id: 'add-deal', label: 'Add New Deal', icon: Plus, path: '/contract-upload', variant: 'primary' },
    { id: 'schedule-call', label: 'Schedule Call', icon: CalendarCheck, variant: 'accent' },
  ],
  lifestyleShield: [
    { id: 'consumer-complaints', label: 'Consumer Complaints', icon: Shield, path: '/lifestyle/consumer-complaints', variant: 'accent' },
  ],
  settings: [
    { id: 'profile', label: 'Profile Settings', icon: Settings, path: '/creator-profile' },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/creator-analytics' },
  ],
};
