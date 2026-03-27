/**
 * DangerZoneCard Component
 * 
 * Consistent danger zone styling for destructive actions
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseCard } from '@/components/ui/card-variants';
import { spacing, typography, iconSizes, buttons } from '@/lib/design-system';

interface DangerZoneCardProps {
  title: string;
  description: string;
  action: {
    label: string;
    onClick: () => void;
    variant?: 'danger' | 'warning';
  };
  className?: string;
}

export const DangerZoneCard: React.FC<DangerZoneCardProps> = ({
  title,
  description,
  action,
  className,
}) => {
  return (
    <BaseCard
      variant="secondary"
      className={cn(
        "border-red-500/30 bg-red-500/5",
        spacing.cardPadding.secondary,
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className={cn(iconSizes.md, "text-red-400 flex-shrink-0 mt-0.5")} />
        <div className="flex-1 min-w-0">
          <h3 className={cn(typography.h4, "mb-1")}>
            {title}
          </h3>
          <p className={cn(typography.bodySmall)}>
            {description}
          </p>
        </div>
      </div>
      
      <button
        onClick={action.onClick}
        className={cn(
          "w-full rounded-xl transition-all duration-150",
          spacing.cardPadding.tertiary,
          "bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.25)]",
          "text-[#ff6b6b] hover:bg-[rgba(255,0,0,0.15)]",
          "active:scale-[0.97]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
        )}
      >
        {action.label}
      </button>
    </BaseCard>
  );
};

