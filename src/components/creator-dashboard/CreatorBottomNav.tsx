"use client";

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Wallet, Shield, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const CreatorBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

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

  // Detect keyboard open/close using multiple methods
  useEffect(() => {
    // Only run on mobile devices
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    let initialHeight = window.innerHeight;
    let viewportInitialHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportResize = () => {
      if (!window.visualViewport) {
        // Fallback: use window height comparison
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        // If height decreased by more than 150px, keyboard is likely open
        setIsKeyboardOpen(heightDiff > 150);
        return;
      }

      const viewport = window.visualViewport;
      const currentViewportHeight = viewport.height;
      
      // More sensitive threshold: if viewport height is less than 60% of initial, or
      // if the difference is more than 200px, keyboard is open
      const threshold1 = viewportInitialHeight * 0.6;
      const threshold2 = viewportInitialHeight - 200;
      const keyboardOpen = currentViewportHeight < Math.max(threshold1, threshold2);

      setIsKeyboardOpen(keyboardOpen);
    };

    // Also detect input focus/blur as additional signal
    const handleInputFocus = () => {
      // Small delay to let viewport adjust
      setTimeout(() => {
        handleViewportResize();
      }, 100);
    };

    const handleInputBlur = () => {
      // Delay to check if keyboard actually closed
      setTimeout(() => {
        handleViewportResize();
      }, 300);
    };

    // Initial check
    handleViewportResize();

    // Listen to visual viewport resize events
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    // Fallback: window resize
    window.addEventListener('resize', handleViewportResize);

    // Listen to input focus/blur events
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', handleInputFocus);
      input.addEventListener('blur', handleInputBlur);
    });

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      window.removeEventListener('resize', handleViewportResize);
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
        input.removeEventListener('blur', handleInputBlur);
      });
    };
  }, [location.pathname]); // Re-run when route changes to catch new inputs

  return (
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.2)] progressive-blur transition-transform duration-300 ease-in-out",
          isKeyboardOpen && "translate-y-full"
        )}
      >
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

