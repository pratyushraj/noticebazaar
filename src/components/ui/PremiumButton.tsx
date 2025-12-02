/**
 * PremiumButton Component
 * 
 * Unified premium button with frosted glass, gradients, haptics, and animations
 * iOS 17 + visionOS quality
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { radius, shadows, animations, iconSizes, typography, spacing } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  children,
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      triggerHaptic(HapticPatterns.light);
      onClick?.(e);
    }
  };

  const baseClasses = cn(
    "relative overflow-hidden",
    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70 focus-visible:outline-offset-2",
    "transition-all duration-150",
    radius.md,
    fullWidth && "w-full",
    disabled && "opacity-50 cursor-not-allowed"
  );

  const sizeClasses = {
    sm: cn(spacing.cardPadding.tertiary, typography.bodySmall, "min-h-[36px]"),
    md: cn("py-3 px-6", typography.body, "min-h-[44px]"),
    lg: cn("py-4 px-8", typography.h4, "min-h-[52px]"),
  };

  const variantClasses = {
    primary: cn(
      "bg-gradient-to-r from-[#6C4BFF] to-[#9A3DFF]",
      "text-white font-semibold",
      shadows.lg,
      "hover:shadow-xl hover:shadow-purple-500/20",
      "active:shadow-md"
    ),
    secondary: cn(
      "bg-white/5 backdrop-blur-xl border border-white/10",
      "text-white/90 hover:text-white",
      "hover:bg-white/10",
      shadows.md
    ),
    tertiary: cn(
      "text-white/60 hover:text-white/90",
      "hover:bg-white/5"
    ),
    glass: cn(
      "bg-white/5 backdrop-blur-2xl border border-white/10",
      "text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
      "hover:bg-white/10",
      shadows.depth
    ),
    danger: cn(
      "bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.25)]",
      "text-[#ff6b6b] hover:bg-[rgba(255,0,0,0.15)]",
      shadows.md
    ),
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileTap={disabled ? undefined : animations.microTap}
      whileHover={disabled ? undefined : (window.innerWidth > 768 ? animations.microHover : undefined)}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={typeof children === 'string' ? children : undefined}
      {...props}
    >
      {/* Spotlight gradient */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-50" />
      
      <span className="relative flex items-center justify-center gap-2">
        {Icon && iconPosition === 'left' && (
          <Icon className={cn(iconSizes.md, "flex-shrink-0")} />
        )}
        {children}
        {Icon && iconPosition === 'right' && (
          <Icon className={cn(iconSizes.md, "flex-shrink-0")} />
        )}
      </span>
    </motion.button>
  );
};

