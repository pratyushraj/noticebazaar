"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DealStage = 'draft' | 'active' | 'payment_pending' | 'paid' | 'overdue' | 'completed';

interface DealStatusBadgeProps {
  stage: DealStage;
  className?: string;
}

const DealStatusBadge: React.FC<DealStatusBadgeProps> = ({ stage, className }) => {
  const getStageConfig = (stage: DealStage) => {
    switch (stage) {
      case 'draft':
        return {
          label: 'Draft',
          shortLabel: 'Draft',
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        };
      case 'active':
        return {
          label: 'Active',
          shortLabel: 'Active',
          className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        };
      case 'payment_pending':
        return {
          label: 'Payment Pending',
          shortLabel: 'Pending',
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        };
      case 'paid':
        return {
          label: 'Paid',
          shortLabel: 'Paid',
          className: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
      case 'overdue':
        return {
          label: 'Overdue',
          shortLabel: 'Overdue',
          className: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
      case 'completed':
        return {
          label: 'Completed',
          shortLabel: 'Done',
          className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
      default:
        return {
          label: stage,
          shortLabel: stage,
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        };
    }
  };

  const config = getStageConfig(stage);

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap inline-flex",
        config.className,
        className
      )}
      title={config.label}
    >
      <span className="hidden md:inline">{config.label}</span>
      <span className="md:hidden">{config.shortLabel}</span>
    </Badge>
  );
};

export default DealStatusBadge;

