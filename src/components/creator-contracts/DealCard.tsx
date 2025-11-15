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
  // Handle deliverables array/string
  const deliverablesArray = Array.isArray(deal.deliverables) 
    ? deal.deliverables 
    : typeof deal.deliverables === 'string' 
      ? deal.deliverables.split(',').map(d => d.trim()).filter(Boolean)
      : [];

  return (
    <article
      className={cn(
        "bg-card rounded-[12px] p-4 mb-3 border border-border/40 shadow-sm transition-all",
        "hover:bg-accent/10 hover:shadow-md cursor-pointer gap-3 flex flex-col",
        isOverdue && 'border-red-500/30 bg-red-500/5'
      )}
      onClick={() => onView(deal)}
    >
      {/* Top Row: Brand + Status + Amount */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <BrandLogo 
            brandName={deal.brand_name} 
            brandLogo={null} 
            size="sm" 
            className="flex-shrink-0" 
          />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {deal.brand_name}
            </h3>
            <DealStatusBadge stage={stage} />
          </div>
        </div>
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
          <div className="text-lg md:text-xl font-semibold text-foreground">
            ₹{deal.deal_amount.toLocaleString('en-IN')}
          </div>
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

      {/* Platform Section - Labels: text-[10px], Values: text-sm */}
      <div className="mt-0">
        <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1">Platform</div>
        <div className="text-sm text-foreground">{deal.platform || 'N/A'}</div>
      </div>

      {/* Deliverables Section - Small badge/pill chips */}
      <div className="mt-0">
        <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide mb-2">Deliverables</div>
        <div className="flex flex-wrap gap-2">
          {deliverablesArray.slice(0, 3).map((item, index) => (
            <span 
              key={index}
              className="text-[10px] md:text-xs bg-muted px-2 py-[3px] rounded-full text-foreground border border-border/40"
            >
              {item}
            </span>
          ))}
          {deliverablesArray.length > 3 && (
            <span className="text-[10px] md:text-xs bg-muted px-2 py-[3px] rounded-full text-muted-foreground border border-border/40">
              +{deliverablesArray.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Due Date Section - date left, days-left badge right, compact */}
      <div className="mt-0 flex items-center justify-between gap-3 pt-3 border-t border-border/30">
        <div className="text-sm text-foreground">
          {new Date(deal.payment_expected_date || deal.due_date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
        <Badge 
          variant={isOverdue ? 'destructive' : 'secondary'}
          className="text-[10px] md:text-xs px-2 py-1 whitespace-nowrap flex-shrink-0"
        >
          {dueDateStatus}
        </Badge>
      </div>
    </article>
  );
};

export default DealCard;
