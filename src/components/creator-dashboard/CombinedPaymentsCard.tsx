"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BrandDeal } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Wallet } from 'lucide-react';
import { computePaymentStatus, computeDaysUntilDue } from '@/lib/constants/paymentStatus';

interface CombinedPaymentsCardProps {
  brandDeals?: BrandDeal[];
  onSendReminder?: (dealId: string) => void;
  isLoading?: boolean;
}

const CombinedPaymentsCard: React.FC<CombinedPaymentsCardProps> = ({
  brandDeals = [],
  onSendReminder,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  // Calculate all stats using unified helpers
  const { pendingAmount, pendingCount, dueSoonAmount, dueSoonCount, hasOverdue, pendingBrands } = useMemo(() => {
    let pendingAmount = 0;
    let pendingCount = 0;
    let dueSoonAmount = 0;
    let dueSoonCount = 0;
    let hasOverdue = false;
    const pendingBrands: string[] = [];

    for (const deal of brandDeals) {
      const status = computePaymentStatus(deal.payment_received_date, deal.payment_expected_date);
      const days = computeDaysUntilDue(deal.payment_expected_date);
      const amount = deal.deal_amount || 0;

      if (status === 'paid') continue;

      if (status === 'overdue') {
        hasOverdue = true;
        pendingAmount += amount;
        pendingCount++;
        if (!pendingBrands.includes(deal.brand_name)) pendingBrands.push(deal.brand_name);
      } else if (days !== null && days <= 7) {
        dueSoonAmount += amount;
        dueSoonCount++;
      } else {
        pendingAmount += amount;
        pendingCount++;
        if (!pendingBrands.includes(deal.brand_name)) pendingBrands.push(deal.brand_name);
      }
    }

    return { pendingAmount, pendingCount, dueSoonAmount, dueSoonCount, hasOverdue, pendingBrands };
  }, [brandDeals]);

  const totalAmount = pendingAmount + dueSoonAmount;

  if (isLoading) {
    return (
          <Card variant="secondary">
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (totalAmount === 0 && !isLoading) {
    return (
          <Card variant="secondary" interactive onClick={() => navigate('/creator-payments')}>
        <CardContent>
          <EmptyState
            icon={Wallet}
            title="No pending payments"
            description="All caught up! Payments will appear here when deals are completed."
            actionLabel="View All Payments"
            onAction={() => navigate('/creator-payments')}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      <Card
            variant={hasOverdue ? "attention" : "secondary"}
        interactive
        onClick={() => navigate('/creator-payments')}
        className="relative overflow-hidden"
      >
        {/* Premium gradient overlay */}
        <div className={cn(
          "absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none",
          hasOverdue 
            ? "bg-gradient-to-br from-red-500/10 via-transparent to-transparent" 
            : "bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent"
        )} />
        
        <CardContent className="relative z-10">
          <div className="flex items-center justify-between mb-5 pt-1">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg transition-all duration-200",
                hasOverdue
                  ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border border-destructive/30 shadow-red-500/20"
                  : "bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-primary/30 shadow-emerald-500/20"
              )}>
                <IndianRupee className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  hasOverdue ? "text-destructive" : "text-primary"
                )} />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-foreground tracking-[-0.2px] block">
                  Payments
                </span>
                <span className="text-[11px] text-foreground/50 font-medium uppercase tracking-wide">
                  Overview
                </span>
              </div>
            </div>
            {hasOverdue && (
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-destructive animate-ping opacity-75" />
              </div>
            )}
          </div>

          <div className="space-y-3 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-secondary/50 backdrop-blur-sm text-foreground/70 text-[11px] font-medium border border-border">
                Pending ({pendingCount})
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-warning/20 backdrop-blur-sm text-warning text-[11px] font-medium border border-warning/30">
                Due Soon ({dueSoonCount})
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-foreground tabular-nums tracking-tight leading-none">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              {hasOverdue && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-destructive bg-destructive/20 border border-destructive/40">
                  Overdue
                </span>
              )}
            </div>
            
            {pendingBrands.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className="text-[12px] text-foreground/50 font-medium">From:</span>
                {pendingBrands.map((brand, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-white/10 to-white/5 
                               backdrop-blur-sm text-foreground/90 text-[13px] font-medium border border-border 
                               shadow-sm hover:from-white/15 hover:to-white/10 transition-all duration-150"
                  >
                    {brand}
                  </span>
                ))}
                {pendingCount > 3 && (
                  <span className="text-[12px] text-foreground/50 font-medium">
                    +{pendingCount - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CombinedPaymentsCard;

