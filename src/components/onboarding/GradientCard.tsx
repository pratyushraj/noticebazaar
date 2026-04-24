

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
 * - Unified styling (rounded-xl, bg-secondary/50, backdrop-blur-xl)
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
        "bg-card dark:bg-secondary/50",
        "backdrop-blur-none dark:backdrop-blur-xl",
        "border border-border dark:border-border",
        "shadow-sm dark:shadow-none",
        "text-muted-foreground dark:text-foreground",

        paddingClasses[padding],
        onClick && "cursor-pointer hover:bg-background dark:hover:bg-secondary/15 active:scale-95",
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
};

