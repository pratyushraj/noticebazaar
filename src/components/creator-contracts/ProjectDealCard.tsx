"use client";

import React from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from './BrandLogo';
import DealStatusBadge, { DealStage, PaymentStatus } from './DealStatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Calendar, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText,
  MessageSquare,
  Upload,
  ChevronRight,
  Instagram,
  Youtube,
  Music,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ProjectDealCardProps {
  deal: BrandDeal;
  stage: DealStage;
  paymentStatus: PaymentStatus;
  onView: (deal: BrandDeal) => void;
  onEdit: (deal: BrandDeal) => void;
  onManageDeliverables: (deal: BrandDeal) => void;
  onUploadContent: (deal: BrandDeal) => void;
  onContactBrand: (deal: BrandDeal) => void;
  onViewContract: (deal: BrandDeal) => void;
  onDelete: (deal: BrandDeal) => void;
  isDeleting?: boolean;
}

const ProjectDealCard: React.FC<ProjectDealCardProps> = ({
  deal,
  stage,
  paymentStatus,
  onView,
  onEdit,
  onManageDeliverables,
  onUploadContent,
  onContactBrand,
  onViewContract,
  onDelete,
  isDeleting,
}) => {
  const navigate = useNavigate();

  // Handle deliverables array/string
  const deliverablesArray = Array.isArray(deal.deliverables) 
    ? deal.deliverables 
    : typeof deal.deliverables === 'string' 
      ? deal.deliverables.split(',').map(d => d.trim()).filter(Boolean)
      : [];

  // Calculate progress percentage based on project stage
  const getProgressPercentage = (stage: DealStage): number => {
    switch (stage) {
      case 'draft': return 10;
      case 'awaiting_approval': return 25;
      case 'in_progress': return 50;
      case 'deliverables_due': return 75;
      case 'review_pending': return 90;
      case 'completed': return 100;
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

  // Get next milestone (project-focused)
  const getNextMilestone = () => {
    switch (stage) {
      case 'draft':
        return 'Submit for approval';
      case 'awaiting_approval':
        return 'Awaiting client approval';
      case 'in_progress':
        if (deliverablesArray.length > 0) {
          return `Next: ${deliverablesArray[0]}`;
        }
        return 'Continue content creation';
      case 'deliverables_due':
        return 'Submit deliverables';
      case 'review_pending':
        return 'Awaiting brand review';
      case 'completed':
        return 'Project completed';
      default:
        return null;
    }
  };

  const nextMilestone = getNextMilestone();

  // Get payment status badge (secondary info)
  const getPaymentBadge = () => {
    if (paymentStatus === 'paid') {
      return { label: 'Paid', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
    }
    if (paymentStatus === 'overdue') {
      return { label: 'Payment Overdue', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
    if (paymentStatus === 'pending') {
      return { label: 'Payment Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }
    return null;
  };

  const paymentBadge = getPaymentBadge();

  // Get deliverable statuses (mock - in real app, this would come from deal data)
  const getDeliverableStatuses = () => {
    return deliverablesArray.map((item, index) => {
      if (stage === 'completed') {
        return { type: item, status: 'delivered' as const };
      }
      if (stage === 'deliverables_due' && index === 0) {
        return { type: item, status: 'overdue' as const };
      }
      if (stage === 'in_progress' && index === 0) {
        return { type: item, status: 'in_progress' as const };
      }
      return { type: item, status: 'pending' as const };
    });
  };

  const deliverableStatuses = getDeliverableStatuses();

  // Get primary action buttons based on stage
  const getPrimaryActions = () => {
    switch (stage) {
      case 'draft':
        return [
          { label: 'Edit Deal', onClick: () => onEdit(deal), icon: FileText },
          { label: 'View Contract', onClick: () => onViewContract(deal), icon: FileText },
        ];
      case 'awaiting_approval':
        return [
          { label: 'View Contract', onClick: () => onViewContract(deal), icon: FileText },
          { label: 'Contact Brand', onClick: () => onContactBrand(deal), icon: MessageSquare },
        ];
      case 'in_progress':
        return [
          { label: 'Upload Content', onClick: () => onUploadContent(deal), icon: Upload },
          { label: 'Manage Deliverables', onClick: () => onManageDeliverables(deal), icon: Package },
        ];
      case 'deliverables_due':
        return [
          { label: 'Submit Deliverables', onClick: () => onUploadContent(deal), icon: Upload },
          { label: 'Contact Brand', onClick: () => onContactBrand(deal), icon: MessageSquare },
        ];
      case 'review_pending':
        return [
          { label: 'View Contract', onClick: () => onViewContract(deal), icon: FileText },
          { label: 'Contact Brand', onClick: () => onContactBrand(deal), icon: MessageSquare },
        ];
      case 'completed':
        return [
          { label: 'View Contract', onClick: () => onViewContract(deal), icon: FileText },
        ];
      default:
        return [];
    }
  };

  const primaryActions = getPrimaryActions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "bg-gradient-to-br from-card to-card/50 border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group",
          stage === 'deliverables_due' && 'border-orange-500/30 bg-orange-500/5'
        )}
        onClick={() => onView(deal)}
      >
        {/* Header: Brand Logo + Name + Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <BrandLogo 
              brandName={deal.brand_name} 
              brandLogo={null} 
              size="md" 
              className="flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                {deal.brand_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {PlatformIcon && (
                  <PlatformIcon className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {deal.platform || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <DealStatusBadge stage={stage} />
            {paymentBadge && (
              <Badge
                variant="outline"
                className={cn("text-xs px-2 py-0.5", paymentBadge.className)}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/creator-payments');
                }}
              >
                <DollarSign className="w-3 h-3 mr-1" />
                {paymentBadge.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Amount and Deliverables - Compact Row */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Deal Value</div>
            <div className="text-lg font-bold text-foreground">
              ₹{deal.deal_amount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Deliverables</span>
            </div>
            <div className="text-xs font-medium text-foreground">
              {deliverableStatuses.length} item{deliverableStatuses.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Project Progress and Next Milestone - Compact */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">Progress: {progress}%</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {progress}% = {progress < 25 ? 'Project started' : 
                     progress < 50 ? 'In progress' :
                     progress < 75 ? 'Deliverables in progress' :
                     progress < 100 ? 'Near completion' : 'Completed'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {nextMilestone && (
              <span className="truncate max-w-[60%]">{nextMilestone}</span>
            )}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className={cn(
                "h-full transition-all",
                stage === 'completed' ? 'bg-green-500' :
                stage === 'deliverables_due' ? 'bg-orange-500' :
                stage === 'review_pending' ? 'bg-purple-500' :
                stage === 'in_progress' ? 'bg-blue-500' :
                stage === 'awaiting_approval' ? 'bg-yellow-500' :
                'bg-gray-400'
              )}
            />
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
          {primaryActions.slice(0, 2).map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                size="sm"
                variant={index === 0 ? "default" : "outline"}
                onClick={action.onClick}
                className="flex-1 text-xs h-8 px-2"
              >
                <Icon className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">{action.label}</span>
                <span className="sm:hidden">{action.label.split(' ')[0]}</span>
              </Button>
            );
          })}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(deal)}
            className="text-xs h-8 px-2"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProjectDealCard;

