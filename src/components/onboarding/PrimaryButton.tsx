"use client";

import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}

/**
 * Primary action button for onboarding
 * - Standardized gradient (purple to indigo)
 * - Consistent padding (px-6 py-3)
 * - Loading state support
 * - iOS 17 style with proper tap targets
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  icon,
  className,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "bg-blue-600 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600",
        "hover:bg-blue-500 dark:hover:from-purple-500 dark:hover:to-indigo-500",
        "text-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "px-6 py-3",
        "rounded-xl",
        "font-semibold",
        "transition-all duration-200",
        "flex items-center justify-center gap-2",
        "min-h-[44px]", // iOS tap target
        "active:scale-95",
        "shadow-lg hover:shadow-xl",
        className
      )}
      aria-label={typeof children === 'string' ? children : 'Continue'}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {children}
          {icon || <ArrowRight className="w-5 h-5" />}
        </>
      )}
    </button>
  );
};

