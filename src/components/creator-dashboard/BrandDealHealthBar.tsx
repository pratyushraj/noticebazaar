"use client";

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type HealthStatus = 'clear' | 'warning' | 'critical' | 'pending';

interface BrandDealHealthBarProps {
  status: HealthStatus;
  label?: string;
  showIcon?: boolean;
}

const BrandDealHealthBar: React.FC<BrandDealHealthBarProps> = ({
  status,
  label,
  showIcon = true,
}) => {
  const getStatusConfig = (status: HealthStatus) => {
    switch (status) {
      case 'clear':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          text: 'All clear',
          emoji: '🟢',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          text: 'Invoice pending',
          emoji: '🟡',
        };
      case 'critical':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          text: label === 'overdue' ? 'Overdue payment' : label === 'contract' ? 'Contract missing' : 'Critical',
          emoji: '🔴',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          text: 'Pending',
          emoji: '🔵',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
        config.bgColor,
        config.borderColor,
        config.color
      )}
    >
      {showIcon && (
        <>
          <span className="text-base">{config.emoji}</span>
          {Icon && <Icon className="h-3 w-3" />}
        </>
      )}
      <span>{label || config.text}</span>
    </div>
  );
};

export default BrandDealHealthBar;
