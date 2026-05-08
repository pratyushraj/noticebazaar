

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingContainerProps {
  children: React.ReactNode;
  className?: string;
  theme?: 'light' | 'dark';
  allowScroll?: boolean;
}

/**
 * Main container for onboarding flow
 * - iOS 17 optimized viewport (h-[100dvh])
 * - Safe area handling (Tailwind classes)
 * - Unified gradient background
 * - Prevents bounce overscroll
 * - Disables body scroll
 * - Hidden scrollbar
 * - No keyboard shifting
 */
export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  children,
  className,
  theme,
  allowScroll = false,
}) => {
  // Lock body scroll on mount, unlock on unmount
  useEffect(() => {
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    const originalPosition = window.getComputedStyle(document.body).position;

    // Prevent body scroll - container handles its own scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Prevent iOS Safari bounce
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.overscrollBehavior = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 w-full h-[100dvh] min-h-[100dvh] max-h-[100dvh]",

        // Background
        theme === 'dark'
          ? "bg-[#020D0A] text-foreground"
          : "bg-white text-slate-900",

        // Layout
        "flex flex-col",
        "relative",

        // Safe area insets (Tailwind classes)
        "pt-[max(24px,env(safe-area-inset-top,24px))]",
        "pb-[max(24px,env(safe-area-inset-bottom,24px))]",
        "pl-[env(safe-area-inset-left,0px)]",
        "pr-[env(safe-area-inset-right,0px)]",

        // Prevent bounce overscroll
        "overscroll-none",
        "touch-pan-y",

        allowScroll ? "overflow-y-auto" : "overflow-hidden",

        className
      )}
    >
      {children}
    </div>
  );
};
