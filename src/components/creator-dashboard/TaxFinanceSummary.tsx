"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingDown, FileText, MessageSquare } from 'lucide-react';
import { BrandDeal } from '@/types';

interface TaxFinanceSummaryProps {
  brandDeals?: BrandDeal[];
}

const TaxFinanceSummary: React.FC<TaxFinanceSummaryProps> = ({ brandDeals = [] }) => {
  // Calculate quarterly tax (approximate 30% of earnings)
  const currentQuarterEarnings = React.useMemo(() => {
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    
    return brandDeals
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const receivedDate = new Date(deal.payment_received_date);
        return receivedDate >= quarterStart && deal.status === 'Completed';
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
  }, [brandDeals]);

  const quarterlyTax = Math.round(currentQuarterEarnings * 0.3);
  const deductibleExpenses = Math.round(currentQuarterEarnings * 0.1); // Mock: 10% expenses
  const taxDueDate = new Date();
  taxDueDate.setMonth(taxDueDate.getMonth() + 3 - (taxDueDate.getMonth() % 3));
  taxDueDate.setDate(15); // 15th of quarter end month

  const daysUntilTaxDue = Math.ceil((taxDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="bg-gradient-to-br from-[#0E121A] to-[#111827] border border-white/5 rounded-2xl shadow-[0px_4px_24px_rgba(0,0,0,0.25)] px-5 py-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Calculator className="h-5 w-5 text-green-400 opacity-70" />
          Tax & Finance Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Quarterly Tax Due</span>
            <span className="text-lg font-bold text-white">₹{quarterlyTax.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <TrendingDown className="h-3 w-3" />
            <span>Due in {daysUntilTaxDue} days</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Deductible Expenses</span>
            <span className="text-lg font-bold text-green-400">₹{deductibleExpenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <FileText className="h-3 w-3" />
            <span>Logged this quarter</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <MessageSquare className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-white/70">
              <span className="font-semibold text-green-400">CA Recommendation:</span> Consider filing advance tax if earnings exceed ₹10L this quarter.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxFinanceSummary;

