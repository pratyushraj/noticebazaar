"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Skip button for onboarding screens
 * - Positioned top-right
 * - Subtle styling
 */
export const SkipButton: React.FC<SkipButtonProps> = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute z-50",
        "px-4 py-2",
        "text-sm",
        "text-white/70 hover:text-white",
        "transition-colors duration-200",
        "min-h-[44px] min-w-[44px]",
        "active:scale-95",
        // Mobile: Account for safe area + extra space, Desktop: standard spacing
        "top-[max(60px,calc(env(safe-area-inset-top,0px)+36px))]",
        "right-4 md:right-6",
        "md:top-6",
        className
      )}
      aria-label="Skip onboarding"
    >
      Skip
    </button>
  );
};

