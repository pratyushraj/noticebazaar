"use client";

import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Shield, 
  AlertCircle,
  Calendar,
  TrendingDown,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { BrandDeal } from '@/types';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface UrgentAction {
  type: 'payment_overdue' | 'contract_review' | 'content_stolen';
  title: string;
  amount?: number;
  daysOverdue?: number;
  dueDate?: string;
  brand?: string;
  receivedDays?: number;
  hasRedFlags?: boolean;
  matches?: number;
  topThief?: string;
  views?: number;
  platform?: string;
  dealId?: string;
}

interface ActionCenterProps {
  urgentActions?: UrgentAction[];
  brandDeals?: BrandDeal[];
  onSendReminder?: (dealId: string) => void;
  onEscalate?: (dealId: string) => void;
  onAnalyzeContract?: (dealId: string) => void;
}

const ActionCenter: React.FC<ActionCenterProps> = ({
  urgentActions = [],
  brandDeals = [],
  onSendReminder,
  onEscalate,
  onAnalyzeContract,
}) => {
  const navigate = useNavigate();

  // Calculate warnings (from RiskAlerts logic)
  const warnings = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
      icon: React.ReactNode;
    }> = [];
    const now = new Date();

    // Missing deliverables
    const dealsWithoutDeliverables = brandDeals.filter(deal => 
      deal.status === 'Approved' && !deal.deliverables?.includes('date')
    );
    if (dealsWithoutDeliverables.length > 0) {
      items.push({
        id: 'missing-deliverable',
        title: 'Missing Deliverable Date',
        description: `${dealsWithoutDeliverables.length} deal(s) missing deliverable timeline`,
        severity: 'medium',
        icon: <Calendar className="h-4 w-4" />,
      });
    }

    // GST filing due
    const today = new Date();
    const quarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 2, 31);
    const daysUntilGSTDue = Math.ceil((quarterEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilGSTDue <= 30 && daysUntilGSTDue > 0) {
      items.push({
        id: 'gst-filing-due',
        title: 'GST Filing Due Soon',
        description: `Quarterly GST filing due in ${daysUntilGSTDue} days. Contact your CA.`,
        severity: 'high',
        icon: <FileText className="h-4 w-4" />,
      });
    }

    // Low collection ratio
    const totalExpected = brandDeals
      .filter(deal => deal.status === 'Payment Pending' || deal.status === 'Completed')
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    const paidAmount = brandDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    const collectionRatio = totalExpected > 0 ? (paidAmount / totalExpected) * 100 : 100;
    if (collectionRatio < 70 && brandDeals.length > 0) {
      items.push({
        id: 'low-collection',
        title: 'Low Collection Ratio',
        description: `Collection rate at ${Math.round(collectionRatio)}%. Review pending payments.`,
        severity: 'medium',
        icon: <TrendingDown className="h-4 w-4" />,
      });
    }

    // Unread contract reviews
    const contractsNeedingReview = brandDeals.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    );
    if (contractsNeedingReview.length > 0) {
      items.push({
        id: 'unread-review',
        title: 'Unread Contract Review',
        description: `${contractsNeedingReview.length} contract(s) waiting for your review`,
        severity: 'medium',
        icon: <FileText className="h-4 w-4" />,
      });
    }

    // Payment risk detected
    const dealsWithDelayedHistory = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue > 0;
    });
    if (dealsWithDelayedHistory.length > 0) {
      items.push({
        id: 'delayed-payment',
        title: 'Payment Risk Detected',
        description: `${dealsWithDelayedHistory.length} payment(s) due within 3 days`,
        severity: 'high',
        icon: <DollarSign className="h-4 w-4" />,
      });
    }

    return items.slice(0, 5);
  }, [brandDeals]);

  // Calculate suggestions (from SmartSuggestions + TopActionNeeded logic)
  const suggestions = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      description: string;
      action: string;
      icon: React.ReactNode;
      priority: 'high' | 'medium' | 'low';
    }> = [];
    const now = new Date();

    // Missing invoices
    const dealsWithoutInvoice = brandDeals.filter(d => 
      d.status === 'Payment Pending' && !d.invoice_file_url
    );
    dealsWithoutInvoice.forEach(deal => {
      items.push({
        id: `missing-invoice-${deal.id}`,
        title: 'Upload Missing Invoice',
        description: `Invoice missing for ${deal.brand_name} deal`,
        action: 'Upload now',
        icon: <FileText className="h-5 w-5" />,
        priority: 'high',
      });
    });

    // Upcoming payments
    const upcomingPayments = brandDeals.filter(d => {
      if (d.status !== 'Payment Pending') return false;
      const dueDate = new Date(d.payment_expected_date);
      const daysUntil = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    });
    if (upcomingPayments.length > 0) {
      items.push({
        id: 'send-reminder',
        title: 'Send Payment Reminders',
        description: `${upcomingPayments.length} payment(s) due within a week`,
        action: 'Send reminders now',
        icon: <DollarSign className="h-5 w-5" />,
        priority: 'high',
      });
    }

    // Contracts needing review
    const contractsNeedingReview = brandDeals.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    );
    if (contractsNeedingReview.length > 0) {
      items.push({
        id: 'review-contracts',
        title: 'Review Pending Contracts',
        description: `${contractsNeedingReview.length} contract(s) waiting for your review`,
        action: 'Review now',
        icon: <FileText className="h-5 w-5" />,
        priority: 'medium',
      });
    }

    // Increase pitch frequency
    const completedThisMonth = brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === now.getMonth() && 
             receivedDate.getFullYear() === now.getFullYear();
    }).length;
    if (completedThisMonth >= 3) {
      items.push({
        id: 'pitch-more',
        title: 'Increase Pitch Frequency',
        description: 'You\'re closing deals well! Consider sending more brand pitches',
        action: 'Explore opportunities',
        icon: <TrendingUp className="h-5 w-5" />,
        priority: 'low',
      });
    }

    return items.slice(0, 5);
  }, [brandDeals]);

  const getActionIcon = (type: UrgentAction['type']) => {
    switch (type) {
      case 'payment_overdue':
        return DollarSign;
      case 'contract_review':
        return FileText;
      case 'content_stolen':
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-[#FFB3BA]/20 border-[#FF6B9D]/40 text-[#FF6B9D]';
      case 'medium':
        return 'bg-[#FFD89B]/20 border-[#FFB84D]/40 text-[#FFB84D]';
      case 'low':
        return 'bg-[#B4D4FF]/20 border-[#7BAFFF]/40 text-[#7BAFFF]';
      default:
        return 'bg-[#E879F9]/20 border-[#F472B6]/40 text-[#F472B6]';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-[#FF6B9D]/40 bg-[#FFB3BA]/20';
      case 'medium':
        return 'border-[#F472B6]/40 bg-[#FF8FAB]/20';
      case 'low':
        return 'border-[#E879F9]/40 bg-[#F0A5FF]/20';
      default:
        return 'border-[#4A3A4F] bg-[#2A1F2E]';
    }
  };

  const paymentOverdueActions = urgentActions.filter(a => a.type === 'payment_overdue');
  const otherUrgentActions = urgentActions.filter(a => a.type !== 'payment_overdue');

  const totalUrgent = urgentActions.length;
  const totalWarnings = warnings.length;
  const totalSuggestions = suggestions.length;

  if (totalUrgent === 0 && totalWarnings === 0 && totalSuggestions === 0) {
    return null;
  }

  return (
    <div className="relative bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
      <div className="flex flex-col space-y-2 p-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              Action Center
            </h3>
            <p className="text-sm text-white/60 mt-1">Urgent items, warnings, and suggestions</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <Tabs defaultValue="urgent" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-[20px] saturate-[120%] p-1 rounded-2xl border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.15)] gap-1">
            <TabsTrigger 
              value="urgent" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/60 transition-all text-sm font-medium rounded-xl flex items-center gap-1.5 py-2"
            >
              <span>Urgent</span>
              {totalUrgent > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold whitespace-nowrap">{totalUrgent}</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="warnings" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/60 transition-all text-sm font-medium rounded-xl flex items-center gap-1.5 py-2"
            >
              <span>Warnings</span>
              {totalWarnings > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold whitespace-nowrap">{totalWarnings}</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="suggestions" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/60 transition-all text-sm font-medium rounded-xl flex items-center gap-1.5 py-2"
            >
              <span>Suggestions</span>
              {totalSuggestions > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold whitespace-nowrap">{totalSuggestions}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urgent" className="mt-6 space-y-4">
            {paymentOverdueActions.length > 0 && (
              paymentOverdueActions.slice(0, 1).map((action, index) => {
                const Icon = getActionIcon(action.type);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-5 rounded-2xl bg-white/[0.06] backdrop-blur-[30px] border border-red-500/15 shadow-[0_2px_12px_rgba(0,0,0,0.15)] overflow-hidden"
                  >
                    {/* Subtle gradient overlay - reduced intensity */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] via-transparent to-transparent pointer-events-none" />
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 relative z-10 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 backdrop-blur-sm flex items-center justify-center border border-red-500/30 flex-shrink-0">
                          <Icon className="w-5 h-5 text-red-400" />
                      </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {action.brand || 'Payment'} Payment Overdue
                        </h3>
                          <p className="text-xs text-white/50 mt-0.5">
                            Due since {action.daysOverdue || 0} {action.daysOverdue === 1 ? 'day' : 'days'}
                        </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20 flex-shrink-0">
                        Overdue
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 relative z-10 mb-4">
                      <p className="text-lg font-semibold text-white">₹{action.amount?.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-white/50 mt-1">
                        Due: {action.dueDate ? new Date(action.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>

                    {/* Actions - Accessibility: 44x44px minimum touch target */}
                    <div className="flex gap-2 relative z-10">
                      <button
                        onClick={() => onSendReminder?.(action.dealId!)}
                        className="flex-1 min-h-[44px] py-3 rounded-xl bg-white/20 backdrop-blur-[20px] border border-white/30 hover:bg-white/30 active:scale-[0.98] text-white font-medium text-base transition-all"
                        aria-label="Send payment reminder"
                      >
                        Send Reminder
                      </button>
                      <button
                        onClick={() => onEscalate?.(action.dealId!)}
                        className="flex-1 min-h-[44px] py-3 rounded-xl bg-white/10 backdrop-blur-[20px] hover:bg-white/15 text-white font-medium text-base transition-all border border-white/20"
                        aria-label="Escalate payment issue"
                      >
                        Escalate
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
            {otherUrgentActions.map((action, index) => {
              const Icon = getActionIcon(action.type);
              const actionBorderColor = action.type === 'contract_review' 
                ? 'border-[#FFD89B]/40' 
                : 'border-[#E879F9]/40';
              const actionIconBg = action.type === 'contract_review' 
                ? 'bg-[#FFD89B]/20' 
                : 'bg-[#E879F9]/20';
              const actionIconColor = action.type === 'contract_review' 
                ? 'text-[#FFB84D]' 
                : 'text-[#F472B6]';
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={cn(
                    "bg-white/[0.06] backdrop-blur-[30px] border border-white/10 rounded-3xl p-5 hover:bg-white/[0.08] transition-all cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.2)]",
                    actionBorderColor
                  )}
                  onClick={() => {
                    if (action.type === 'contract_review' && action.dealId) {
                      navigate(`/creator-contracts/${action.dealId}`);
                    } else if (action.type === 'content_stolen') {
                      navigate('/creator-content-protection');
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-12 h-12 rounded-2xl backdrop-blur-sm flex items-center justify-center border shadow-[0_2px_8px_rgba(0,0,0,0.15)] relative z-10", actionIconBg)}>
                      <Icon className={cn("w-6 h-6", actionIconColor)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">{action.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {action.type === 'contract_review' && `${action.brand || 'Contract'} deal • Received ${action.receivedDays} days ago`}
                        {action.type === 'content_stolen' && `@${action.topThief || 'fakepage'} • ${action.views ? `${(action.views / 1000).toFixed(1)}K` : '12.5K'} views`}
                      </p>
                      {action.type === 'contract_review' && action.dealId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAnalyzeContract?.(action.dealId!);
                          }}
                          className="mt-2 px-4 py-2 bg-yellow-500/20 backdrop-blur-sm saturate-[150%] border border-yellow-500/30 hover:bg-yellow-500/30 text-yellow-400 text-xs font-medium rounded-xl transition-all shadow-[0_2px_8px_rgba(234,179,8,0.2)] hover:shadow-[0_4px_12px_rgba(234,179,8,0.3)] relative z-10"
                        >
                          Analyze Now
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {totalUrgent === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-500/20 backdrop-blur-sm saturate-[150%] border border-green-500/30 mb-4 shadow-[0_4px_16px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-base text-white/50">No urgent actions at this time</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="warnings" className="mt-6 space-y-3">
            {warnings.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn("flex items-start gap-3 p-5 rounded-3xl border backdrop-blur-[30px] saturate-[150%] shadow-[0_4px_24px_rgba(0,0,0,0.2)] overflow-hidden relative", getSeverityStyles(alert.severity))}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                <div className="flex-shrink-0 mt-0.5">
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{alert.title}</p>
                  <p className="text-small text-white/60 mt-0.5">{alert.description}</p>
                </div>
              </motion.div>
            ))}
            {totalWarnings === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-500/20 backdrop-blur-sm saturate-[150%] border border-green-500/30 mb-4 shadow-[0_4px_16px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-base text-white/50">No warnings at this time</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6 space-y-3">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn("flex items-start gap-3 p-5 rounded-3xl border backdrop-blur-[30px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]", getPriorityColor(suggestion.priority))}
              >
                <div className="flex-shrink-0 mt-0.5 text-[#FF4DAA]">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-sm font-semibold text-white">{suggestion.title}</p>
                  <p className="text-xs text-white/50 mt-1">{suggestion.description}</p>
                  <button className="text-sm text-[#FF4DAA] hover:text-[#FF84C5] mt-2 font-medium transition-all rounded px-2 py-1">
                    {suggestion.action} →
                  </button>
                </div>
              </motion.div>
            ))}
            {totalSuggestions === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-500/20 backdrop-blur-sm saturate-[150%] border border-green-500/30 mb-4 shadow-[0_4px_16px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-base text-white/50">No suggestions at this time</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ActionCenter;

