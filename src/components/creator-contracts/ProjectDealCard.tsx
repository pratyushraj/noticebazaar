
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
          "bg-white/[0.08] backdrop-blur-lg border-l-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] p-4 transition-all cursor-pointer group hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-0.5",
          stage === 'deliverables_due' && 'border-orange-500/30 bg-orange-500/10',
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
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground font-medium">
                  {deal.platform || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <DealStatusBadge stage={stage} />
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

        {/* Action Buttons - Accessibility: 44x44px minimum touch target */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
          {primaryActions.slice(0, 2).map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                size="sm"
                variant={index === 0 ? "default" : "outline"}
                onClick={action.onClick}
                className="flex-1 min-h-[44px] min-w-[44px] text-sm px-4 py-3"
                aria-label={action.label}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">{action.label}</span>
                <span className="sm:hidden">{action.label.split(' ')[0]}</span>
              </Button>
            );
          })}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(deal)}
            className="min-h-[44px] min-w-[44px] text-sm px-4 py-3"
            aria-label="View deal details"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">View</span>
          </Button>
        </div>
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

