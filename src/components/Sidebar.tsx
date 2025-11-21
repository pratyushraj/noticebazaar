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
  Search,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';

interface SidebarItem {
  name: string;
  icon: React.ElementType;
  path: string;
  iconColor: string;
  roles?: string[];
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
    <div className="sticky top-0 bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-white/5 z-10 px-4 pt-4 pb-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B7F8A]" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-[#7B7F8A] focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all duration-200 ease-in-out"
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
    <div className="px-4 py-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-white/10">
          <AvatarImage 
            src={avatarUrl || DEFAULT_AVATAR_URL} 
            alt={name} 
          />
          <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-medium">
            {getInitials(name.split(' ')[0], name.split(' ')[1])}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
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
}> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-[14px] h-[54px] rounded-[14px] transition-all duration-200 ease-in-out relative group",
        "hover:bg-[#1C2233]",
        isActive && "bg-[#1C2233]"
      )}
    >
      {/* Icon with colored circle background */}
      <div 
        className="w-[22px] h-[22px] flex items-center justify-center rounded-full flex-shrink-0"
        style={{ backgroundColor: `${item.iconColor}26` }} // 15% opacity
      >
        <Icon 
          className="w-[22px] h-[22px]" 
          style={{ color: item.iconColor }}
        />
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-[15px] flex-1 text-left font-medium",
        isActive ? "text-white" : "text-white/90"
      )}>
        {item.name}
      </span>
      
      {/* Chevron */}
      <ChevronRight className={cn(
        "w-4 h-4 flex-shrink-0 transition-colors",
        isActive ? "text-white/60" : "text-white/30"
      )} />
    </button>
  );
};

// SidebarSection Component
const SidebarSection: React.FC<{
  section: SidebarSection;
  isActive: (path: string) => boolean;
  onItemClick: (path: string) => void;
}> = ({ section, isActive, onItemClick }) => {
  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="px-4 mb-1.5 mt-[18px] first:mt-2">
        <h3 className="text-[12px] font-semibold text-[#7B7F8A] uppercase tracking-wider leading-none">
          {section.title}
        </h3>
      </div>
      
      {/* Section Items */}
      <div className="px-2 space-y-1">
        {section.items.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            onClick={() => onItemClick(item.path)}
          />
        ))}
      </div>
    </div>
  );
};

// Main Sidebar Component
const Sidebar: React.FC<SidebarProps> = ({ className, profileRole }) => {
  const { isOpen, setIsOpen } = useSidebar();
  const { profile, user } = useSession();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // For preview mode, always show sidebar on desktop
  const isPreview = location.pathname === '/dashboard-preview';

  // Define menu sections with macOS/iOS Settings structure
  const menuSections: SidebarSection[] = [
    {
      title: "TOOLS",
      items: [
        { 
          name: "Calendar Sync", 
          icon: Calendar, 
          path: "/creator-dashboard?tab=calendar", 
          iconColor: "#0A84FF",
          roles: ['creator'] 
        },
        { 
          name: "Documents Vault", 
          icon: FolderOpen, 
          path: "/documents-vault", 
          iconColor: "#BF5AF2",
          roles: ['creator'] 
        },
        { 
          name: "Invoice Generator", 
          icon: FileText, 
          path: "/creator-dashboard?tab=invoices", 
          iconColor: "#30D158",
          roles: ['creator'] 
        },
      ]
    },
    {
      title: "SUPPORT",
      items: [
        { 
          name: "Disputes Center", 
          icon: AlertTriangle, 
          path: "/creator-dashboard?tab=disputes", 
          iconColor: "#FF453A",
          roles: ['creator'] 
        },
      ]
    },
    {
      title: "BUSINESS",
      items: [
        { 
          name: "Tax Summary", 
          icon: Receipt, 
          path: "/creator-tax-compliance", 
          iconColor: "#FFD60A",
          roles: ['creator'] 
        },
        { 
          name: "Partner Program", 
          icon: Sparkles, 
          path: "/partner-program", 
          iconColor: "#5E5CE6",
          roles: ['creator'] 
        },
      ]
    },
    {
      title: "SETTINGS",
      items: [
        { 
          name: "Settings", 
          icon: Settings, 
          path: "/settings", 
          iconColor: "#8E8E93",
          roles: ['creator'] 
        },
      ]
    }
  ];

  // Filter sections and items based on role
  const visibleSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(profileRole || '');
    })
  })).filter(section => section.items.length > 0);

  // Filter items by search query
  const filteredSections = searchQuery
    ? visibleSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : visibleSections;

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Close on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, setIsOpen]);

  // Handle item click
  const handleItemClick = (path: string) => {
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }

    // Handle query params for tab navigation
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      navigate(`${basePath}?${query}`, { replace: false });
      
      // For dashboard tabs, scroll to the appropriate section after a small delay
      if (basePath === '/creator-dashboard') {
        setTimeout(() => {
          const tab = query.split('=')[1];
          if (tab) {
            const sectionMap: Record<string, string> = {
              insights: '[data-section="ai-insights"]',
              calendar: '[data-section="calendar-sync"]',
              documents: '[data-section="documents-vault"]',
              disputes: '[data-section="disputes-center"]',
              invoices: '[data-section="invoice-generator"]',
            };
            
            const selector = sectionMap[tab];
            if (selector) {
              const element = document.querySelector(selector);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          }
        }, 300);
      }
    } else {
      navigate(path, { replace: false });
    }
  };

  // Check if path is active
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    const basePath = path.split('?')[0];
    
    if (basePath === '/creator-dashboard') {
      const currentTab = new URLSearchParams(location.search).get('tab');
      const pathTab = path.split('tab=')[1];
      return currentPath === basePath && (currentTab === pathTab || (!currentTab && !pathTab));
    }
    return currentPath === basePath || currentPath.startsWith(basePath + '/');
  };

  // Get user display name and email
  const userName = profile 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
    : 'User';
  const userEmail = user?.email || undefined;

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[140] md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      {isPreview && window.innerWidth >= 768 ? (
        // Always visible on desktop for preview
        <div
          ref={sidebarRef}
          className={cn(
            "h-[calc(100vh-4rem)] w-[320px] overflow-y-auto",
            "bg-[#0B0F1A] backdrop-blur-xl border-r border-white/5",
            "shadow-[0_0_40px_rgba(0,0,0,0.35)]",
            "z-[150]",
            "md:static md:h-full md:top-0 md:rounded-none",
            className
          )}
        >
          {/* Search Bar */}
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />

          {/* User Card */}
          {(profile || (!profile && !user)) && (
            <UserCard 
              name={profile ? userName : 'Demo Creator'}
              email={profile ? userEmail : 'demo@noticebazaar.com'}
              avatarUrl={profile?.avatar_url || null}
            />
          )}

          {/* Menu Sections */}
          <div className="px-2 py-2">
            {filteredSections.map((section) => (
              <SidebarSection
                key={section.title}
                section={section}
                isActive={isActive}
                onItemClick={handleItemClick}
              />
            ))}
          </div>
        </div>
      ) : (
        // Normal behavior with animations for mobile/authenticated users
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={sidebarRef}
              initial={{ opacity: 0, x: '-100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '-100%' }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200
              }}
              className={cn(
                "h-[calc(100vh-4rem)] w-[320px] max-w-[85vw] overflow-y-auto",
                "bg-[#0B0F1A] backdrop-blur-xl border-r border-white/5",
                "shadow-[0_0_40px_rgba(0,0,0,0.35)]",
                "z-[150]",
                "md:static md:h-full md:top-0 md:rounded-none",
                "rounded-r-2xl md:rounded-none",
                "fixed top-16 left-0",
                className
              )}
            >
            {/* Search Bar */}
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
            />

            {/* User Card */}
            {(profile || (!profile && !user)) && (
              <UserCard 
                name={profile ? userName : 'Demo Creator'}
                email={profile ? userEmail : 'demo@noticebazaar.com'}
                avatarUrl={profile?.avatar_url || null}
              />
            )}

            {/* Menu Sections */}
            <div className="px-2 py-2">
              {filteredSections.map((section) => (
                <SidebarSection
                  key={section.title}
                  section={section}
                  isActive={isActive}
                  onItemClick={handleItemClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </>
  );
};

export default Sidebar;
