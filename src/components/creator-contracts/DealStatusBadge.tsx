"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DealStage } from '@/lib/hooks/useBrandDeals';
import { getStageDisplay } from '@/lib/constants/dealStatusFlow';

// Re-export DealStage for backward compatibility
export type { DealStage };

interface DealStatusBadgeProps {
  stage: DealStage;
  className?: string;
  /** Optional: show helper text below badge (e.g. on deal cards) */
  showHelperText?: boolean;
  dealType?: 'paid' | 'barter' | null;
}

const DealStatusBadge: React.FC<DealStatusBadgeProps> = ({ stage, className, showHelperText, dealType }) => {
  const config = getStageDisplay(stage);
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap inline-flex w-fit",
        config.colorClass,
        className
      )}
      title={config.label}
    >
      <span className="hidden md:inline">{config.label}</span>
      <span className="md:hidden">{config.shortLabel}</span>
    </Badge>
  );

  if (showHelperText && config.helperText) {
    const helper = dealType === 'barter' && config.helperTextBarter ? config.helperTextBarter : dealType === 'paid' && config.helperTextPaid ? config.helperTextPaid : config.helperText;
    return (
      <span className="inline-flex flex-col gap-0.5">
        {badge}
        <span className="text-[11px] text-white/55 leading-tight">{helper}</span>
      </span>
    );
  }
  return badge;
};

export default DealStatusBadge;

