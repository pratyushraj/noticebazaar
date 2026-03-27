"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ChevronRight } from 'lucide-react';
import { BrandDeal } from '@/types';
import { motion } from 'framer-motion';

interface TaxSummaryCardProps {
  allDeals: BrandDeal[];
}

const TaxSummaryCard: React.FC<TaxSummaryCardProps> = ({ allDeals }) => {
  const taxData = useMemo(() => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const currentYear = now.getFullYear();
    const quarterStartMonth = currentQuarter * 3;

    const quarterDeals = allDeals.filter(deal => {
      if (!deal.payment_received_date || deal.status !== 'Completed') return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() >= quarterStartMonth &&
             receivedDate.getMonth() < quarterStartMonth + 3 &&
             receivedDate.getFullYear() === currentYear;
    });

    const totalIncome = quarterDeals.reduce((sum, deal) => sum + deal.deal_amount, 0);
    const estimatedGST = Math.round(totalIncome * 0.12); // 12% GST
    const estimatedTDS = Math.round(totalIncome * 0.10); // 10% TDS

    return {
      totalIncome,
      estimatedGST,
      estimatedTDS,
    };
  }, [allDeals]);

  if (taxData.totalIncome === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-card border-border/40">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg font-semibold">Tax Summary (This Quarter)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Income</span>
              <span className="text-lg font-bold text-foreground">
                ₹{taxData.totalIncome.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated GST</span>
              <span className="text-base font-semibold text-foreground">
                ₹{taxData.estimatedGST.toLocaleString('en-IN')} (12%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">TDS Deducted</span>
              <span className="text-base font-semibold text-foreground">
                ₹{taxData.estimatedTDS.toLocaleString('en-IN')} (10%)
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {}}
            >
              <Download className="w-3 h-3 mr-1" />
              Download Report
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {}}
            >
              View Breakdown
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TaxSummaryCard;

