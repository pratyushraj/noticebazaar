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

interface CombinedPaymentsCardProps {
  pendingPayments: number;
  pendingBrandCount: number;
  dueThisWeek: number;
  dueThisWeekCount: number;
  brandDeals?: BrandDeal[];
  onSendReminder?: (dealId: string) => void;
  isLoading?: boolean;
}

const CombinedPaymentsCard: React.FC<CombinedPaymentsCardProps> = ({
  pendingPayments,
  pendingBrandCount,
  dueThisWeek,
  dueThisWeekCount,
  brandDeals = [],
  onSendReminder,
  isLoading = false,
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

  const totalAmount = pendingPayments + dueThisWeek;

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
                  ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 shadow-red-500/20"
                  : "bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-emerald-500/30 shadow-emerald-500/20"
              )}>
                <IndianRupee className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  hasOverdue ? "text-red-300" : "text-emerald-300"
                )} />
              </div>
              <div>
                <span className="text-[15px] font-semibold text-white tracking-[-0.2px] block">
                  Payments
                </span>
                <span className="text-[11px] text-white/50 font-medium uppercase tracking-wide">
                  Overview
                </span>
              </div>
            </div>
            {hasOverdue && (
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
              </div>
            )}
          </div>

          <div className="space-y-3 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm text-white/70 text-[11px] font-medium border border-white/10">
                Pending ({pendingBrandCount})
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 backdrop-blur-sm text-amber-300 text-[11px] font-medium border border-amber-500/30">
                Due Soon ({dueThisWeekCount})
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-white tabular-nums tracking-tight leading-none">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              {hasOverdue && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-red-300 bg-red-500/20 border border-red-500/40">
                  Overdue
                </span>
              )}
            </div>
            
            {pendingBrands.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className="text-[12px] text-white/50 font-medium">From:</span>
                {pendingBrands.map((brand, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-white/10 to-white/5 
                               backdrop-blur-sm text-white/90 text-[13px] font-medium border border-white/10 
                               shadow-sm hover:from-white/15 hover:to-white/10 transition-all duration-150"
                  >
                    {brand}
                  </span>
                ))}
                {pendingBrandCount > 3 && (
                  <span className="text-[12px] text-white/50 font-medium">
                    +{pendingBrandCount - 3} more
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

