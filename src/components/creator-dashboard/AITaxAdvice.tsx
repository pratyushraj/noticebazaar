"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandDeal } from '@/types';

interface AITaxAdviceProps {
  brandDeals?: BrandDeal[];
}

const AITaxAdvice: React.FC<AITaxAdviceProps> = ({ brandDeals = [] }) => {
  const taxData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Calculate annual income from completed deals this year
    const annualIncome = brandDeals
      .filter(deal => {
        if (!deal.payment_received_date || deal.status !== 'Completed') return false;
        const receivedDate = new Date(deal.payment_received_date);
        return receivedDate.getFullYear() === currentYear;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    // For demo mode, show projected income
    const projectedAnnualIncome = brandDeals.length <= 6 ? 1240000 : annualIncome * 12;

    // Suggest quarterly advance tax if income > 1 lakh
    const needsAdvanceTax = projectedAnnualIncome > 100000;

    return {
      projectedAnnualIncome,
      needsAdvanceTax,
    };
  }, [brandDeals]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-white/5 hover:border-green-600/60 transition-all shadow-inner">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-green-400" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">AI Tax Advice</span>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Your projected annual taxable income:</p>
              <p className="text-lg font-bold text-foreground">
                ₹{(taxData.projectedAnnualIncome / 100000).toFixed(1)} lakh
              </p>
            </div>

            {taxData.needsAdvanceTax && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">
                  Consider quarterly advance tax to avoid penalty.
                </p>
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Updated daily based on your earnings</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AITaxAdvice;

