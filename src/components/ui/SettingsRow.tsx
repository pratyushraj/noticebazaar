/**
 * SettingsRow Component
 * 
 * Consistent settings rows with icon, label, value, and action
 */

import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spacing, typography, iconSizes, animations } from '@/lib/design-system';

interface SettingsRowProps {
  icon?: LucideIcon;
  label: string;
  value?: string;
  onClick?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  label,
  value,
  onClick,
  rightAction,
  className,
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl transition-all duration-150",
        spacing.cardPadding.tertiary,
        animations.cardPress,
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        onClick && "hover:bg-white/5",
        className
      )}
      aria-label={onClick ? label : undefined}
      role={onClick ? 'button' : undefined}
    >
      {Icon && (
        <Icon className={cn(iconSizes.md, "text-white/70 flex-shrink-0")} />
      )}
      
      <div className="flex-1 min-w-0 text-left">
        <div className={cn(typography.body)}>
          {label}
        </div>
        {value && (
          <div className={cn(typography.bodySmall, "mt-0.5")}>
            {value}
          </div>
        )}
      </div>
      
      {rightAction || (onClick && (
        <ChevronRight className={cn(iconSizes.sm, "text-white/30 flex-shrink-0")} />
      ))}
    </Component>
  );
};

