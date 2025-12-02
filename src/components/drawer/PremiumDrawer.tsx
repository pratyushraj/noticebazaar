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
  return (
    <div className="mb-6">
      {/* Profile Section */}
      <button
        onClick={onProfileClick}
        className="flex items-center gap-3 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent rounded-xl p-1 transition-all active:scale-[0.98]"
        aria-label={`View profile for ${userName}`}
        role="button"
      >
        {/* Avatar with gradient border */}
        <div className="relative">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={`${userName}'s avatar`}
              className="w-12 h-12 rounded-full object-cover border-2 border-transparent"
              style={{
                borderImage: 'linear-gradient(135deg, #6EE7FF, #8B5CF6) 1',
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6EE7FF] to-[#8B5CF6] flex items-center justify-center text-lg font-semibold text-white border-2 border-transparent">
              {userInitials}
            </div>
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-bold text-base leading-tight truncate text-white">
            {userName}
          </p>
          <p className="text-sm leading-tight truncate" style={{ color: '#ffffff90' }}>
            @{userHandle}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#ffffff70' }} />
      </button>

      {/* Icon Buttons Row */}
      <div className="flex items-center gap-2">
        <button
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:scale-95 hover:bg-white/10 active:scale-95"
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5" style={{ color: '#ffffff70' }} />
        </button>
        <button
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:scale-95 hover:bg-white/10 active:scale-95"
          aria-label="Calendar"
        >
          <Calendar className="w-5 h-5" style={{ color: '#ffffff70' }} />
        </button>
        <button
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:scale-95 hover:bg-white/10 active:scale-95 relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" style={{ color: '#ffffff70' }} />
          {/* Notification badge can be added here */}
        </button>
        <button
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:scale-95 hover:bg-white/10 active:scale-95"
          aria-label="Search"
        >
          <Search className="w-5 h-5" style={{ color: '#ffffff70' }} />
        </button>
      </div>
    </div>
  );
}

interface DrawerSectionProps {
  title: string;
  children: React.ReactNode;
}

function DrawerSection({ title, children }: DrawerSectionProps) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="text-xs uppercase tracking-wider mb-3 font-semibold" style={{ color: '#ffffff85' }}>
        {title}
      </p>
      <div className="space-y-2">
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

  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        "relative flex items-center w-full px-4 rounded-[18px] transition-all duration-150",
        "active:scale-[0.97]",
        "focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent",
        isActive
          ? "bg-gradient-to-r from-[#6EE7FF] to-[#8B5CF6] text-white shadow-lg"
          : cn(
              "bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] backdrop-blur-[12px]",
              "text-white/90 hover:bg-[rgba(255,255,255,0.08)]"
            )
      )}
      style={{
        paddingTop: '14px',
        paddingBottom: '14px',
      }}
    >
      <Icon className="w-[22px] h-[22px] flex-shrink-0 mr-3" />
      <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
      
      {item.badge && (
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full bg-red-500 text-white ml-2"
        >
          {item.badge}
        </motion.span>
      )}
    </button>
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

  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={item.label}
      className={cn(
        "relative flex items-center w-full px-4 rounded-[18px] transition-all duration-150",
        "active:scale-[0.97]",
        "focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent",
        isPrimary
          ? "bg-gradient-to-r from-[#6EE7FF] to-[#8B5CF6] text-white shadow-lg"
          : isAccent
          ? "bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] hover:bg-[rgba(16,185,129,0.2)]"
          : cn(
              "bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] backdrop-blur-[12px]",
              "text-white/90 hover:bg-[rgba(255,255,255,0.08)]"
            )
      )}
      style={{
        paddingTop: '14px',
        paddingBottom: '14px',
      }}
    >
      <Icon className="w-[22px] h-[22px] flex-shrink-0 mr-3" />
      <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
    </button>
  );
}

interface LogoutButtonProps {
  onClick: () => void;
}

function LogoutButton({ onClick }: LogoutButtonProps) {
  return (
    <button
      onClick={onClick}
      role="button"
      aria-label="Log out"
      className={cn(
        "w-full px-4 rounded-[18px] transition-all duration-150",
        "flex items-center gap-3",
        "bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.25)]",
        "text-[#ff6b6b] hover:bg-[rgba(255,0,0,0.15)]",
        "active:scale-[0.97]",
        "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 focus:ring-offset-transparent"
      )}
      style={{
        paddingTop: '14px',
        paddingBottom: '14px',
      }}
    >
      <LogOut className="w-[22px] h-[22px]" />
      <span className="font-medium text-sm flex-1 text-left">Log Out</span>
    </button>
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
        <div className="fixed inset-0 z-40 md:z-50">
          {/* Backdrop */}
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
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={cn(
              "absolute left-0 top-0 h-full",
              "w-[78%] max-w-[320px] md:w-[300px]",
              "rounded-r-[30px]",
              "backdrop-blur-md",
              "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
              "p-6",
              "flex flex-col",
              "text-white",
              // Custom scrollbar
              "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            )}
            style={{
              background: 'linear-gradient(180deg, #4b0cff 0%, #2d004f 100%)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <DrawerHeader
              userName={userName}
              userHandle={userHandle}
              userAvatar={userAvatar}
              userInitials={userInitials}
              onProfileClick={handleProfileClick}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-6 px-6">
              {/* Main Section */}
              <DrawerSection title="MAIN">
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
            <div className="mt-auto pt-4 border-t border-white/10">
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
