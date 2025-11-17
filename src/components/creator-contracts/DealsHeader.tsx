"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download, Filter, Briefcase, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { BrandDeal } from '@/types';
import { DealStage } from './DealStatusBadge';
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
  if (deal.status === 'Drafting') return 'draft';
  if (deal.status === 'Approved') return 'active';
  if (deal.status === 'Payment Pending') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(deal.payment_expected_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today ? 'overdue' : 'payment_pending';
  }
  if (deal.status === 'Completed') return 'completed';
  if (deal.payment_received_date) return 'paid';
  return 'draft';
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
      stage === 'active'
    ).length;
    
    const pendingPayments = dealsWithStages.filter(({ stage }) => 
      stage === 'payment_pending' || stage === 'overdue'
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
          <Button
            onClick={onAddDeal}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Deal
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

