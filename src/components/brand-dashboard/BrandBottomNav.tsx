"use client";

import { LayoutDashboard, Briefcase, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconSizes, animations, spotlight, shadows, radius } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const BrandBottomNav: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'pipeline' as const, label: 'Offers', icon: LayoutDashboard, path: '/brand-dashboard' },
    { id: 'creators' as const, label: 'Find Creators', icon: Briefcase, path: '/brand-discover' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <motion.div
      data-bottom-nav="true"
      className={cn(
        "fixed bottom-0 left-0 right-0 xl:hidden",
        "backdrop-blur-2xl",
        isDark ? "bg-[#0D0F1A]/90 border-t border-border" : "bg-secondary/85 border-t border-border",
        shadows.depth,
        radius.xl,
        "progressive-blur transition-transform duration-300 ease-in-out",
        "pointer-events-auto"
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
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      <div className={cn(spotlight.top, isDark ? "opacity-50" : "opacity-0")} />
      <div className={cn("absolute inset-x-0 top-0 h-[1px]", isDark ? "bg-secondary/50" : "bg-background")} />

      <nav
        className="flex justify-around h-[54px] items-center px-2 md:px-4 relative z-10 pointer-events-auto"
        style={{ paddingTop: '6px', paddingBottom: '6px' }}
        role="navigation"
        aria-label="Brand bottom navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.id}
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl min-w-[64px]",
                "transition-all duration-200 ease-in-out",
                active
                  ? (isDark ? "bg-secondary/20 text-secondary" : "bg-background text-foreground")
                  : (isDark ? "text-foreground/50 hover:text-foreground hover:bg-card" : "text-muted-foreground hover:text-muted-foreground hover:bg-background")
              )}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                navigate(item.path);
              }}
            >
              <Icon className={cn(iconSizes.sm, active ? (isDark ? "text-secondary" : "text-foreground") : (isDark ? "text-foreground/60" : "text-muted-foreground"))} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider",
                active ? (isDark ? "text-secondary" : "text-foreground") : (isDark ? "text-foreground/50" : "text-muted-foreground")
              )}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </motion.div>
  );
};

export default BrandBottomNav;
