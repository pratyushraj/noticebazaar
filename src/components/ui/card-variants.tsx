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
  onClick?: () => void;
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
        className
      )}
      onClick={onClick}
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
}

export const SectionCard = ({ 
  title, 
  subtitle, 
  icon, 
  action, 
  children, 
  variant = 'tertiary',
  className,
  ...props 
}: SectionCardProps) => {
  return (
    <BaseCard variant={variant} className={cn(spacing.card, className)} {...props}>
      {(title || icon || action) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
              {title && <h3 className={typography.h3}>{title}</h3>}
              {subtitle && <p className={typography.bodySmall + " mt-1"}>{subtitle}</p>}
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
  variant?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
}

export const StatCard = ({ 
  label, 
  value, 
  icon, 
  trend, 
  variant = 'tertiary',
  className 
}: StatCardProps) => {
  return (
    <BaseCard variant={variant} className={cn("text-center", className)}>
      {icon && (
        <div className="flex justify-center mb-2">
          <div className="p-2 rounded-xl bg-white/5">{icon}</div>
        </div>
      )}
      <div className={typography.label + " mb-1"}>{label}</div>
      <div className={typography.amount + " mb-1"}>
        {typeof value === 'number' ? `₹${(value / 1000).toFixed(0)}K` : value}
      </div>
      {trend && (
        <div className={cn(
          "text-xs font-medium mt-1",
          trend.isPositive ? "text-green-400" : "text-red-400"
        )}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </div>
      )}
    </BaseCard>
  );
};

interface ActionCardProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
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
  return (
    <BaseCard 
      variant={variant} 
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center cursor-pointer",
        className
      )}
      onClick={onClick}
      interactive
    >
      <div className="p-3 rounded-xl bg-white/5">{icon}</div>
      <span className={typography.bodySmall}>{label}</span>
    </BaseCard>
  );
};

