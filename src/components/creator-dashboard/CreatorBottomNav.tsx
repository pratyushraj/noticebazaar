"use client";

import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Wallet, Link2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconSizes, animations, spotlight, shadows, radius } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { motion } from 'framer-motion';
import { useKeyboardAware } from '@/hooks/useKeyboardAware';

const CreatorBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isKeyboardVisible: isKeyboardOpen } = useKeyboardAware();

  // Use centralized haptic utility

  // iOS-style: 4-5 main tabs max
  const navItems: Array<{
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    matchPaths: string[];
    onClick?: (e: React.MouseEvent) => void;
  }> = [
      {
        to: "/creator-dashboard",
        icon: LayoutDashboard,
        label: "Home",
        matchPaths: ["/creator-dashboard"]
      },
      {
        to: "/creator-dashboard?tab=collabs",
        icon: Briefcase,
        label: "Deals",
        matchPaths: ["/creator-contracts", "/contract-upload", "/contract-protection", "tab=collabs"]
      },
      {
        to: "/creator-dashboard?tab=payments",
        icon: Wallet,
        label: "Payments",
        matchPaths: ["/creator-payments", "/insights", "tab=payments"]
      },
      {
        to: "/creator-dashboard?tab=collab",
        icon: Link2,
        label: "Collab",
        matchPaths: ["/creator-collab", "tab=collab"]
      },
      {
        to: "/creator-dashboard?tab=profile",
        icon: User,
        label: "Profile",
        matchPaths: ["/creator-profile", "tab=profile"]
      },
    ];

  const isActive = (item: typeof navItems[0]) => {
    // Check path or query search params
    return item.matchPaths.some(path =>
      location.pathname.startsWith(path) ||
      location.search.includes(path)
    );
  };

  const bottomNavContent = (
    <motion.div
      data-bottom-nav="true"
      className={cn(
        "fixed bottom-0 left-0 right-0",
        // Translucent background so purple gradient shows through
        "bg-card backdrop-blur-2xl",
        "border-t border-border",
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
        zIndex: 9999,
        width: '100%',
        maxWidth: '100vw',
        pointerEvents: 'auto',
        // Pad the inside for the iPhone home indicator
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {/* Spotlight gradient at top */}
      <div className={cn(spotlight.top, "opacity-50")} />

      {/* Inner border for depth */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-secondary/50" />

      <nav
        className="flex justify-around h-14 md:h-12 items-center px-2 md:px-4 relative z-10 pointer-events-auto"
        style={{
          paddingTop: '6px',
          paddingBottom: '6px',
          // Remove hardcoded minHeight - let height class handle it
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
            // Handle custom onClick if provided (e.g., for Collab scroll)
            if (item.onClick) {
              e.preventDefault();
              item.onClick(e);
              return;
            }
            // Otherwise let Link component handle navigation naturally
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
                    ? "text-foreground"
                    : "text-foreground/70"
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
                      "bg-gradient-to-r from-blue-600 to-indigo-600",
                      radius.full,
                      shadows.md
                    )} />
                    <div className={cn(
                      "absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2",
                      "bg-info rounded-full",
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
                    active && "text-foreground", shadows.sm
                  )} />
                </motion.div>

                <span className={cn(
                  "text-[11px] md:text-[10px] font-semibold transition-all duration-200",
                  active && "text-foreground font-bold"
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
