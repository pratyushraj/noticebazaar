"use client";

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Wallet, Shield, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const CreatorBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.2)] progressive-blur">
        <nav 
          className="flex justify-around h-14 items-center px-2"
          style={{ paddingBottom: `max(8px, env(safe-area-inset-bottom))` }}
        >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(item.to);
            }
          };

          return (
            <Link
              key={item.to}
              to={item.to}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400/50 focus-visible:rounded-lg min-h-[48px] min-w-[48px]",
                active 
                  ? "text-white" 
                  : "text-white/60"
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Glowing underline + dot indicator for active tab */}
              {active && (
                <>
                  <div className="absolute inset-0 bg-white/5 rounded-t-2xl" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  {/* Purple dot indicator */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                </>
              )}
              
              <div className={cn(
                "relative flex items-center justify-center mb-0.5 transition-transform duration-200",
                active && "scale-110"
              )}>
                <Icon className={cn(
                  "h-7 w-7 transition-all duration-200",
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

