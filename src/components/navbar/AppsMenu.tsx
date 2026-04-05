"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  AlertTriangle,
  FileText,
  Settings,
  Menu,
  Search,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface AppsMenuProps {
  profileRole?: string | null;
}

const AppsMenu: React.FC<AppsMenuProps> = ({ profileRole }) => {
  const { isOpen, setIsOpen } = useSidebar();
  const { profile } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Define menu sections with secondary items only (primary items are in bottom nav)
  const menuSections: MenuSection[] = [
    {
      title: "Tools",
      items: [
        { name: "Calendar Sync", icon: Calendar, path: "/creator-dashboard?tab=calendar", roles: ['creator'] },
        { name: "Invoice Generator", icon: FileText, path: "/creator-dashboard?tab=invoices", roles: ['creator'] },
      ]
    },
    {
      title: "Support",
      items: [
        { name: "Disputes Center", icon: AlertTriangle, path: "/creator-dashboard?tab=disputes", roles: ['creator'] },
      ]
    },
    {
      title: "Settings",
      items: [
        { name: "Settings", icon: Settings, path: "/settings", roles: ['creator'] },
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
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
  }, [isOpen]);

  const handleItemClick = (path: string) => {
    // Close menu first for better UX
    setIsOpen(false);

    // Handle query params for tab navigation
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      navigate(`${basePath}?${query}`, { replace: false });

      // For dashboard tabs, scroll to the appropriate section after a small delay
      if (basePath === '/creator-dashboard') {
        setTimeout(() => {
          const tab = query.split('=')[1];
          if (tab) {
            // Try to find and scroll to the section
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
      // Direct navigation for routes without query params
      navigate(path, { replace: false });
    }
  };

  const isActive = (path: string) => {
    const currentPath = location.pathname;
    const basePath = path.split('?')[0];

    if (basePath === '/creator-dashboard') {
      return currentPath === basePath || currentPath === '/creator-dashboard';
    }
    return currentPath === basePath || currentPath.startsWith(basePath + '/');
  };

  return (
    <div className="relative">
      {/* Hamburger Menu Trigger Button */}
      <button type="button"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-all duration-200 cursor-pointer active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-foreground/70" />
      </button>

      {/* Backdrop */}
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

      {/* Left Sidebar - iOS Style (Mobile Only) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200
            }}
            className="fixed top-16 left-0 h-[calc(100dvh-4rem)] w-[280px] max-w-[85vw] overflow-y-auto bg-card border-r border-border/5 shadow-2xl z-[150] md:hidden"
          >
            {/* iOS-style Search Bar */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border/5 z-10 px-4 pt-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-border focus:bg-secondary/50 transition-colors"
                />
              </div>
            </div>

            {/* User Profile Section */}
            {profile && (
              <div className="px-4 py-4 border-b border-border/5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-white/10">
                    <AvatarImage
                      src={profile.avatar_url || DEFAULT_AVATAR_URL}
                      alt={profile.first_name || "User"}
                    />
                    <AvatarFallback className="bg-info/20 text-info text-sm font-medium">
                      {getInitials(profile.first_name, profile.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {profile.first_name} {profile.last_name}
                    </div>
                    <div className="text-xs text-foreground/50">
                      {profile.role === 'creator' ? 'Creator Account' : profile.role === 'admin' ? 'Admin Account' : 'Account'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* iOS-style Menu List */}
            <div className="py-2 bg-gradient-to-br from-[#3B82F6]/5 via-blue-500/5 to-slate-500/5">
              {filteredSections.map((section, sectionIndex) => (
                <div key={section.title} className={cn(
                  "mb-6",
                  sectionIndex === 0 && "mt-2"
                )}>
                  {/* iOS-style Section Header */}
                  <div className="px-4 py-2">
                    <h3 className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider leading-none">
                      {section.title}
                    </h3>
                  </div>

                  {/* iOS-style List Items */}
                  <div className="bg-card rounded-xl overflow-hidden border border-border/5">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const isLast = itemIndex === section.items.length - 1;

                      // iOS-style icon colors
                      const iconColors: Record<string, string> = {
                        'Calendar Sync': 'text-info',
                        'Invoice Generator': 'text-green-400',
                        'Disputes Center': 'text-orange-400',
                        'Settings': 'text-gray-400',
                      };

                      return (
                        <button type="button"
                          key={item.path}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleItemClick(item.path);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 transition-colors relative group",
                            "active:bg-secondary/50",
                            !isLast && "border-b border-border/5",
                            active && "bg-info/20"
                          )}
                        >
                          {/* Icon with iOS-style colored background */}
                          <div className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0",
                            active
                              ? "bg-info/20"
                              : "bg-card group-hover:bg-secondary/50"
                          )}>
                            <Icon className={cn(
                              "w-4 h-4",
                              active
                                ? "text-info"
                                : iconColors[item.name] || "text-foreground/70"
                            )} />
                          </div>

                          {/* Text */}
                          <span className={cn(
                            "text-[15px] flex-1 text-left",
                            active ? "text-foreground font-medium" : "text-foreground/90"
                          )}>
                            {item.name}
                          </span>

                          {/* Chevron */}
                          <ChevronRight className={cn(
                            "w-4 h-4 flex-shrink-0 transition-colors",
                            active ? "text-info" : "text-foreground/30"
                          )} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppsMenu;
