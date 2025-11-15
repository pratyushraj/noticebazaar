"use client";

import React from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from './BrandLogo';
import DealStatusBadge, { DealStage } from './DealStatusBadge';
import DeliverablesBadge from './DeliverablesBadge';
import DealActionsMenu from './DealActionsMenu';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';
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
        "flex flex-col gap-y-3 py-4 px-4 rounded-xl shadow-sm border w-full cursor-pointer transition-colors",
        "bg-card border-border/50 hover:bg-accent/20",
        isOverdue && 'border-red-500/30 bg-red-500/5'
      )}
      onClick={() => onView(deal)}
    >
      {/* Top row: Brand icon + Brand name + Kebab menu */}
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <BrandLogo brandName={deal.brand_name} brandLogo={null} size="md" className="flex-shrink-0" />
          <h3 className="font-semibold text-foreground text-base leading-tight truncate flex-1">
            {deal.brand_name}
          </h3>
        </div>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {/* Amount row */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-foreground">
          ₹{deal.deal_amount.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Platform section */}
      {deal.platform && (
        <div className="flex flex-col gap-y-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">PLATFORM</span>
          <span className="text-sm font-medium text-foreground">{deal.platform}</span>
        </div>
      )}

      {/* Deliverables section */}
      <div className="flex flex-col gap-y-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">DELIVERABLES</span>
        <DeliverablesBadge deliverables={deal.deliverables} maxDisplay={3} />
      </div>

      {/* Due Date section */}
      <div className="flex items-start justify-between gap-3 pt-2 border-t border-border/50">
        <div className="flex flex-col gap-y-1 flex-1 min-w-0">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">DUE DATE</span>
          <span className="text-sm font-medium text-foreground">
            {new Date(deal.payment_expected_date || deal.due_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <Badge 
          variant={isOverdue ? 'destructive' : 'secondary'}
          className="text-xs px-2.5 py-1 whitespace-nowrap flex-shrink-0"
        >
          {dueDateStatus}
        </Badge>
      </div>
    </div>
  );
};

export default DealCard;

