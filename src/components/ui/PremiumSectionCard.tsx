/**
 * PremiumSectionCard Component
 * 
 * Consistent section cards with header and content
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { BaseCard } from '@/components/ui/card-variants';
import { spacing, typography, separators } from '@/lib/design-system';

interface PremiumSectionCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  showDivider?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const PremiumSectionCard: React.FC<PremiumSectionCardProps> = ({
  title,
  subtitle,
  action,
  variant = 'secondary',
  showDivider = false,
  children,
  className,
}) => {
  return (
    <BaseCard variant={variant} className={className}>
      {(title || subtitle || action) && (
        <>
          <div className={cn("flex items-center justify-between mb-4")}>
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className={cn(typography.h4, "mb-1")}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={cn(typography.bodySmall)}>
                  {subtitle}
                </p>
              )}
            </div>
            {action && (
              <div className="flex-shrink-0 ml-4">
                {action}
              </div>
            )}
          </div>
          {showDivider && <div className={separators.card} />}
        </>
      )}
      {children}
    </BaseCard>
  );
};

