"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Wallet, Shield, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const CreatorBottomNav = () => {
  const location = useLocation();

  // iOS-style: 4-5 main tabs max
  const navItems = [
    { 
      to: "/creator-dashboard", 
      icon: LayoutDashboard, 
      label: "Home",
      matchPaths: ["/creator-dashboard"]
    },
    { 
      to: "/creator-contracts", 
      icon: Briefcase, 
      label: "Deals",
      matchPaths: ["/creator-contracts"]
    },
    { 
      to: "/creator-payments", 
      icon: Wallet, 
      label: "Payments",
      matchPaths: ["/creator-payments", "/insights"]
    },
    { 
      to: "/creator-content-protection", 
      icon: Shield, 
      label: "Protection",
      matchPaths: ["/creator-content-protection"]
    },
    { 
      to: "/messages", 
      icon: MessageSquare, 
      label: "Messages",
      matchPaths: ["/messages"]
    },
  ];

  const isActive = (item: typeof navItems[0]) => {
    return item.matchPaths.some(path => location.pathname.startsWith(path));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
      <nav className="flex justify-around h-16 items-center px-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative",
                active 
                  ? "text-white" 
                  : "text-white/60"
              )}
            >
              {/* iOS-style active indicator (subtle background) */}
              {active && (
                <div className="absolute inset-0 bg-white/5 rounded-t-2xl" />
              )}
              
              <div className={cn(
                "relative flex items-center justify-center mb-1 transition-transform duration-200",
                active && "scale-110"
              )}>
                <Icon className={cn(
                  "h-6 w-6 transition-all duration-200",
                  active && "text-white"
                )} />
              </div>
              
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                active && "text-white font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default CreatorBottomNav;

