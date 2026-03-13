"use client";

import { LayoutDashboard, Briefcase, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconSizes, animations, spotlight, shadows, radius } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { motion } from 'framer-motion';

type BrandBottomNavProps = {
  activeTab: 'pipeline' | 'creators' | 'analytics';
  onTabChange: (tab: 'pipeline' | 'creators' | 'analytics') => void;
  isDark?: boolean;
};

const BrandBottomNav = ({ activeTab, onTabChange, isDark = true }: BrandBottomNavProps) => {
  const navItems = [
    { id: 'pipeline' as const, label: 'Offers', icon: LayoutDashboard },
    { id: 'creators' as const, label: 'Collaborations', icon: Briefcase },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <motion.div
      data-bottom-nav="true"
      className={cn(
        "fixed bottom-0 left-0 right-0 md:hidden",
        "backdrop-blur-2xl",
        isDark ? "bg-white/5 border-t border-white/15" : "bg-white/85 border-t border-slate-200",
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
      <div className={cn("absolute inset-x-0 top-0 h-[1px]", isDark ? "bg-white/10" : "bg-slate-200")} />

      <nav
        className="flex justify-around h-14 md:h-12 items-center px-2 md:px-4 relative z-10 pointer-events-auto"
        style={{ paddingTop: '6px', paddingBottom: '6px' }}
        role="navigation"
        aria-label="Brand bottom navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl",
                "transition-all duration-200 ease-in-out",
                active
                  ? (isDark ? "bg-white/10 text-white" : "bg-slate-900 text-white")
                  : (isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")
              )}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                onTabChange(item.id);
              }}
            >
              <Icon className={cn(iconSizes.sm, active ? (isDark ? "text-white" : "text-white") : (isDark ? "text-white/60" : "text-slate-400"))} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                active ? (isDark ? "text-white" : "text-white") : (isDark ? "text-white/50" : "text-slate-500")
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
