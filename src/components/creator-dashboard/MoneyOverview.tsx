"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianRupee, Clock, Briefcase, CheckCircle, ArrowRight, AlertCircle, TrendingUp, MoreHorizontal, ChevronRight, PlusCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BrandDeal } from '@/types';

interface MoneyOverviewProps {
  pendingPayments: number;
  pendingBrandCount: number;
  dueThisWeek: number;
  dueThisWeekCount: number;
  activeCampaigns: number;
  deliverablesDue: number;
  completed: number;
  onTimeRate: number;
  brandDeals?: BrandDeal[];
  onSendReminder?: (dealId: string) => void;
  onAddCampaign?: () => void;
}

const MoneyOverview: React.FC<MoneyOverviewProps> = ({
  pendingPayments,
  pendingBrandCount,
  dueThisWeek,
  dueThisWeekCount,
  activeCampaigns,
  deliverablesDue,
  completed,
  onTimeRate,
  brandDeals = [],
  onSendReminder,
  onAddCampaign,
}) => {
  const navigate = useNavigate();

  // Calculate overdue status
  const hasOverdue = useMemo(() => {
    if (!brandDeals.length) return false;
    const now = new Date();
    return brandDeals.some(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    });
  }, [brandDeals]);

  // Get overdue payment details
  const overduePayment = useMemo(() => {
    if (!brandDeals.length) return null;
    const now = new Date();
    const overdue = brandDeals.find(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    });
    if (!overdue) return null;
    const dueDate = new Date(overdue.payment_expected_date);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return { deal: overdue, daysOverdue };
  }, [brandDeals]);

  // Get brand initials for chips
  const getBrandInitials = (brandName: string): string => {
    return brandName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get pending brands
  const pendingBrands = useMemo(() => {
    return Array.from(new Set(
      brandDeals
        .filter(deal => deal.status === 'Payment Pending')
        .map(deal => deal.brand_name)
    )).slice(0, 3);
  }, [brandDeals]);

  // Get active campaign with deliverable due
  const campaignWithDeliverable = useMemo(() => {
    if (!brandDeals.length || deliverablesDue === 0) return null;
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    return brandDeals.find(deal => {
      if (deal.status !== 'Approved') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    });
  }, [brandDeals, deliverablesDue]);

  // Calculate completed change
  const completedLastMonth = useMemo(() => {
    if (!brandDeals.length) return 0;
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    return brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === lastMonth && receivedDate.getFullYear() === lastMonthYear;
    }).length;
  }, [brandDeals]);

  const completedChange = completed - completedLastMonth;

  // If pending/due are 0, only render Active Campaigns and Completed (for use with CombinedPaymentsCard)
  if (pendingPayments === 0 && dueThisWeek === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-2 gap-4 col-span-2"
      >
        {/* Active Campaigns Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <Card
          className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-700/40 rounded-xl p-3 md:p-5 hover:border-blue-600/60 transition-all cursor-pointer group hover:shadow-xl hover:shadow-blue-500/10"
          onClick={() => navigate('/creator-contracts')}
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              </div>
              <span className="text-xs md:text-sm font-medium text-foreground">Active Campaigns</span>
            </div>
          </div>

          {activeCampaigns === 0 ? (
            <div className="text-center py-3 md:py-6 space-y-2 md:space-y-4">
              <div className="text-3xl md:text-5xl font-bold text-foreground mb-1 md:mb-2">{activeCampaigns}</div>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCampaign?.();
                }}
                className="px-2 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-medium"
              >
                Start Your Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{activeCampaigns} running</div>
              <div className="text-sm text-muted-foreground">
                {deliverablesDue} deliverable{deliverablesDue !== 1 ? 's' : ''} due
                {campaignWithDeliverable && (
                  <span className="text-yellow-500"> in {Math.ceil((new Date(campaignWithDeliverable.payment_expected_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</span>
                )}
              </div>

              {campaignWithDeliverable && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs text-white font-semibold">
                        {getBrandInitials(campaignWithDeliverable.brand_name)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{campaignWithDeliverable.brand_name}</div>
                        <div className="text-xs text-yellow-500">
                          Due in {Math.ceil((new Date(campaignWithDeliverable.payment_expected_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm text-blue-500 group-hover:text-blue-400 transition-colors">
            <span>Manage</span>
            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Card>
      </motion.div>

      {/* Completed Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <Card
          className="bg-gradient-to-br from-green-900/20 to-green-950/20 border border-green-700/40 rounded-xl p-3 md:p-5 hover:border-green-600/60 transition-all cursor-pointer group hover:shadow-xl hover:shadow-green-500/10"
          onClick={() => navigate('/creator-contracts')}
        >
          <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            </div>
            <span className="text-xs md:text-sm font-medium text-foreground">Completed</span>
          </div>

          <div className="space-y-1 md:space-y-2 mb-2 md:mb-4">
            <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">{completed} this month</div>
            {completedChange !== 0 && (
              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <div className={cn(
                  "flex items-center text-green-500",
                  completedChange < 0 && "text-red-500"
                )}>
                  <TrendingUp className={cn(
                    "w-3 h-3 md:w-4 md:h-4 mr-1",
                    completedChange < 0 && "rotate-180"
                  )} />
                  <span className="font-medium">
                    {completedChange > 0 ? '+' : ''}{completedChange} from last month
                  </span>
                </div>
              </div>
            )}
            <div className="text-xs md:text-sm text-muted-foreground">{onTimeRate}% on time delivery</div>
          </div>

          <button className="w-full px-2 py-1.5 md:px-4 md:py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center justify-between group-hover:border-green-500/50">
            <span>View History</span>
            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Card>
      </motion.div>
      </motion.div>
    );
  }

  // This path should not be reached when using CombinedPaymentsCard
  // But kept for backward compatibility
  return null;
};

export default MoneyOverview;
