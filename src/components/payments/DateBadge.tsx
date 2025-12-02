"use client";

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
      bg: 'bg-white/5',
      text: 'text-white/80',
      border: 'border-white/10',
      icon: 'text-white/80',
    },
    urgent: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-400/20',
      icon: 'text-amber-400',
    },
    overdue: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-400/20',
      icon: 'text-red-400',
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

