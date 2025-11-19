"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, Wallet, Shield, Sparkles, Settings, X } from 'lucide-react';
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

  // Define menu items based on role
  const getMenuItems = (): MenuItem[] => {
    if (profileRole === 'creator') {
      return [
        { name: "Overview", icon: Home, path: "/creator-dashboard", roles: ['creator'] },
        { name: "Deals", icon: Briefcase, path: "/creator-contracts", roles: ['creator'] },
        { name: "Payments", icon: Wallet, path: "/creator-payments", roles: ['creator'] },
        { name: "Protection", icon: Shield, path: "/creator-content-protection", roles: ['creator'] },
        { name: "Partner Program", icon: Sparkles, path: "/partner-program", roles: ['creator'] },
        { name: "Settings", icon: Settings, path: "/creator-profile" },
      ];
    }
    // Add other role menus as needed
    return [
      { name: "Overview", icon: Home, path: "/client-dashboard" },
      { name: "Settings", icon: Settings, path: "/client-profile" },
    ];
  };

  const menuItems = getMenuItems().filter(item => {
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

  const handleItemClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/creator-dashboard') {
      return location.pathname === path || location.pathname === '/creator-dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer"
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[150]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-14 right-4 sm:right-6 w-[330px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-[#1A1A1C] rounded-3xl shadow-2xl border border-white/10 p-6 z-[200]"
          >
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-transform duration-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Grid of Apps */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-10">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                    <motion.button
                    key={item.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleItemClick(item.path)}
                    className={cn(
                      "flex flex-col items-center gap-2 group transition-all duration-150 active:scale-95",
                      active && "opacity-100"
                    )}
                  >
                    {/* Icon Container */}
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 border",
                        active
                          ? "bg-gradient-to-r from-[#0A3AFF] to-[#003A9F] shadow-[0_0_25px_rgba(59,130,246,0.5)] border-white/10"
                          : "bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/10"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-7 h-7 transition-colors duration-150",
                          active ? "text-white" : "text-gray-300 group-hover:text-white"
                        )}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        "text-sm transition-colors duration-150 text-center",
                        active ? "text-white font-medium" : "text-gray-300 group-hover:text-white"
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

