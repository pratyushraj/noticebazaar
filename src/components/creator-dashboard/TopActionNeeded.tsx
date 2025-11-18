"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandDeal } from '@/types';

interface TopActionNeededProps {
  brandDeals?: BrandDeal[];
}

const TopActionNeeded: React.FC<TopActionNeededProps> = ({ brandDeals = [] }) => {
  const topActions = useMemo(() => {
    const actions: Array<{ text: string; priority: number }> = [];
    const now = new Date();

    // Check for missing invoices
    const dealsWithoutInvoice = brandDeals.filter(d => 
      d.status === 'Payment Pending' && !d.invoice_file_url
    );
    dealsWithoutInvoice.forEach(deal => {
      actions.push({
        text: `Upload missing invoice for ${deal.brand_name} deal`,
        priority: 1,
      });
    });

    // Check for overdue payments
    const overduePayments = brandDeals.filter(d => {
      if (d.status !== 'Payment Pending') return false;
      const dueDate = new Date(d.payment_expected_date);
      return dueDate < now;
    });
    overduePayments.forEach(deal => {
      const daysOverdue = Math.floor((now.getTime() - new Date(deal.payment_expected_date).getTime()) / (1000 * 60 * 60 * 24));
      actions.push({
        text: `Follow up: ${deal.brand_name} payment due ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago`,
        priority: 1,
      });
    });

    // Check for upcoming payments
    const upcomingPayments = brandDeals.filter(d => {
      if (d.status !== 'Payment Pending') return false;
      const dueDate = new Date(d.payment_expected_date);
      const daysUntil = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 3;
    });
    upcomingPayments.forEach(deal => {
      const daysUntil = Math.floor((new Date(deal.payment_expected_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      actions.push({
        text: `Follow up: ${deal.brand_name} payment due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
        priority: 2,
      });
    });

    // Demo actions if no real actions found
    if (actions.length === 0 && brandDeals.length <= 6) {
      return [
        { text: 'Upload missing invoice for Nike deal', priority: 1 },
        { text: 'Renew PAN verification', priority: 2 },
        { text: 'Follow up: Zepto payment due soon', priority: 2 },
      ];
    }

    return actions.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [brandDeals]);

  if (topActions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-white/5 hover:border-orange-600/60 transition-all shadow-inner">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Top Action Needed</span>
          </div>

          <div className="space-y-2">
            {topActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-foreground py-1.5 px-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                <span className="flex-1">{action.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TopActionNeeded;

