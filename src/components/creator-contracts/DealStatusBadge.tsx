"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DealStage, STAGE_LABELS } from '@/lib/hooks/useBrandDeals';

// Re-export DealStage for backward compatibility
export type { DealStage };

interface DealStatusBadgeProps {
  stage: DealStage;
  className?: string;
}

const DealStatusBadge: React.FC<DealStatusBadgeProps> = ({ stage, className }) => {
  const getStageConfig = (stage: DealStage) => {
    switch (stage) {
      case 'negotiation':
        return {
          label: 'Negotiation',
          shortLabel: 'Negotiation',
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        };
      case 'signed':
        return {
          label: 'Signed',
          shortLabel: 'Signed',
          className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        };
      case 'content_making':
        return {
          label: 'Content Making',
          shortLabel: 'Making',
          className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
      case 'content_delivered':
        return {
          label: 'Content Delivered',
          shortLabel: 'Delivered',
          className: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        };
      case 'completed':
        return {
          label: 'Completed',
          shortLabel: 'Done',
          className: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
      default:
        return {
          label: STAGE_LABELS[stage] || stage,
          shortLabel: STAGE_LABELS[stage] || stage,
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

