/**
 * Unified ListItem Component
 * 
 * Consistent list items across all pages using design system tokens
 */

import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spacing, typography, iconSizes, animations, radius, glass } from '@/lib/design-system';

interface ListItemProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  badge?: number | string;
  onClick?: () => void;
  isActive?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  badge,
  onClick,
  isActive = false,
  rightAction,
  className,
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-[14px] transition-all duration-200",
        spacing.cardPadding.tertiary,
        animations.cardPress,
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2",
        isActive
          ? "bg-[#1C2233]"
          : "hover:bg-[#1C2233]",
        className
      )}
      aria-label={onClick ? title : undefined}
      role={onClick ? 'button' : undefined}
    >
      {Icon && (
        <div 
          className={cn(
            "w-[22px] h-[22px] flex items-center justify-center rounded-full flex-shrink-0",
            iconColor ? `bg-[${iconColor}]26` : "bg-white/5"
          )}
          style={iconColor ? { backgroundColor: `${iconColor}26` } : undefined}
        >
          <Icon 
            className={iconSizes.md}
            style={iconColor ? { color: iconColor } : undefined}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0 text-left">
        <div className={cn(typography.body, isActive ? "text-white" : "text-white/90")}>
          {title}
        </div>
        {subtitle && (
          <div className={cn(typography.bodySmall, "mt-0.5")}>
            {subtitle}
          </div>
        )}
      </div>
      
      {badge && (
        <div className="flex-shrink-0 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
          {badge}
        </div>
      )}
      
      {rightAction || (onClick && (
        <ChevronRight className={cn(
          iconSizes.sm,
          "flex-shrink-0",
          isActive ? "text-white/60" : "text-white/30"
        )} />
      ))}
    </Component>
  );
};

