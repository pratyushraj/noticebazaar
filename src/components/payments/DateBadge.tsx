

import React from 'react';
import { Calendar } from 'lucide-react';

interface DateBadgeProps {
  date: string;
  variant?: 'default' | 'urgent' | 'overdue';
  className?: string;
}

export const DateBadge: React.FC<DateBadgeProps> = ({ 
  date, 
  variant = 'default',
  className = '' 
}) => {
  const variantConfig = {
    default: {
      bg: 'bg-card',
      text: 'text-foreground/80',
      border: 'border-border',
      icon: 'text-foreground/80',
    },
    urgent: {
      bg: 'bg-warning/20',
      text: 'text-warning',
      border: 'border-warning/20',
      icon: 'text-warning',
    },
    overdue: {
      bg: 'bg-destructive/20',
      text: 'text-destructive',
      border: 'border-destructive/20',
      icon: 'text-destructive',
    },
  };

  const config = variantConfig[variant];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg} ${config.border} ${className}`}>
      <Calendar className={`w-4 h-4 ${config.icon}`} />
      <span className={`text-sm font-medium ${config.text}`}>{date}</span>
    </div>
  );
};

