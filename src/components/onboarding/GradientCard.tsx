"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

/**
 * Standardized card component for onboarding
 * - Unified styling (rounded-xl, bg-white/10, backdrop-blur-xl)
 * - Consistent padding options
 * - Optional click handler
 */
export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  className,
  padding = 'md',
  onClick,
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl",
        // Background and style
        "bg-white dark:bg-white/10",
        "backdrop-blur-none dark:backdrop-blur-xl",
        "border border-slate-200 dark:border-white/10",
        "shadow-sm dark:shadow-none",
        "text-slate-900 dark:text-white",

        paddingClasses[padding],
        onClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/15 active:scale-95",
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
};

