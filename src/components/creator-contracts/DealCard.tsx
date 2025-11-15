"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card
      className={cn(
        "bg-card border-border/50 cursor-pointer hover:bg-accent/20 transition-colors",
        isOverdue && 'border-red-500/30 bg-red-500/5'
      )}
      onClick={() => onView(deal)}
    >
      <CardContent className="p-4">
        {/* Header: Brand Logo + Name + Actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <BrandLogo brandName={deal.brand_name} brandLogo={null} size="md" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-base leading-tight mb-1.5">{deal.brand_name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <DealStatusBadge stage={stage} />
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5 whitespace-nowrap">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
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

        {/* Amount */}
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <span className="text-xl font-bold text-foreground">
            ₹{deal.deal_amount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Platform */}
        {deal.platform && (
          <div className="mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Platform</span>
            <div className="mt-1">
              <span className="text-sm font-medium text-foreground">{deal.platform}</span>
            </div>
          </div>
        )}

        {/* Deliverables */}
        <div className="mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">Deliverables</span>
          <DeliverablesBadge deliverables={deal.deliverables} maxDisplay={3} />
        </div>

        {/* Due Date Status */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Due Date</span>
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
      </CardContent>
    </Card>
  );
};

export default DealCard;

