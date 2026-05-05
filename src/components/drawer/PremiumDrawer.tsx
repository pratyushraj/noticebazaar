

import React, { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Briefcase, Wallet, Shield, Link2, Calendar, Plus, Upload, Settings, LogOut, Bell, HelpCircle, BarChart3, ChevronRight, CalendarCheck, FileText, LayoutDashboard, Scale, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { getInitials } from "@/lib/utils/avatar";
import { cn } from "@/lib/utils";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";

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
  legalShield?: DrawerMenuItem[];
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
  const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase() : '';

  const handleProfileClick = () => {
    triggerHaptic(HapticPatterns.light);
    onProfileClick();
  };

  const y = useMotionValue(0);
  const avatarY = useTransform(y, [0, 100], [0, 20]);
  const avatarSpring = useSpring(avatarY, { damping: 20, stiffness: 300 });

  return (
    <div className="px-0 pb-2">
      <motion.button
        onClick={handleProfileClick}
        className={cn(
          "flex items-center gap-4 w-full p-4 rounded-[2rem]",
          "bg-card border border-border/50 shadow-sm",
          "hover:bg-secondary/5 active:scale-[0.98]",
          "transition-all duration-200 focus:outline-none"
        )}
        whileTap={{ scale: 0.97 }}
      >
        <motion.div style={{ y: avatarSpring }}>
          <Avatar className="h-14 w-14 ring-2 ring-emerald-500/20 dark:ring-emerald-500/40 shadow-xl">
            <AvatarImage src={userAvatar || DEFAULT_AVATAR_URL} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-sky-700 text-foreground text-lg font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-foreground text-[17px] font-black truncate tracking-tight">{displayName}</p>
          <p className="text-muted-foreground text-[12px] font-medium truncate mt-0.5 opacity-60">@{userHandle}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        </div>
      </motion.button>
    </div>
  );
}

interface DrawerSectionProps {
  title: string;
  children: React.ReactNode;
  showSeparator?: boolean;
}

function DrawerSection({ title, children, showSeparator = true }: DrawerSectionProps) {
  return (
    <div className="mt-4 first:mt-2">
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground/30 mb-3 px-1">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-2.5">
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
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex items-center w-full overflow-hidden",
        "rounded-[1.25rem] p-4 border transition-all duration-200",
        isActive
          ? "bg-gradient-to-br from-emerald-500 to-sky-500 border-emerald-400/30 text-white shadow-[0_8px_25px_rgba(16,185,129,0.25)]"
          : "bg-card border-border/40 hover:bg-secondary/10 text-muted-foreground hover:text-foreground dark:bg-card/50"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mr-4 transition-colors",
        isActive ? "bg-white/20" : "bg-secondary/50"
      )}>
        <Icon className={cn(
          "w-5 h-5",
          isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
        )} />
      </div>
      
      <div className="flex-1 text-left">
        <span className={cn(
          "text-[14px] font-bold tracking-tight block",
          isActive ? "text-white" : "text-foreground"
        )}>
          {item.label}
        </span>
        {isActive && (
          <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Active View</span>
        )}
      </div>

      {item.badge && (
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-destructive text-white ml-2"
        >
          {item.badge}
        </motion.span>
      )}
    </motion.button>
  );
}

function LogoutButton({ onClick }: { onClick: () => void }) {
  const handleClick = () => {
    triggerHaptic(HapticPatterns.medium);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      aria-label="Log out"
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full flex items-center gap-4 rounded-[1.25rem] p-4 border transition-all duration-200",
        "bg-destructive/5 border-destructive/20 text-destructive",
        "hover:bg-destructive/10 active:scale-95"
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
        <LogOut className="w-5 h-5" />
      </div>
      <span className="text-[14px] font-bold tracking-tight">Log Out</span>
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

  const userName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
    : 'User';
  const userHandle = profile?.instagram_handle || user?.email?.split('@')[0] || 'user';
  const userInitials = getInitials(profile?.first_name || null, profile?.last_name || null) || 'U';
  const userAvatar = profile?.avatar_url || generateAvatarUrl(profile?.first_name || null, profile?.last_name || null);

  const menuData: DrawerMenuData = {
    main: [],
    quickActions: [
      { id: 'upload-contract', label: 'Upload Contract', icon: Upload, path: '/contract-upload', variant: 'default' },
      { id: 'add-deal', label: 'Add New Deal', icon: Plus, path: '/contract-upload', variant: 'primary' },
      { id: 'schedule-call', label: 'Schedule Call', icon: CalendarCheck, variant: 'accent' },
    ],
    legalShield: [
      { id: 'consumer-complaints', label: 'Creator Filing', icon: Shield, path: '/lifestyle/consumer-complaints', variant: 'accent' },
      { id: 'my-complaints', label: 'My Filing History', icon: FileText, path: '/dashboard/consumer-complaints', variant: 'default' },
      { id: 'contact-lawyer', label: 'Contact Lawyer', icon: Scale, path: 'https://wa.me/916207479248', variant: 'primary' },
    ],
    settings: [
      { id: 'profile', label: 'Account', icon: Settings, path: '/creator-profile?section=account' },
      { id: 'notification-settings', label: 'Notifications', icon: Bell, path: '/creator-profile?section=notifications' },
      { id: 'help', label: 'Help & Support', icon: HelpCircle },
    ],
  };

  const getActiveItem = (item: DrawerMenuItem): boolean => {
    if (activeItem) {
      return item.id === activeItem || item.tab === activeItem;
    }

    if (item.path) {
      // For dashboard tabs, check query params
      if (item.path.includes('tab=')) {
        const targetTab = item.path.split('tab=')[1];
        const currentTab = new URLSearchParams(location.search).get('tab');
        return location.pathname === '/creator-dashboard' && currentTab === targetTab;
      }

      const [pathOnly, queryString] = item.path.split('?');
      if (location.pathname !== pathOnly && !location.pathname.startsWith(pathOnly + '/')) {
        return false;
      }
      if (!queryString) return true;
      const targetQuery = new URLSearchParams(queryString);
      const currentQuery = new URLSearchParams(location.search);
      return Array.from(targetQuery.entries()).every(([key, value]) => currentQuery.get(key) === value);
    }

    return false;
  };

  const handleItemClick = (item: DrawerMenuItem) => {
    if (item.path) {
      if (item.path.startsWith('http')) {
        window.open(item.path, '_blank');
      } else {
        if (onNavigate) {
          onNavigate(item.path);
        } else {
          navigate(item.path);
        }
      }
    }
    onClose();
  };

  const handleProfileClick = () => {
    navigate('/creator-profile?section=account');
    onClose();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    onClose();
  };

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
            className={cn(
              "fixed bottom-0 inset-x-0 h-[85dvh] max-h-[800px] z-[110]",
              "rounded-t-[2.5rem] border-t shadow-2xl",
              "overflow-y-auto overflow-x-hidden",
              "px-6 pt-2 pb-safe",
              "flex flex-col gap-0",
              "overscroll-contain",
              "[&::-webkit-scrollbar]:w-0",
              "dark:bg-background dark:border-border",
              "bg-card border-border"
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role="navigation"
            aria-label="Navigation menu"
          >
            {/* Handle Bar */}
            <div className="w-12 h-1 bg-foreground/10 dark:bg-background/20 rounded-full mx-auto my-5 flex-shrink-0" />

            {/* Logo + App Label */}
            <div className="flex items-center justify-between px-1 mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-black tracking-tight text-foreground leading-none">
                    Creator Armour
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mt-0.5">
                    Console
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center active:scale-90 transition-transform"
              >
                <div className="w-5 h-0.5 bg-foreground/40 rounded-full rotate-45 absolute" />
                <div className="w-5 h-0.5 bg-foreground/40 rounded-full -rotate-45 absolute" />
              </button>
            </div>

            {/* Header - User Profile Card */}
            <div className="relative z-10">
              <DrawerHeader
                userName={userName}
                userHandle={userHandle}
                userAvatar={userAvatar}
                userInitials={userInitials}
                onProfileClick={handleProfileClick}
              />
            </div>

            {/* Main Navigation */}
            <div className="relative z-10 mt-6 grid grid-cols-1 gap-2.5">
              {menuData.main.map((item) => (
                <DrawerItem
                  key={item.id}
                  item={item}
                  isActive={getActiveItem(item)}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>

            {/* Legal Shield */}
            {menuData.legalShield && menuData.legalShield.length > 0 && (
              <div className="relative z-10">
                <DrawerSection title="🛡 Legal Shield">
                  {menuData.legalShield.map((item) => (
                    <DrawerItem
                      key={item.id}
                      item={item}
                      isActive={getActiveItem(item)}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </DrawerSection>
              </div>
            )}

            {/* Settings */}
            <div className="relative z-10">
              <DrawerSection title="Settings & Tools">
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

            {/* Logout */}
            <div className="relative z-10 mt-8 pt-6 border-t border-border/50 pb-8">
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
  main: [],
  quickActions: [
    { id: 'upload-contract', label: 'Upload Contract', icon: Upload, path: '/contract-upload', variant: 'default' },
    { id: 'add-deal', label: 'Add New Deal', icon: Plus, path: '/contract-upload', variant: 'primary' },
    { id: 'schedule-call', label: 'Schedule Call', icon: CalendarCheck, variant: 'accent' },
  ],
  legalShield: [
    { id: 'consumer-complaints', label: 'Creator Filing', icon: Shield, path: '/lifestyle/consumer-complaints', variant: 'accent' },
    { id: 'my-complaints', label: 'Filing History', icon: FileText, path: '/dashboard/consumer-complaints', variant: 'default' },
  ],
  settings: [
    { id: 'profile', label: 'Profile Settings', icon: Settings, path: '/creator-profile' },
    { id: 'notification-settings', label: 'Notification Settings', icon: Bell, path: '/creator-profile?section=account' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/creator-dashboard?tab=analytics' },
  ],
};
