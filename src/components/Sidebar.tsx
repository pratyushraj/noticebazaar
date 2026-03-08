"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  FolderOpen,
  AlertTriangle,
  FileText,
  Receipt,
  Sparkles,
  Settings,
  Bell,
  Search,
  ChevronRight,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { isCreatorProSync } from '@/lib/subscription';

interface SidebarItem {
  name: string;
  icon: React.ElementType;
  path: string;
  iconColor: string;
  roles?: string[];
  isPro?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  className?: string;
  profileRole?: string | null;
}

// SearchBar Component
const SearchBar: React.FC<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="sticky top-0 bg-[hsl(var(--sidebar-background)/0.02)] backdrop-blur-xl border-b border-[hsl(var(--sidebar-border)/0.5)] z-10 px-4 pt-4 pb-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B7F8A]" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-[hsl(var(--sidebar-background)/0.05)] border border-[hsl(var(--sidebar-border)/0.1)] rounded-xl text-sm text-[hsl(var(--sidebar-foreground))] placeholder:text-[#7B7F8A] focus:outline-none focus:border-[hsl(var(--sidebar-border)/0.2)] focus:bg-[hsl(var(--sidebar-background)/0.1)] transition-all duration-200 ease-in-out"
        />
      </div>
    </div>
  );
};

// UserCard Component
const UserCard: React.FC<{
  name: string;
  email?: string;
  avatarUrl?: string | null;
}> = ({ name, email, avatarUrl }) => {
  return (
    <div className="px-4 py-4 border-b border-[hsl(var(--sidebar-border)/0.5)]">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-[hsl(var(--sidebar-border)/0.1)]">
          <AvatarImage
            src={avatarUrl || DEFAULT_AVATAR_URL}
            alt={name}
          />
          <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-medium">
            {getInitials(name.split(' ')[0], name.split(' ')[1])}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))] truncate">
            {name}
          </div>
          {email && (
            <div className="text-xs text-[#7B7F8A] truncate">
              {email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// SidebarItem Component
const SidebarItem: React.FC<{
  item: SidebarItem;
  isActive: boolean;
  onClick: () => void;
  isProUser?: boolean;
}> = ({ item, isActive, onClick, isProUser = false }) => {
  const Icon = item.icon;
  const isProFeature = item.isPro === true;
  const showProBadge = isProFeature && isProUser;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-[14px] h-[50px] rounded-[12px] transition-all duration-200 ease-in-out relative group",
        "hover:bg-[hsl(var(--sidebar-accent)/0.05)]",
        isActive && "bg-[hsl(var(--sidebar-accent)/0.1)] shadow-lg shadow-black/20"
      )}
    >
      <div
        className="w-[22px] h-[22px] flex items-center justify-center rounded-full flex-shrink-0"
        style={{ backgroundColor: `${item.iconColor}26` }}
      >
        <Icon
          className="w-[22px] h-[22px]"
          style={{ color: item.iconColor }}
        />
      </div>

      <span className={cn(
        "text-[15px] flex-1 text-left font-medium",
        isActive ? "text-[hsl(var(--sidebar-foreground))]" : "text-[hsl(var(--sidebar-foreground)/0.9)]"
      )}>
        {item.name}
      </span>

      {showProBadge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-md text-blue-400 flex-shrink-0">
          PRO
        </span>
      )}

      <ChevronRight className={cn(
        "w-4 h-4 flex-shrink-0 transition-colors",
        isActive ? "text-[hsl(var(--sidebar-foreground)/0.6)]" : "text-[hsl(var(--sidebar-foreground)/0.3)]"
      )} />
    </button>
  );
};

// SidebarSection Component
const SidebarSection: React.FC<{
  section: SidebarSection;
  isActive: (path: string) => boolean;
  onItemClick: (path: string) => void;
  isProUser?: boolean;
}> = ({ section, isActive, onItemClick, isProUser = false }) => {
  return (
    <div className="mb-6">
      <div className="px-4 mb-1.5 mt-[18px] first:mt-2">
        <h3 className="text-[12px] font-semibold text-[#7B7F8A] uppercase tracking-wider leading-none">
          {section.title}
        </h3>
      </div>

      <div className="px-2 space-y-1">
        {section.items.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            onClick={() => onItemClick(item.path)}
            isProUser={isProUser}
          />
        ))}
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ className, profileRole }) => {
  const { isOpen, setIsOpen } = useSidebar();
  const { profile, user } = useSession();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const isPreview = location.pathname === '/dashboard-preview';
  const isProUser = isCreatorProSync(profile);

  const menuSections: SidebarSection[] = [
    {
      title: "TOOLS",
      items: [
        { name: "Calendar Sync", icon: Calendar, path: "/creator-dashboard?tab=calendar", iconColor: "#0A84FF", roles: ['creator'] },
        { name: "Documents Vault", icon: FolderOpen, path: "/documents-vault", iconColor: "#BF5AF2", roles: ['creator'] },
        { name: "Invoice Generator", icon: FileText, path: "/creator-dashboard?tab=invoices", iconColor: "#30D158", roles: ['creator'] },
        { name: "AI Pitch Generator", icon: MessageSquare, path: "/ai-pitch-generator", iconColor: "#FF6B9D", roles: ['creator'] },
      ]
    },
    {
      title: "SUPPORT",
      items: [
        { name: "Disputes Center", icon: AlertTriangle, path: "/creator-dashboard?tab=disputes", iconColor: "#FF453A", roles: ['creator'] },
      ]
    },
    {
      title: "🛡 LIFESTYLE SHIELD",
      items: [
        { name: "Consumer Complaints", icon: Shield, path: "/lifestyle/consumer-complaints", iconColor: "#34D399", roles: ['creator'] },
        { name: "My Complaints", icon: FileText, path: "/dashboard/consumer-complaints", iconColor: "#8B5CF6", roles: ['creator'] },
      ]
    },
    {
      title: "BUSINESS",
      items: [
        { name: "Tax Summary", icon: Receipt, path: "/creator-tax-compliance", iconColor: "#FFD60A", roles: ['creator'] },
        { name: "Partner Program", icon: Sparkles, path: "/partner-program", iconColor: "#5E5CE6", roles: ['creator'] },
      ]
    }
  ];

  const userRole = profileRole || profile?.role || 'creator';
  const visibleSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || item.roles.includes(userRole))
  })).filter(section => section.items.length > 0);

  const filteredSections = searchQuery
    ? visibleSections.map(section => ({
      ...section,
      items: section.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    })).filter(section => section.items.length > 0)
    : visibleSections;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  const handleItemClick = (path: string) => {
    if (window.innerWidth < 1024) setIsOpen(false);
    navigate(path);
  };

  const isActive = (path: string) => {
    const [basePath] = path.split('?');
    return location.pathname === basePath;
  };

  const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'User';
  const userEmail = user?.email;

  const renderSidebarContent = () => (
    <>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      {(profile || (!profile && !user)) && (
        <UserCard
          name={profile ? userName : 'Demo Creator'}
          email={profile ? userEmail : 'demo@creatorarmour.com'}
          avatarUrl={profile?.avatar_url || null}
        />
      )}
      <div className="px-2 py-2 flex-1 overflow-y-auto custom-scrollbar">
        {filteredSections.map((section) => (
          <SidebarSection
            key={section.title}
            section={section}
            isActive={isActive}
            onItemClick={handleItemClick}
            isProUser={isProUser}
          />
        ))}
      </div>
      <div className="mt-auto border-t border-[hsl(var(--sidebar-border)/0.5)] p-4">
        <SidebarItem
          item={{ name: "Settings", icon: Settings, path: "/creator-profile", iconColor: "#8E8E93" }}
          isActive={location.pathname === "/creator-profile"}
          onClick={() => handleItemClick("/creator-profile")}
        />
      </div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[140] lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {isPreview ? (
        <div className={cn("flex flex-shrink-0 flex-col h-screen w-[280px] bg-[hsl(var(--sidebar-background)/0.6)] backdrop-blur-2xl border-r border-[hsl(var(--sidebar-border)/0.5)] relative z-10", className)}>
          {renderSidebarContent()}
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key="desktop-sidebar"
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn("hidden lg:flex flex-shrink-0 flex-col h-screen sticky top-0 w-[280px] bg-[hsl(var(--sidebar-background)/0.8)] backdrop-blur-2xl border-r border-[hsl(var(--sidebar-border)/0.5)] z-[100]", className)}
              >
                {renderSidebarContent()}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key="mobile-sidebar"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn("lg:hidden fixed top-0 left-0 flex flex-col h-screen w-[280px] max-w-[85vw] bg-[hsl(var(--sidebar-background)/0.95)] backdrop-blur-2xl border-r border-[hsl(var(--sidebar-border)/0.1)] z-[155] rounded-r-2xl", className)}
              >
                {renderSidebarContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
};

export default Sidebar;
