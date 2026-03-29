"use client";

import React, { useState } from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from './BrandLogo';
import DealStatusBadge, { DealStage } from './DealStatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { IndianRupee, Calendar, Package, CheckCircle, Clock, XCircle, AlertCircle, Send, FileText, MessageSquare, ChevronRight, Instagram, Youtube, Music, ChevronDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isExpanded, setIsExpanded] = useState(false);

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
    
    return deliverablesArray.map((item, index) => {
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
      return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/20 border-red-500/30', text: `${daysOverdue} days` };
    }
    if (daysLeft && daysLeft <= 3) {
      return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20 border-yellow-500/30', text: `${daysLeft} days` };
    }
    return null;
  };

  const urgency = getUrgencyIndicator();

  // Get stage color config
  const getStageConfig = () => {
    switch (stage) {
      case 'overdue':
        return { gradient: 'from-red-600 to-orange-600', bg: 'bg-red-500/5 border-red-500/20', badge: 'bg-red-500/20 text-red-600 border-red-500/30' };
      case 'payment_pending':
        return { gradient: 'from-yellow-600 to-orange-600', bg: 'bg-yellow-500/5 border-yellow-500/20', badge: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' };
      case 'active':
        return { gradient: 'from-blue-600 to-cyan-600', bg: 'bg-blue-500/5 border-blue-500/20', badge: 'bg-blue-500/20 text-blue-600 border-blue-500/30' };
      case 'paid':
        return { gradient: 'from-emerald-600 to-teal-600', bg: 'bg-emerald-500/5 border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' };
      case 'completed':
        return { gradient: 'from-green-600 to-emerald-600', bg: 'bg-green-500/5 border-green-500/20', badge: 'bg-green-500/20 text-green-600 border-green-500/30' };
      default:
        return { gradient: 'from-gray-600 to-slate-600', bg: 'bg-gray-500/5 border-gray-500/20', badge: 'bg-gray-500/20 text-gray-600 border-gray-500/30' };
    }
  };

  const stageConfig = getStageConfig();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all cursor-pointer group",
          stageConfig.bg,
          isExpanded && 'ring-2 ring-slate-400/30'
        )}
      >
        {/* Animated gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative p-5 sm:p-6">
          {/* Header: Brand Logo + Status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <BrandLogo 
                brandName={deal.brand_name} 
                brandLogo={null} 
                size="md" 
                className="flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">
                  {deal.brand_name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {PlatformIcon && (
                    <PlatformIcon className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-400">
                    {deal.platform || 'Campaign'}
                  </span>
                  {stage === 'completed' && (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Success
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <DealStatusBadge stage={stage} />
              {urgency && (
                <Badge 
                  variant="outline"
                  className={cn("text-xs font-semibold border", urgency.bg)}
                >
                  <urgency.icon className={cn("w-3 h-3 mr-1", urgency.color)} />
                  {urgency.text}
                </Badge>
              )}
            </div>
          </div>

          {/* Amount and Due Date Row - Enhanced */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400">Amount</div>
                <div className="text-xl font-bold text-white">
                  ₹{deal.deal_amount.toLocaleString('en-IN')}
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400">Due Date</div>
                <div className="text-sm font-semibold text-white">
                  {new Date(deal.payment_expected_date || deal.due_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Deliverables Summary */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-600/30 border border-slate-500/30">
                  <Package className="w-4 h-4 text-slate-300" />
                </div>
                <span className="text-xs font-semibold text-slate-300">Deliverables</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {formattedDeliverables.filter(d => d.status === 'delivered').length}/{formattedDeliverables.length}
              </span>
            </div>

            <div className="space-y-2">
              {formattedDeliverables.slice(0, isExpanded ? undefined : 2).map((deliverable, index) => {
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
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2.5 text-sm p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", iconColor)} />
                    <span className="text-slate-200 flex-1 truncate">
                      {deliverable.type}
                    </span>
                    {deliverable.status === 'delivered' && deliverable.date && (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        ✓ {new Date(deliverable.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </motion.div>
                );
              })}
              {formattedDeliverables.length > 2 && !isExpanded && (
                <button type="button"
                  onClick={() => setIsExpanded(true)}
                  className="text-xs text-slate-400 hover:text-white transition-colors font-medium mt-1"
                >
                  +{formattedDeliverables.length - 2} more deliverables
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Progress</span>
              <span className="text-white font-semibold">{progress}%</span>
            </div>
            <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={cn(
                  "h-full transition-all rounded-full shadow-lg",
                  stage === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/30' :
                  stage === 'paid' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/30' :
                  stage === 'payment_pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/30' :
                  stage === 'overdue' ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-red-500/30' :
                  stage === 'active' ? 'bg-gradient-to-r from-blue-400 to-cyan-400 shadow-blue-400/30' :
                  'bg-gradient-to-r from-gray-400 to-slate-400 shadow-gray-400/30'
                )}
              />
            </div>
          </div>

          {/* Next Milestone */}
          {nextMilestone && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-gradient-to-br from-slate-600/20 to-slate-700/10 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-colors"
            >
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400">Next Milestone</div>
                  <div className="text-sm font-semibold text-slate-100 mt-0.5">{nextMilestone}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Expandable Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 pb-4 border-t border-white/10"
              >
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-slate-400">Status</p>
                    <p className="text-white font-semibold mt-1">{getStatusMessage()}</p>
                  </div>
                  {deal.brand_contact && (
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-slate-400">Contact</p>
                      <p className="text-white font-semibold mt-1 truncate">{deal.brand_contact}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              {stage === 'overdue' || stage === 'payment_pending' ? (
                <>
                  {onSendReminder && (
                    <motion.div className="flex-1 min-w-[120px]" whileHover={{ scale: 1.02 }}>
                      <Button
                        size="sm"
                        onClick={() => onSendReminder(deal)}
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold shadow-lg shadow-red-600/20"
                      >
                        <Send className="w-3 h-3 mr-1.5" />
                        Send Reminder
                      </Button>
                    </motion.div>
                  )}
                  <motion.div className="flex-1 min-w-[120px]" whileHover={{ scale: 1.02 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkPaid(deal)}
                      className="w-full border-white/20 hover:bg-white/10 text-slate-200 hover:text-white"
                    >
                      <CheckCircle className="w-3 h-3 mr-1.5" />
                      Mark Paid
                    </Button>
                  </motion.div>
                </>
              ) : stage === 'active' ? (
                <>
                  <motion.div className="flex-1 min-w-[120px]" whileHover={{ scale: 1.02 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(deal)}
                      className="w-full border-white/20 hover:bg-white/10 text-slate-200 hover:text-white"
                    >
                      <FileText className="w-3 h-3 mr-1.5" />
                      Upload Draft
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1 min-w-[120px]" whileHover={{ scale: 1.02 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-white/20 hover:bg-white/10 text-slate-200 hover:text-white"
                    >
                      <MessageSquare className="w-3 h-3 mr-1.5" />
                      Chat
                    </Button>
                  </motion.div>
                </>
              ) : null}
              <motion.div className="flex-1 min-w-[120px]" whileHover={{ scale: 1.02 }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onView(deal)}
                  className="w-full text-slate-300 hover:text-white hover:bg-white/5"
                >
                  Details
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </motion.div>
            </div>

            {/* Toggle Expand */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200"
            >
              <ChevronDown className={cn('w-4 h-4 inline mr-1 transition-transform', isExpanded && 'rotate-180')} />
              {isExpanded ? 'Hide Details' : 'Show More'}
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedDealCard;

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

