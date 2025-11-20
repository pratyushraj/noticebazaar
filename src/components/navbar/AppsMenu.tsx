"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Wallet,
  TrendingUp,
  Calendar,
  FolderOpen,
  AlertTriangle,
  Shield,
  FileText,
  Receipt,
  Sparkles,
  Settings,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import AppsGridIcon from '@/components/icons/AppsGridIcon';

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
}

interface AppsMenuProps {
  profileRole?: string | null;
}

const AppsMenu: React.FC<AppsMenuProps> = ({ profileRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Define all menu items
  const allMenuItems: MenuItem[] = [
    { name: "Dashboard", icon: Home, path: "/creator-dashboard", roles: ['creator'] },
    { name: "Deals", icon: Briefcase, path: "/creator-contracts", roles: ['creator'] },
    { name: "Payments", icon: Wallet, path: "/creator-payments", roles: ['creator'] },
    { name: "Insights", icon: TrendingUp, path: "/insights", roles: ['creator'] },
    { name: "Calendar Sync", icon: Calendar, path: "/creator-dashboard?tab=calendar", roles: ['creator'] },
    { name: "Documents Vault", icon: FolderOpen, path: "/documents-vault", roles: ['creator'] },
    { name: "Disputes Center", icon: AlertTriangle, path: "/creator-dashboard?tab=disputes", roles: ['creator'] },
    { name: "Protection", icon: Shield, path: "/creator-content-protection", roles: ['creator'] },
    { name: "Invoice Generator", icon: FileText, path: "/creator-dashboard?tab=invoices", roles: ['creator'] },
    { name: "Tax Summary", icon: Receipt, path: "/creator-tax-compliance", roles: ['creator'] },
    { name: "Partner Program", icon: Sparkles, path: "/partner-program", roles: ['creator'] },
    { name: "Settings", icon: Settings, path: "/creator-profile" },
  ];

  // Filter menu items based on role
  const menuItems = allMenuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(profileRole || '');
  });

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
      {/* Trigger Button */}
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer active:scale-95"
      >
        <AppsGridIcon />
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[150]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Premium Menu Panel - Slide up from bottom */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className="fixed top-14 right-4 sm:right-6 w-[340px] max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 p-5 z-[200] relative"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent pointer-events-none" />
            
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10 relative z-10">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200 backdrop-blur-sm"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Premium 3x4 Grid Layout */}
            <div className="grid grid-cols-3 gap-4 relative z-10 pb-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <motion.button
                    key={item.path}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.03,
                      duration: 0.2,
                      ease: "easeOut",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleItemClick(item.path, item.name);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(item.path, item.name);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 group relative",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-[#1A1A1C] rounded-xl",
                      "cursor-pointer"
                    )}
                    aria-label={`Navigate to ${item.name}`}
                  >
                    {/* Premium Icon Card - Equal size (80-90px) */}
                    <div
                      className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center",
                        "transition-all duration-200 backdrop-blur-xl border",
                        "active:scale-[0.98]",
                        active
                          ? "bg-white/20 backdrop-blur-[20px] saturate-[150%] border-white/30 shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                          : "bg-white/5 backdrop-blur-[20px] saturate-[120%] border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_6px_16px_rgba(0,0,0,0.3)]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-7 h-7 transition-colors duration-200",
                          active ? "text-white" : "text-white/70 group-hover:text-white"
                        )}
                      />
                    </div>

                    {/* Label - 14px text */}
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors duration-200 text-center leading-tight",
                        active ? "text-white" : "text-white/70 group-hover:text-white"
                      )}
                    >
                      {item.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppsMenu;
