/**
 * Unified SectionHeader Component
 * 
 * Consistent section headers across all pages using design system tokens
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { typography, spacing } from '@/lib/design-system';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={cn("flex items-center justify-between mb-4 md:mb-5", className)}>
      <div className="flex-1 min-w-0">
        <h2 className={cn(typography.h3, "mb-1")}>
          {title}
        </h2>
        {subtitle && (
          <p className={cn(typography.bodySmall, "mt-1")}>
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
  );
};

