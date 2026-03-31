"use client";

import React, { createContext, useContext, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Briefcase, Wallet, Shield, Link2, Calendar, Plus, Upload, Settings, LogOut, Bell, HelpCircle, BarChart3, ChevronRight, CalendarCheck, FileText } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { getInitials } from "@/lib/utils/avatar";
import { cn } from "@/lib/utils";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";
import { animations, spotlight, radius, iconSizes, spacing, separators, gradients, shadows, typography, getCardClasses } from "@/lib/design-system";
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
    <div className="px-1 pb-1">
      <motion.button
        onClick={handleProfileClick}
        className={cn(
          "flex items-center gap-3 w-full p-3 rounded-2xl",
          "bg-slate-100 border border-slate-200 dark:bg-white/5 dark:border-white/10",
          "hover:bg-slate-200 dark:hover:bg-white/[0.08] active:scale-[0.98]",
          "transition-all duration-150 focus:outline-none"
        )}
        whileTap={{ scale: 0.97 }}
      >
        <motion.div style={{ y: avatarSpring }}>
          <Avatar className="h-11 w-11 ring-2 ring-slate-200 dark:ring-white/10 shadow-lg">
            <AvatarImage src={userAvatar || DEFAULT_AVATAR_URL} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-sm font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-slate-900 dark:text-white text-[15px] font-bold truncate leading-tight">{displayName}</p>
          <p className="text-slate-500 dark:text-white/40 text-[11px] font-medium truncate mt-0.5">@{userHandle}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-white/30 flex-shrink-0" />
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
    <div className="mt-1">
      {showSeparator && <div className="h-[1px] w-full bg-slate-200 dark:bg-white/5 my-4" />}
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30 mb-2 px-1">
        {title}
      </p>
      <div className="space-y-1.5">
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
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex items-center w-full overflow-hidden",
        "rounded-2xl px-4 py-3",
        "transition-all duration-150 focus:outline-none",
        isActive
          ? "bg-blue-600 shadow-lg shadow-blue-600/25 text-white"
          : "bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-white/5 dark:border-white/[0.06] dark:hover:bg-white/[0.09] dark:text-white/75 dark:hover:text-white"
      )}
    >
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl" />
      )}
      <Icon className={cn(
        "w-4 h-4 flex-shrink-0 mr-3 relative z-10 transition-colors",
        isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700 dark:text-white/50 dark:group-hover:text-white/80"
      )} />
      <span className={cn(
        "text-[13px] font-semibold flex-1 text-left relative z-10 tracking-tight",
        isActive ? "text-white" : "text-slate-800 dark:text-white/80"
      )}>
        {item.label}
      </span>

      {item.badge && (
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white ml-2 relative z-10"
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
      whileTap={{ scale: 0.97 }}
      className={cn(
        "w-full flex items-center gap-3 rounded-2xl px-4 py-3",
        "bg-red-50 border border-red-200 dark:bg-red-500/8 dark:border-red-400/15",
        "hover:bg-red-100 dark:hover:bg-red-500/15 hover:border-red-300 dark:hover:border-red-400/25",
        "text-red-600 dark:text-red-400 transition-all duration-150 focus:outline-none"
      )}
    >
      <LogOut className="w-4 h-4 relative z-10 flex-shrink-0" />
      <span className="text-[13px] font-semibold flex-1 text-left relative z-10">Log Out</span>
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
    main: [
      { id: 'deals', label: 'Collabs', icon: Briefcase, path: '/creator-dashboard?tab=deals' },
      { id: 'payments', label: 'Payments', icon: Wallet, path: '/creator-dashboard?tab=payments' },
      { id: 'collab', label: 'Collab Link', icon: Link2, path: '/creator-dashboard?tab=collab' },
      { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
    ],
    quickActions: [
      { id: 'upload-contract', label: 'Upload Contract', icon: Upload, path: '/contract-upload', variant: 'default' },
      { id: 'add-deal', label: 'Add New Deal', icon: Plus, path: '/contract-upload', variant: 'primary' },
      { id: 'schedule-call', label: 'Schedule Call', icon: CalendarCheck, variant: 'accent' },
    ],
    lifestyleShield: [
      { id: 'consumer-complaints', label: 'Consumer Complaints', icon: Shield, path: '/lifestyle/consumer-complaints', variant: 'accent' },
      { id: 'my-complaints', label: 'My Complaints', icon: FileText, path: '/dashboard/consumer-complaints', variant: 'default' },
    ],
    settings: [
      { id: 'profile', label: 'Account', icon: Settings, path: '/creator-dashboard?tab=profile' },
      { id: 'notification-settings', label: 'Notifications', icon: Bell, path: '/creator-dashboard?tab=profile' },
      { id: 'help', label: 'Help & Support', icon: HelpCircle },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/creator-analytics' },
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
      if (onNavigate) {
        onNavigate(item.path);
      } else {
        navigate(item.path);
      }
    }
    onClose();
  };

  const handleProfileClick = () => {
    navigate('/creator-dashboard?tab=profile');
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

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
            className={cn(
              "fixed top-0 left-0 h-full",
              "w-[82vw] max-w-[300px]",
              "bg-white dark:bg-[#0B0F14]",
              "border-r border-slate-200 dark:border-white/8",
              "shadow-[4px_0_40px_rgba(15,23,42,0.18)] dark:shadow-[4px_0_60px_rgba(0,0,0,0.6)]",
              "overflow-y-auto",
              "px-4 py-6",
              "flex flex-col gap-0",
              "[&::-webkit-scrollbar]:w-0",
              "overscroll-contain"
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role="navigation"
            aria-label="Navigation menu"
          >

            {/* Ambient gradient top */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-emerald-100 via-teal-50 to-transparent dark:from-emerald-500/10 dark:via-teal-500/5 pointer-events-none" />

            {/* Logo + App Label */}
            <div className="flex items-center gap-3 px-1 mb-6 relative z-10">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  CreatorArmour
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30 mt-0.5">
                  Console
                </p>
              </div>
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
            <div className="relative z-10 mt-4 space-y-1.5">
              {menuData.main.map((item) => (
                <DrawerItem
                  key={item.id}
                  item={item}
                  isActive={getActiveItem(item)}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>

            {/* Lifestyle Shield */}
            {menuData.lifestyleShield && menuData.lifestyleShield.length > 0 && (
              <div className="relative z-10">
                <DrawerSection title="🛡 Lifestyle Shield">
                  {menuData.lifestyleShield.map((item) => (
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
              <DrawerSection title="Settings">
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
            <div className="relative z-10 mt-4 pt-4 border-t border-slate-200 dark:border-white/5 pb-[max(calc(env(safe-area-inset-bottom,0px)+12px),12px)]">
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
    { id: 'deals', label: 'Brand Deals', icon: Briefcase, tab: 'deals' },
    { id: 'payments', label: 'Payments', icon: Wallet, tab: 'payments' },
    { id: 'collab', label: 'Collab', icon: Link2, path: '/creator-dashboard' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  ],
  quickActions: [
    { id: 'upload-contract', label: 'Upload Contract', icon: Upload, path: '/contract-upload', variant: 'default' },
    { id: 'add-deal', label: 'Add New Deal', icon: Plus, path: '/contract-upload', variant: 'primary' },
    { id: 'schedule-call', label: 'Schedule Call', icon: CalendarCheck, variant: 'accent' },
  ],
  lifestyleShield: [
    { id: 'consumer-complaints', label: 'Consumer Complaints', icon: Shield, path: '/lifestyle/consumer-complaints', variant: 'accent' },
    { id: 'my-complaints', label: 'My Complaints', icon: FileText, path: '/dashboard/consumer-complaints', variant: 'default' },
  ],
  settings: [
    { id: 'profile', label: 'Profile Settings', icon: Settings, path: '/creator-profile' },
    { id: 'notification-settings', label: 'Notification Settings', icon: Bell, path: '/creator-profile?section=account' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/creator-analytics' },
  ],
};
