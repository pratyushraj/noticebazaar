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
        "bg-card rounded-[12px] p-4 mb-3 border border-border/40 shadow-sm shadow-black/20 transition-all",
        "hover:bg-accent/10 hover:shadow-md cursor-pointer gap-3 flex flex-col",
        isOverdue && 'border-red-500/30 bg-red-500/5'
      )}
      onClick={() => onView(deal)}
    >
      {/* Brand Row: Logo + Name + Status pill (right side) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <BrandLogo 
            brandName={deal.brand_name} 
            brandLogo={null} 
            size="sm" 
            className="flex-shrink-0" 
          />
          <h3 className="text-sm font-semibold text-foreground truncate">
            {deal.brand_name}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <DealStatusBadge stage={stage} />
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

      {/* Amount - Right aligned, bigger & bold */}
      <div className="flex justify-end">
        <div className="text-xl font-bold text-foreground">
          ₹{deal.deal_amount.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Platform Section - Labels: text-[11px] uppercase, Values: text-sm */}
      <div>
        <div className="text-[11px] md:text-xs uppercase tracking-wide text-muted-foreground mb-1">Platform</div>
        <div className="text-sm text-foreground">{deal.platform || 'N/A'}</div>
      </div>

      {/* Deliverables Section - Pill badges */}
      <div>
        <div className="text-[11px] md:text-xs uppercase tracking-wide text-muted-foreground mb-2">Deliverables</div>
        <div className="flex flex-wrap gap-2">
          {deliverablesArray.slice(0, 3).map((item, index) => (
            <span 
              key={index}
              className="text-[11px] md:text-xs bg-muted px-2 py-1 rounded-full text-foreground border border-border/40"
            >
              {item}
            </span>
          ))}
          {deliverablesArray.length > 3 && (
            <span className="text-[11px] md:text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground border border-border/40">
              +{deliverablesArray.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Due Date Row - Date left, days-left badge right */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/30">
        <div className="text-sm text-foreground">
          {new Date(deal.payment_expected_date || deal.due_date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
        <Badge 
          variant={isOverdue ? 'destructive' : 'secondary'}
          className="text-[11px] md:text-xs px-2 py-1 whitespace-nowrap flex-shrink-0"
        >
          {dueDateStatus}
        </Badge>
      </div>
    </article>
  );
};

export default DealCard;
