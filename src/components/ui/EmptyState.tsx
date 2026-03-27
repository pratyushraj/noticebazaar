/**
 * Unified EmptyState Component
 * 
 * Consistent empty states across all pages using design system tokens
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseCard } from '@/components/ui/card-variants';
import { typography, spacing, iconSizes, buttons } from '@/lib/design-system';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <BaseCard
      variant="secondary"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        spacing.cardPadding.secondary,
        "min-h-[200px]",
        className
      )}
    >
      {Icon && (
        <div className={cn(
          "w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4",
          "border border-white/10"
        )}>
          <Icon className={cn(iconSizes.xl, "text-white/50")} />
        </div>
      )}
      
      <h3 className={cn(typography.h4, "mb-2")}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(typography.bodySmall, "mb-6 max-w-md")}>
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className={cn(buttons.primary, "min-w-[120px]")}
        >
          {action.label}
        </button>
      )}
    </BaseCard>
  );
};
