

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
    purple: 'bg-primary dark:bg-primary/20 text-primary dark:text-primary',
    green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
    blue: 'bg-info dark:bg-info/20 text-info dark:text-info',
    pink: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
    orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
  };

  const defaultAnimation: MotionProps = animated
    ? {
      animate: { y: [0, -6, 0] }, // Reduced from -10 to -6 to prevent overlap
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
