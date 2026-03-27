"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Mobile-optimized wrapper component
 * Ensures touch targets are at least 44x44px and adds proper spacing
 */
export function MobileOptimized({ 
  children, 
  className,
  minTouchTarget = true 
}: { 
  children: React.ReactNode; 
  className?: string;
  minTouchTarget?: boolean;
}) {
  return (
    <div
      className={cn(
        minTouchTarget && "min-h-[44px] min-w-[44px]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Hook to detect if user is on mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

