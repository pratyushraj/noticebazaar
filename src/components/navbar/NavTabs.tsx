"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Wallet, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavTab {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[]; // If undefined, show for all roles
}

interface NavTabsProps {
  tabs: NavTab[];
  role?: string | null;
}

const NavTabs: React.FC<NavTabsProps> = ({ tabs, role }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/creator-dashboard') {
      return location.pathname === path || location.pathname === '/creator-dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Filter tabs based on role
  const visibleTabs = tabs.filter(tab => {
    if (!tab.roles) return true; // Show for all roles if roles is undefined
    return tab.roles.includes(role || '');
  });

  // Find active tab index for animation
  const activeIndex = visibleTabs.findIndex(tab => isActive(tab.to));

  return (
    <nav className="relative hidden lg:flex items-center space-x-1">
      {visibleTabs.map((tab, index) => {
        const Icon = tab.icon;
        const active = isActive(tab.to);
        
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              active
                ? "text-[#FF4DAA]"
                : "text-white/60 hover:text-white/80"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
            
            {/* Active indicator with pink underline */}
            {active && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4DAA] rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavTabs;

