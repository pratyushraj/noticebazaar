"use client";

import React from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from './BrandLogo';
import DealStatusBadge, { DealStage } from './DealStatusBadge';
import DeliverablesBadge from './DeliverablesBadge';
import DealActionsMenu from './DealActionsMenu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: BrandDeal;
  stage: DealStage;
  dueDateStatus: string;
  isOverdue: boolean;
  onView: (deal: BrandDeal) => void;
  onEdit: (deal: BrandDeal) => void;
  onMarkPaid: (deal: BrandDeal) => void;
  onDelete: (deal: BrandDeal) => void;
  isDeleting?: boolean;
}

const DealCard: React.FC<DealCardProps> = ({
  deal,
  stage,
  dueDateStatus,
  isOverdue,
  onView,
  onEdit,
  onMarkPaid,
  onDelete,
  isDeleting,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-3 rounded-xl border w-full cursor-pointer transition-all",
        "bg-card border-border/40 hover:bg-accent/10 hover:shadow-md",
        isOverdue && 'border-red-500/30 bg-red-500/5'
      )}
      onClick={() => onView(deal)}
    >
      {/* Top Row: Brand Name + Status + Actions Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <BrandLogo 
            brandName={deal.brand_name} 
            brandLogo={null} 
            size="md" 
            className="flex-shrink-0" 
          />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {/* Brand Name - Bold, Bigger */}
            <h3 className="font-bold text-lg text-foreground leading-tight truncate">
              {deal.brand_name}
            </h3>
            {/* Amount - Directly under brand */}
            <span className="text-xl font-semibold text-foreground">
              ₹{deal.deal_amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          {/* Status Badge - Right Top */}
          <DealStatusBadge stage={stage} />
          {/* Actions Menu */}
          <div onClick={(e) => e.stopPropagation()}>
            <DealActionsMenu
              deal={deal}
              onView={onView}
              onEdit={onEdit}
              onMarkPaid={onMarkPaid}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </div>

      {/* Platform Section */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">PLATFORM</span>
        <span className="text-sm text-foreground">{deal.platform || 'N/A'}</span>
      </div>

      {/* Deliverables Section - Reduced text size */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">DELIVERABLES</span>
        <div className="text-xs">
          <DeliverablesBadge deliverables={deal.deliverables} maxDisplay={3} />
        </div>
      </div>

      {/* Subtle Separator Line */}
      <div className="border-t border-border/30 my-1" />

      {/* Due Date Section - Bottom Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">DUE DATE</span>
          <span className="text-xs text-foreground">
            {new Date(deal.payment_expected_date || deal.due_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        {/* Due Date Status - Right Bottom */}
        <Badge 
          variant={isOverdue ? 'destructive' : 'secondary'}
          className="text-[10px] px-2 py-0.5 whitespace-nowrap flex-shrink-0"
        >
          {dueDateStatus}
        </Badge>
      </div>
    </div>
  );
};

export default DealCard;
