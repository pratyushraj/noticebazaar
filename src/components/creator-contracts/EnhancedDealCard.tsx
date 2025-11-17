"use client";

import React from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from './BrandLogo';
import DealStatusBadge, { DealStage } from './DealStatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  IndianRupee, 
  Calendar, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Send,
  FileText,
  MessageSquare,
  ChevronRight,
  Instagram,
  Youtube,
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EnhancedDealCardProps {
  deal: BrandDeal;
  stage: DealStage;
  dueDateStatus: string;
  isOverdue: boolean;
  daysOverdue?: number;
  daysLeft?: number;
  onView: (deal: BrandDeal) => void;
  onEdit: (deal: BrandDeal) => void;
  onMarkPaid: (deal: BrandDeal) => void;
  onSendReminder?: (deal: BrandDeal) => void;
  onDelete: (deal: BrandDeal) => void;
  isDeleting?: boolean;
}

const EnhancedDealCard: React.FC<EnhancedDealCardProps> = ({
  deal,
  stage,
  dueDateStatus,
  isOverdue,
  daysOverdue,
  daysLeft,
  onView,
  onEdit,
  onMarkPaid,
  onSendReminder,
  onDelete,
  isDeleting,
}) => {
  // Handle deliverables array/string
  const deliverablesArray = Array.isArray(deal.deliverables) 
    ? deal.deliverables 
    : typeof deal.deliverables === 'string' 
      ? deal.deliverables.split(',').map(d => d.trim()).filter(Boolean)
      : [];

  // Calculate progress percentage
  const getProgressPercentage = (stage: DealStage): number => {
    switch (stage) {
      case 'draft': return 10;
      case 'active': return 40;
      case 'payment_pending': return 70;
      case 'paid': return 90;
      case 'completed': return 100;
      case 'overdue': return 70;
      default: return 0;
    }
  };

  const progress = getProgressPercentage(stage);

  // Get platform icon
  const getPlatformIcon = (platform: string | null) => {
    if (!platform) return null;
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('instagram')) return Instagram;
    if (platformLower.includes('youtube')) return Youtube;
    if (platformLower.includes('tiktok')) return Music;
    return null;
  };

  const PlatformIcon = getPlatformIcon(deal.platform);

  // Format deliverables for display
  const formatDeliverables = () => {
    if (deliverablesArray.length === 0) return [];
    
    // Mock deliverable statuses - in real app, this would come from the deal data
    return deliverablesArray.map((item, index) => {
      // Simple logic: first item delivered, others pending/overdue based on stage
      if (index === 0 && (stage === 'paid' || stage === 'completed')) {
        return { type: item, status: 'delivered', date: deal.payment_received_date || deal.due_date };
      }
      if (isOverdue && index > 0) {
        return { type: item, status: 'overdue', dueDate: deal.payment_expected_date };
      }
      return { type: item, status: 'pending', dueDate: deal.payment_expected_date };
    });
  };

  const formattedDeliverables = formatDeliverables();

  // Get status message
  const getStatusMessage = () => {
    if (stage === 'overdue' && daysOverdue) {
      return `Payment Pending (${daysOverdue} days overdue)`;
    }
    if (stage === 'payment_pending') {
      return 'Payment Pending';
    }
    if (stage === 'active') {
      return 'Content Creation Phase';
    }
    if (stage === 'completed') {
      return 'Completed';
    }
    if (stage === 'paid') {
      return 'Payment Received';
    }
    return 'Draft';
  };

  // Get next milestone
  const getNextMilestone = () => {
    if (stage === 'overdue' || stage === 'payment_pending') {
      return `Payment Due: ${new Date(deal.payment_expected_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
    }
    if (stage === 'active' && formattedDeliverables.length > 0) {
      const nextPending = formattedDeliverables.find(d => d.status === 'pending');
      if (nextPending && nextPending.dueDate) {
        return `Next: ${nextPending.type} (Due ${new Date(nextPending.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`;
      }
    }
    return null;
  };

  const nextMilestone = getNextMilestone();

  // Get urgency indicator
  const getUrgencyIndicator = () => {
    if (isOverdue && daysOverdue) {
      return { icon: AlertCircle, color: 'text-red-500', text: `${daysOverdue} days` };
    }
    if (daysLeft && daysLeft <= 3) {
      return { icon: Clock, color: 'text-yellow-500', text: `${daysLeft} days` };
    }
    return null;
  };

  const urgency = getUrgencyIndicator();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "bg-gradient-to-br from-card to-card/50 border rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group",
          isOverdue && 'border-red-500/30 bg-red-500/5'
        )}
        onClick={() => onView(deal)}
      >
        {/* Header: Brand Logo + Name + Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <BrandLogo 
              brandName={deal.brand_name} 
              brandLogo={null} 
              size="md" 
              className="flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground truncate">
                {deal.brand_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {PlatformIcon && (
                  <PlatformIcon className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {deal.platform || 'N/A'} Campaign
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <DealStatusBadge stage={stage} />
            {urgency && (
              <Badge 
                variant={isOverdue ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                <urgency.icon className={cn("w-3 h-3 mr-1", urgency.color)} />
                {urgency.text}
              </Badge>
            )}
          </div>
        </div>

        {/* Amount and Due Date Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="text-xl font-bold text-foreground">
                ₹{deal.deal_amount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">Due</div>
              <div className="text-sm font-medium text-foreground">
                {new Date(deal.payment_expected_date || deal.due_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Deliverables</span>
          </div>
          <div className="space-y-2">
            {formattedDeliverables.slice(0, 3).map((deliverable, index) => {
              const Icon = deliverable.status === 'delivered' 
                ? CheckCircle 
                : deliverable.status === 'overdue' 
                ? XCircle 
                : Clock;
              
              const iconColor = deliverable.status === 'delivered'
                ? 'text-green-500'
                : deliverable.status === 'overdue'
                ? 'text-red-500'
                : 'text-yellow-500';

              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Icon className={cn("w-4 h-4", iconColor)} />
                  <span className="text-foreground">
                    {deliverable.type}
                  </span>
                  {deliverable.status === 'delivered' && deliverable.date && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Delivered {new Date(deliverable.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {deliverable.status === 'pending' && deliverable.dueDate && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Due {new Date(deliverable.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
            {formattedDeliverables.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{formattedDeliverables.length - 3} more deliverables
              </div>
            )}
          </div>
        </div>

        {/* Status and Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Status: {getStatusMessage()}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className={cn(
                "h-full transition-all",
                stage === 'completed' ? 'bg-green-500' :
                stage === 'paid' ? 'bg-blue-500' :
                stage === 'payment_pending' ? 'bg-yellow-500' :
                stage === 'overdue' ? 'bg-red-500' :
                stage === 'active' ? 'bg-blue-400' :
                'bg-gray-400'
              )}
            />
          </div>
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border/40">
            <div className="text-xs text-muted-foreground mb-1">Next Milestone</div>
            <div className="text-sm font-medium text-foreground">{nextMilestone}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
          {stage === 'overdue' || stage === 'payment_pending' ? (
            <>
              {onSendReminder && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onSendReminder(deal)}
                  className="flex-1 min-w-[120px]"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Send Reminder
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkPaid(deal)}
                className="flex-1 min-w-[120px]"
              >
                Mark Paid
              </Button>
            </>
          ) : stage === 'active' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(deal)}
                className="flex-1 min-w-[120px]"
              >
                <FileText className="w-3 h-3 mr-1" />
                Upload Draft
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {}}
                className="flex-1 min-w-[120px]"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Chat
              </Button>
            </>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(deal)}
            className="flex-1 min-w-[120px]"
          >
            View Details
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedDealCard;

