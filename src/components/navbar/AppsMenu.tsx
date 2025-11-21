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
  X,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Define menu sections with secondary items only (primary items are in bottom nav)
  const menuSections: MenuSection[] = [
    {
      title: "Tools",
      items: [
    { name: "Calendar Sync", icon: Calendar, path: "/creator-dashboard?tab=calendar", roles: ['creator'] },
    { name: "Documents Vault", icon: FolderOpen, path: "/documents-vault", roles: ['creator'] },
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
      title: "Business",
      items: [
    { name: "Tax Summary", icon: Receipt, path: "/creator-tax-compliance", roles: ['creator'] },
    { name: "Partner Program", icon: Sparkles, path: "/partner-program", roles: ['creator'] },
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

  const handleItemClick = (path: string, itemName?: string) => {
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
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-white/70" />
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

      {/* Left Sidebar - iOS Style */}
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
            className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-[280px] max-w-[85vw] overflow-y-auto bg-[#1C1C1E] border-r border-white/5 shadow-2xl z-[150]"
          >
            {/* iOS-style Header */}
            <div className="sticky top-0 bg-[#1C1C1E]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 z-10">
              <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
                aria-label="Close menu"
              >
                  <X className="w-5 h-5 text-white/80" />
              </button>
              </div>
            </div>

            {/* iOS-style Menu List */}
            <div className="px-4 py-3">
              {visibleSections.map((section, sectionIndex) => (
                <div key={section.title} className={cn(
                  "mb-6",
                  sectionIndex === 0 && "mt-2"
                )}>
                  {/* iOS-style Section Header */}
                  <div className="px-3 py-2.5 mb-2">
                    <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider leading-none">
                      {section.title}
                    </h3>
                  </div>
                  
                  {/* iOS-style List Items */}
                  <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                    {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                      const isLast = itemIndex === section.items.length - 1;

                return (
                        <button
                    key={item.path}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleItemClick(item.path, item.name);
                    }}
                    className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 transition-colors relative",
                            "active:bg-white/10",
                            !isLast && "border-b border-white/5",
                            active && "bg-white/5"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-md",
                            active ? "bg-white/10" : "bg-white/5"
                          )}>
                            <Icon className={cn(
                              "w-4 h-4",
                              active ? "text-white" : "text-white/70"
                            )} />
                    </div>
                          <span className={cn(
                            "text-[15px] flex-1 text-left",
                            active ? "text-white font-medium" : "text-white/90"
                          )}>
                      {item.name}
                    </span>
                          {active && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
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
