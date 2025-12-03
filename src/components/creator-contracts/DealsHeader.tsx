"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter, Briefcase, Clock, TrendingUp } from 'lucide-react';
import { BrandDeal } from '@/types';
import { DealStage } from '@/lib/hooks/useBrandDeals';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DealsHeaderProps {
  allDeals: BrandDeal[];
  onAddDeal: () => void;
  onExport: () => void;
  onFilterClick: () => void;
}

// Helper function to map old status to new stage
const getDealStage = (deal: BrandDeal): DealStage => {
  const status = deal.status?.toLowerCase() || '';
  
  // Map old statuses to new stages
  if (status.includes('draft')) return 'negotiation';
  if (status.includes('review')) return 'signed';
  if (status.includes('negotiation')) return 'negotiation';
  if (status.includes('signed')) return 'signed';
  if (status.includes('content_making') || status.includes('content making')) return 'content_making';
  if (status.includes('content_delivered') || status.includes('content delivered')) return 'content_delivered';
  if (status.includes('completed')) return 'completed';
  
  // Fallback: use progress_percentage if available
  if (deal.progress_percentage !== null && deal.progress_percentage !== undefined) {
    if (deal.progress_percentage >= 100) return 'completed';
    if (deal.progress_percentage >= 90) return 'content_delivered';
    if (deal.progress_percentage >= 80) return 'content_making';
    if (deal.progress_percentage >= 70) return 'signed';
    return 'negotiation';
  }
  
  // Default fallback
  return 'negotiation';
};

const DealsHeader: React.FC<DealsHeaderProps> = ({
  allDeals,
  onAddDeal,
  onExport,
  onFilterClick,
}) => {
  const stats = React.useMemo(() => {
    const dealsWithStages = allDeals.map(deal => ({ deal, stage: getDealStage(deal) }));
    
    const activeCampaigns = dealsWithStages.filter(({ stage }) => 
      stage === 'signed' || stage === 'content_making' || stage === 'content_delivered'
    ).length;
    
    const pendingPayments = dealsWithStages.filter(({ deal }) => 
      deal.status === 'Payment Pending' || (deal.payment_expected_date && !deal.payment_received_date)
    ).length;
    
    // Calculate deals closing in 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const closingSoon = dealsWithStages.filter(({ deal }) => {
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate >= now && dueDate <= sevenDaysFromNow && 
             (deal.status === 'Payment Pending' || deal.status === 'Approved');
    }).length;
    
    // Revenue this month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const revenueThisMonth = dealsWithStages
      .filter(({ deal }) => {
        if (!deal.payment_received_date) return false;
        const receivedDate = new Date(deal.payment_received_date);
        return receivedDate.getMonth() === currentMonth && 
               receivedDate.getFullYear() === currentYear &&
               (deal.status === 'Completed' || deal.payment_received_date);
      })
      .reduce((sum, { deal }) => sum + deal.deal_amount, 0);
    
    return {
      activeCampaigns,
      pendingPayments,
      closingSoon,
      revenueThisMonth,
    };
  }, [allDeals]);

  const formatRevenue = (amount: number): string => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      {/* Premium Icon Graphic */}
      <div className="flex justify-center mb-6 py-6 md:py-8 overflow-visible">
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse opacity-60"></div>
          
          {/* Icon Container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {/* Premium Icon - Large Briefcase Icon with decorative elements */}
            <div className="relative">
              {/* Briefcase Box Icon */}
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/40 flex items-center justify-center transform rotate-[-8deg] hover:rotate-[-5deg] transition-transform duration-300">
                <Briefcase className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg" />
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl shadow-amber-500/50 flex items-center justify-center transform rotate-12 animate-bounce" style={{ animationDuration: '3s' }}>
                <span className="text-2xl md:text-3xl">💼</span>
              </div>
              
              <div className="absolute -bottom-4 -left-4 w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl shadow-amber-500/50 flex items-center justify-center transform -rotate-12 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                <span className="text-xl md:text-2xl">📊</span>
              </div>
              
              {/* Arrow pointing up */}
              <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 translate-x-4">
                <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-blue-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Brand Deals & Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your brand collaborations, payments, and deliverables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="hidden sm:flex"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterClick}
            className="hidden sm:flex"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-700/40 hover:border-blue-600/60 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.activeCampaigns}</div>
              <div className="text-xs text-muted-foreground mt-1">campaigns</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 border border-yellow-700/40 hover:border-yellow-600/60 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.pendingPayments}</div>
              <div className="text-xs text-muted-foreground mt-1">payment</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-950/20 border border-orange-700/40 hover:border-orange-600/60 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-xs text-muted-foreground">Closing</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.closingSoon}</div>
              <div className="text-xs text-muted-foreground mt-1">in 7 days</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border border-emerald-700/40 hover:border-emerald-600/60 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatRevenue(stats.revenueThisMonth)}</div>
              <div className="text-xs text-muted-foreground mt-1">this month</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DealsHeader;

