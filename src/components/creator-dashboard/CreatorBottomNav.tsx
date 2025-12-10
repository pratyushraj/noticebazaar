"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Wallet, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconSizes, animations, spotlight, shadows, radius } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { motion } from 'framer-motion';

const CreatorBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Use centralized haptic utility

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
      matchPaths: ["/creator-contracts", "/contract-upload", "/contract-protection"]
    },
    { 
      to: "/creator-payments", 
      icon: Wallet, 
      label: "Payments",
      matchPaths: ["/creator-payments", "/insights"]
    },
    { 
      to: "/messages", 
      icon: MessageSquare, 
      label: "Messages",
      matchPaths: ["/messages"]
    },
    { 
      to: "/creator-profile", 
      icon: User, 
      label: "Profile",
      matchPaths: ["/creator-profile"]
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

    const initialHeight = window.innerHeight;
    const viewportInitialHeight = window.visualViewport?.height || window.innerHeight;

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

  const bottomNavContent = (
      <motion.div 
        data-bottom-nav="true"
        className={cn(
          "fixed bottom-0 left-0 right-0",
          "bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95",
          "backdrop-blur-2xl",
          "border-t border-white/15",
          shadows.depth,
          radius.xl,
          "progressive-blur transition-transform duration-300 ease-in-out",
          "pointer-events-auto",
          isKeyboardOpen && "translate-y-full"
        )}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={animations.spring}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999, // Increased for Android browser compatibility
          width: '100%',
          maxWidth: '100vw', // Ensure it doesn't overflow
          pointerEvents: 'auto',
          // Android-specific fixes
          WebkitTransform: 'translateZ(0)', // Force hardware acceleration
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        {/* Spotlight gradient at top */}
        <div className={cn(spotlight.top, "opacity-50")} />
        
        {/* Inner border for depth */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-white/10" />
        
        <nav 
          className="flex justify-around h-16 md:h-12 items-center px-2 md:px-4 relative z-10 pointer-events-auto"
          style={{ 
            paddingBottom: `max(8px, env(safe-area-inset-bottom, 8px))`, 
            paddingTop: '8px',
            // Android browser fix: ensure nav is visible
            minHeight: '64px',
            pointerEvents: 'auto',
          }}
          role="navigation"
          aria-label="Bottom navigation"
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

          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            // Trigger haptic feedback
            triggerHaptic(HapticPatterns.light);
            // Let Link component handle navigation naturally
          };

          return (
            <motion.div
              key={item.to}
              className="flex-1"
              whileTap={animations.microTap}
              style={{ pointerEvents: 'auto' }}
            >
              <Link
                to={item.to}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onClick={handleClick}
                replace={false}
                className={cn(
                  "flex flex-col items-center justify-center h-full transition-all duration-150 relative",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400/70 focus-visible:outline-offset-2 focus-visible:rounded-lg",
                  "min-h-[44px] min-w-[44px] touch-manipulation",
                  "pointer-events-auto",
                  "cursor-pointer",
                  active 
                    ? "text-white" 
                    : "text-white/70"
                )}
                style={{
                  pointerEvents: 'auto',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {/* iOS 17 Active State - Glowing indicator */}
                {active && (
                  <>
                    <div className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 w-14 h-1",
                      "bg-gradient-to-r from-blue-400 to-purple-500",
                      radius.full,
                      // replaced-by-ultra-polish
                      shadows.md
                    )} />
                    {/* Glowing dot indicator */}
                    <div className={cn(
                      "absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2",
                      "bg-purple-500 rounded-full",
                      // replaced-by-ultra-polish
                      shadows.sm, "animate-pulse"
                    )} />
                  </>
                )}
                
                <motion.div 
                  className={cn(
                    "relative flex items-center justify-center mb-1 transition-transform duration-150",
                    active && "scale-110"
                  )}
                  whileHover={window.innerWidth > 768 ? { scale: active ? 1.15 : 1.05 } : undefined}
                >
                  <Icon className={cn(
                    iconSizes.lg,
                    "transition-all duration-150",
                    // replaced-by-ultra-polish
                    active && "text-white", shadows.sm
                  )} />
                </motion.div>
                
                <span className={cn(
                  "text-[11px] md:text-[10px] font-semibold transition-all duration-200",
                  active && "text-white font-bold"
                )}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.div>
  );

  // Render using portal to ensure it's always at viewport level (not affected by parent containers)
  if (typeof window !== 'undefined') {
    return createPortal(bottomNavContent, document.body);
  }
  
  return bottomNavContent;
};

export default CreatorBottomNav;

