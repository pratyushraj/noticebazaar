"use client";

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconBubbleProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'green' | 'blue' | 'pink' | 'orange';
  animated?: boolean;
  animationProps?: MotionProps;
  className?: string;
}

/**
 * Standardized icon bubble component
 * - Consistent sizing (sm: 10, md: 12, lg: 16)
 * - Color variants with gradients
 * - Optional animations
 */
export const IconBubble: React.FC<IconBubbleProps> = ({
  icon: Icon,
  size = 'md',
  color = 'purple',
  animated = false,
  animationProps,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    purple: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400',
    green: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400',
    blue: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400',
    pink: 'bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-400',
    orange: 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-400',
  };

  const defaultAnimation: MotionProps = animated
    ? {
        animate: { y: [0, -10, 0] },
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      }
    : {};

  if (animated) {
    return (
      <motion.div
        {...defaultAnimation}
        {...animationProps}
        className={cn(
          sizeClasses[size],
          "rounded-full",
          "flex items-center justify-center",
          colorClasses[color],
          className
        )}
      >
        <Icon className={iconSizeClasses[size]} />
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-full",
        "flex items-center justify-center",
        colorClasses[color],
        className
      )}
    >
      <Icon className={iconSizeClasses[size]} />
    </div>
  );
};

