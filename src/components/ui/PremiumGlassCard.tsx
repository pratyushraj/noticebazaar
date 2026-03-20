/**
 * PremiumGlassCard Component
 * 
 * Premium frosted glass card with iOS-style polish
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { glass, radius, shadows, spacing } from '@/lib/design-system';

interface PremiumGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'strong' | 'subtle';
  padding?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const PremiumGlassCard: React.FC<PremiumGlassCardProps> = ({
  variant = 'base',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const glassClass = variant === 'strong' ? glass.strong : variant === 'subtle' ? glass.subtle : glass.base;
  const paddingClass = padding === 'sm' ? spacing.cardPadding.tertiary : padding === 'lg' ? spacing.cardPadding.primary : spacing.cardPadding.secondary;

  return (
    <div
      className={cn(
        glassClass,
        radius.lg,
        shadows.card,
        paddingClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

