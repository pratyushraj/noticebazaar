"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  showBackIcon?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

/**
 * Secondary action button for onboarding
 * - Standardized styling (white/10 background)
 * - Consistent padding (px-6 py-3)
 * - Optional back arrow icon
 * - iOS 17 style with proper tap targets
 */
export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  onClick,
  disabled = false,
  showBackIcon = false,
  className,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-6 py-3",
        "bg-white/10 hover:bg-white/15",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "rounded-xl",
        "font-medium",
        "transition-all duration-200",
        "flex items-center justify-center gap-2",
        "min-h-[44px]", // iOS tap target
        "active:scale-95",
        className
      )}
      aria-label={typeof children === 'string' ? children : 'Back'}
    >
      {showBackIcon && <ArrowLeft className="w-5 h-5" />}
      {children}
    </button>
  );
};

