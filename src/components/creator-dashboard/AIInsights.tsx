"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIInsightsProps {
  brandDeals?: any[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ brandDeals = [] }) => {
  // Calculate earnings growth
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthEarnings = brandDeals
    .filter(deal => {
      if (!deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === currentMonth && 
             receivedDate.getFullYear() === currentYear &&
             deal.status === 'Completed';
    })
    .reduce((sum, deal) => sum + deal.deal_amount, 0);

  const lastMonthEarnings = brandDeals
    .filter(deal => {
      if (!deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === lastMonth && 
             receivedDate.getFullYear() === lastMonthYear &&
             deal.status === 'Completed';
    })
    .reduce((sum, deal) => sum + deal.deal_amount, 0);

  const earningsGrowth = lastMonthEarnings > 0 
    ? Math.round(((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
    : 12; // Default demo value
  
  // Demo insights (rotate based on data or show default)
  const insight = currentMonthEarnings > 0 && lastMonthEarnings > 0
    ? `Your earnings grew ${earningsGrowth > 0 ? '+' : ''}${earningsGrowth}% this month. Brands with 90% delivery rate earn 2.4× more — complete your deliverables to unlock higher paying deals.`
    : `Your earnings grew +12% this month. Brands with 90% delivery rate earn 2.4× more — complete your deliverables to unlock higher paying deals.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-[#0E121A] to-[#111827] border border-white/5 hover:border-white/10 transition-all rounded-2xl shadow-[0px_4px_24px_rgba(0,0,0,0.25)] px-5 py-4">
        <CardContent className="p-0">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex-shrink-0">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">AI Insights</span>
                {earningsGrowth > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{Math.abs(earningsGrowth)}%</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AIInsights;

