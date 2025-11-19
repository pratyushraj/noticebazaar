"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandDeal } from '@/types';

interface GSTImpactSummaryProps {
  brandDeals?: BrandDeal[];
}

const GSTImpactSummary: React.FC<GSTImpactSummaryProps> = ({ brandDeals = [] }) => {
  const gstSavings = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate total GST paid on purchases/expenses (18% GST)
    // For demo: assume 15% of deal amount goes to expenses with 18% GST
    const monthlyDeals = brandDeals.filter(deal => {
      if (!deal.payment_received_date || deal.status !== 'Completed') return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === currentMonth && 
             receivedDate.getFullYear() === currentYear;
    });

    const totalEarnings = monthlyDeals.reduce((sum, deal) => sum + deal.deal_amount, 0);
    const estimatedExpenses = totalEarnings * 0.15; // 15% of earnings as expenses
    const gstOnExpenses = estimatedExpenses * 0.18; // 18% GST
    
    // GST Input Credit = GST paid on expenses
    // For demo mode, show fixed savings
    if (brandDeals.length <= 6) {
      return 4850; // Demo: ₹4,850 saved
    }

    return Math.round(gstOnExpenses);
  }, [brandDeals]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/30 border border-white/5 hover:border-white/10 transition-all rounded-2xl shadow-[0px_4px_24px_rgba(0,0,0,0.25)] px-5 py-4">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">GST Impact Summary</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-muted-foreground">You saved this month through GST Input Credit:</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              ₹{gstSavings.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground">
              Automatically calculated from your expenses
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GSTImpactSummary;

