/**
 * Reusable Card Components with Consistent Design System
 */

import { cn } from '@/lib/utils';
import { cardVariants, spacing, typography } from '@/lib/design-system';
import { ReactNode } from 'react';

interface BaseCardProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
  children: ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  interactive?: boolean;
}

export const BaseCard = ({
  variant = 'tertiary',
  className,
  children,
  onClick,
  interactive = false
}: BaseCardProps) => {
  const variantStyles = cardVariants[variant];
  const baseClasses = `${variantStyles.base} ${variantStyles.padding} ${variantStyles.radius} ${variantStyles.shadow} ${variantStyles.backdrop}`;

  return (
    <div
      className={cn(
        baseClasses,
        interactive && "cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
        onClick && "pointer-events-auto",
        className
      )}
      onClick={(e) => {
        if (onClick) {
          // Check if the click was on a button or an interactive child
          const target = e.target as HTMLElement;
          if (target.closest('button')) {
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          onClick(e);
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
};

interface SectionCardProps extends BaseCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  theme?: 'dark' | 'light';
}

export const SectionCard = ({
  title,
  subtitle,
  icon,
  action,
  children,
  variant = 'tertiary',
  className,
  theme = 'dark',
  ...props
}: SectionCardProps) => {
  const titleClass =
    theme === 'light'
      ? "text-lg md:text-xl font-semibold text-muted-foreground"
      : typography.h3;
  const subtitleClass =
    theme === 'light'
      ? "text-xs md:text-sm text-muted-foreground mt-1"
      : (typography.bodySmall + " mt-1");

  return (
    <BaseCard variant={variant} className={cn(spacing.card, className)} {...props}>
      {(title || icon || action) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
              {title && <h3 className={titleClass}>{title}</h3>}
              {subtitle && <p className={subtitleClass}>{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </BaseCard>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string; // Additional info text below value (e.g., "+3 this month", "Across all deals")
  variant?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
  isEmpty?: boolean; // When value is 0, show placeholder text
  showAffordance?: boolean; // Show chevron to indicate tappable
  theme?: 'dark' | 'light';
}

export const StatCard = ({
  label,
  value,
  icon,
  trend,
  subtitle,
  variant = 'tertiary',
  className,
  isEmpty = false,
  showAffordance = false,
  theme = 'dark',
}: StatCardProps) => {
  const displayValue = isEmpty
    ? (label === 'Total Value' ? '₹0' : '0')
    : (typeof value === 'number' ? (label === 'Total Value' ? `₹${value.toLocaleString('en-IN')}` : value.toLocaleString('en-IN')) : value);

  return (
    <BaseCard variant={variant} className={cn(
      "text-left flex flex-col justify-between",
      "min-w-0 w-full px-2.5 py-2.5 md:px-4 md:py-4",
      theme === 'light'
        ? "bg-card border border-border shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        : "border border-border shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
      "scale-[0.96] sm:scale-100",
      className
    )}>
      {/* Icon at top */}
      {icon && (
        <div className="flex items-center mb-2 md:mb-3">
          <div className={cn(
            "w-9 h-9 md:w-10 md:h-10 p-2 rounded-xl flex items-center justify-center",
            theme === 'light' ? "bg-background" : "bg-card"
          )}>{icon}</div>
        </div>
      )}

      {/* Label */}
      <div className={cn(
        "text-xs md:text-sm tracking-wide opacity-80 mb-1 md:mb-2",
        theme === 'light' ? "text-muted-foreground" : "text-foreground/80"
      )}>{label}</div>

      {/* Large Value */}
      <div className={cn(
        "text-2xl md:text-3xl font-semibold mb-1 md:mb-2",
        theme === 'light' ? "text-muted-foreground" : "text-foreground"
      )}>
        {displayValue}
      </div>

      {/* Subtitle or Trend - Show on second line */}
      <div className="flex items-center justify-between">
        {subtitle ? (
          <div className={cn(
            "text-xs md:text-sm font-medium leading-relaxed",
            isEmpty
              ? (theme === 'light' ? "text-muted-foreground" : "text-foreground/60")
              : (trend?.isPositive ? "text-green-500" : (theme === 'light' ? "text-muted-foreground" : "text-foreground/70"))
          )}>
            {subtitle}
          </div>
        ) : trend && (
          <div className={cn(
            "text-xs md:text-sm font-medium",
            trend.isPositive ? "text-green-500" : "text-destructive"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
        {showAffordance && (
          <span className={cn(
            "text-lg leading-none ml-auto",
            theme === 'light' ? "text-muted-foreground" : "text-secondary/60"
          )}>›</span>
        )}
      </div>
    </BaseCard>
  );
};

interface ActionCardProps {
  icon: ReactNode;
  label: string;
  onClick: (e?: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
}

export const ActionCard = ({
  icon,
  label,
  onClick,
  variant = 'tertiary',
  className
}: ActionCardProps) => {
  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (import.meta.env.DEV) {
      console.log('[ActionCard] Clicked:', label);
    }
    onClick(e);
  };

  return (
    <BaseCard
      variant={variant}
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center cursor-pointer",
        "pointer-events-auto",
        className
      )}
      onClick={handleClick}
      interactive
    >
      <div className="p-3 rounded-xl bg-card pointer-events-none">{icon}</div>
      <span className={cn(typography.bodySmall, "pointer-events-none")}>{label}</span>
    </BaseCard>
  );
};
