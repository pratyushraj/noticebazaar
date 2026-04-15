
"use client";

import React, { useState } from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from './BrandLogo';
import DealStatusBadge, { DealStage } from './DealStatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Package, 
  FileText,
  MessageSquare,
  Upload,
  ChevronRight,
  Instagram,
  Youtube,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import BrandMoodBoard from '@/components/deals/BrandMoodBoard';
import { categorizeDeal, getCategoryStyle } from '@/lib/utils/dealCategories';

export interface ProjectDealCardProps {
  deal: BrandDeal;
  stage: DealStage;
  onView: (deal: BrandDeal) => void;
  onEdit: (deal: BrandDeal) => void;
  onManageDeliverables: (deal: BrandDeal) => void;
  onUploadContent: (deal: BrandDeal) => void;
  onContactBrand: (deal: BrandDeal) => void;
  onViewContract: (deal: BrandDeal) => void;
}

const ProjectDealCard: React.FC<ProjectDealCardProps> = ({
  deal,
  stage,
  onView,
  onEdit,
  onManageDeliverables,
  onUploadContent,
  onContactBrand,
  onViewContract,
}) => {

  // Handle deliverables array/string
  const deliverablesArray = Array.isArray(deal.deliverables) 
    ? deal.deliverables 
    : typeof deal.deliverables === 'string' 
      ? deal.deliverables.split(',').map(d => d.trim()).filter(Boolean)
      : [];

  // Calculate progress percentage based on project stage
  const getProgressPercentage = (stage: DealStage): number => {
    switch (stage) {
      case 'details_submitted': return 20;
      case 'contract_ready': return 40;
      case 'brand_signed': return 60;
      case 'fully_executed': return 80;
      case 'live_deal': return 85;
      case 'content_making': return 85;
      case 'content_delivered': return 95;
      case 'awaiting_product_shipment': return 50;
      case 'negotiation': return 30;
      case 'needs_changes': return 40;
      case 'completed': return 100;
      case 'declined': return 0;
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

  // Get next milestone (action-focused, brief)
  const getNextMilestone = () => {
    switch (stage) {
      case 'details_submitted':
        return 'Respond before expiry';
      case 'negotiation':
        return 'Review counter and reply';
      case 'contract_ready':
        return 'Sign to lock in the deal';
      case 'brand_signed':
        return 'Your signature needed';
      case 'awaiting_product_shipment':
        return 'Waiting for product delivery';
      case 'fully_executed':
        return 'Start creating content';
      case 'live_deal':
      case 'content_making':
        if (deliverablesArray.length > 0) {
          return `Next: ${deliverablesArray[0]}`;
        }
        return 'Upload your content';
      case 'content_delivered':
        return 'Brand reviewing — you\'ll be paid soon';
      case 'completed':
        return deal.payment_received_date ? 'Payment received' : 'Deal complete';
      default:
        return null;
    }
  };

  const nextMilestone = getNextMilestone();

  // Get deliverable statuses (mock - in real app, this would come from deal data)
  const getDeliverableStatuses = () => {
    return deliverablesArray.map((item, index) => {
      if (stage === 'completed') {
        return { type: item, status: 'delivered' as const };
      }
      if (stage === 'content_delivered' && index === 0) {
        return { type: item, status: 'overdue' as const };
      }
      if ((stage === 'live_deal' || stage === 'content_making') && index === 0) {
        return { type: item, status: 'in_progress' as const };
      }
      return { type: item, status: 'pending' as const };
    });
  };

  const deliverableStatuses = getDeliverableStatuses();

  // ONE clear primary action per stage
  const getPrimaryAction = () => {
    switch (stage) {
      case 'details_submitted':
      case 'negotiation':
        return { label: 'Review Offer', onClick: () => onView(deal), icon: FileText };
      case 'contract_ready':
        return { label: 'Sign Agreement', onClick: () => onViewContract(deal), icon: FileText };
      case 'brand_signed':
        return { label: 'Sign to Start', onClick: () => onViewContract(deal), icon: FileText };
      case 'fully_executed':
      case 'live_deal':
        return { label: 'Submit Content', onClick: () => onUploadContent(deal), icon: Upload };
      case 'content_making':
        return { label: 'Continue Creating', onClick: () => onUploadContent(deal), icon: Upload };
      case 'content_delivered':
        return { label: 'Awaiting Review', onClick: () => onView(deal), icon: Package };
      case 'completed':
        return { label: 'View Earnings', onClick: () => onView(deal), icon: FileText };
      default:
        return null;
    }
  };

  const primaryAction = getPrimaryAction();
  // Extract icon to avoid dynamic JSX element type issue
  const ActionIcon = primaryAction?.icon;
  const [showMoodBoard, setShowMoodBoard] = useState(false);
  const category = categorizeDeal(deal.brand_name);
  const categoryStyle = getCategoryStyle(category);

  return (
    <div className="relative" onMouseEnter={() => setShowMoodBoard(true)} onMouseLeave={() => setShowMoodBoard(false)}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "bg-secondary/[0.08] backdrop-blur-lg border-l-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] p-4 transition-all cursor-pointer group hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-0.5",
          stage === 'content_delivered' && 'border-orange-500/30 bg-orange-500/10',
          categoryStyle.borderColor
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
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-card border border-border text-muted-foreground font-medium">
                  {deal.platform || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <DealStatusBadge stage={stage} paymentReceivedDate={deal.payment_received_date} />
          </div>
        </div>

        {/* Amount and Deliverables - Compact Row */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">
              {stage === 'completed' ? 'Earned' : 'Deal Value'}
            </div>
            <div className="text-lg font-bold text-foreground">
              ₹{deal.deal_amount.toLocaleString('en-IN')}
              {deal.payment_received_date && (
                <span className="ml-2 text-xs font-medium text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full">
                  PAID
                </span>
              )}
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

        {/* Next Milestone + Progress Bar */}
        <div className="mb-3">
          {nextMilestone && (
            <div className="flex items-center gap-2 text-sm text-foreground/80 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="truncate">{nextMilestone}</span>
            </div>
          )}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className={cn(
                "h-full transition-all",
                stage === 'completed' ? 'bg-green-500' :
                stage === 'content_delivered' ? 'bg-indigo-500' :
                stage === 'needs_changes' || stage === 'details_submitted' || stage === 'negotiation' ? 'bg-amber-500' :
                stage === 'live_deal' || stage === 'content_making' ? 'bg-blue-500' :
                stage === 'brand_signed' || stage === 'contract_ready' ? 'bg-yellow-500' :
                stage === 'fully_executed' ? 'bg-green-500/70' :
                'bg-gray-400'
              )}
            />
          </div>
        </div>

        {/* Single Primary Action Button */}
        {primaryAction && (
          <div className="pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
            <Button
              size="lg"
              className="w-full min-h-[48px] text-base font-semibold rounded-2xl"
              onClick={primaryAction.onClick}
            >
              {ActionIcon && <ActionIcon className="w-5 h-5 mr-2" />}
              {primaryAction.label}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
    <BrandMoodBoard
      brandName={deal.brand_name}
      platform={deal.platform || undefined}
      isVisible={showMoodBoard}
      onClose={() => setShowMoodBoard(false)}
    />
    </div>
  );
};

export default ProjectDealCard;
