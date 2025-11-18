"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BrandDeal } from '@/types';

interface CombinedPaymentsCardProps {
  pendingPayments: number;
  pendingBrandCount: number;
  dueThisWeek: number;
  dueThisWeekCount: number;
  brandDeals?: BrandDeal[];
  onSendReminder?: (dealId: string) => void;
}

const CombinedPaymentsCard: React.FC<CombinedPaymentsCardProps> = ({
  pendingPayments,
  pendingBrandCount,
  dueThisWeek,
  dueThisWeekCount,
  brandDeals = [],
  onSendReminder,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <Card
        className={cn(
          "bg-gradient-to-br from-amber-900/30 to-amber-950/20 border border-amber-700/40 rounded-xl overflow-hidden hover:border-amber-600/60 transition-all cursor-pointer shadow-[0_0_20px_-6px_rgba(255,255,255,0.1)]",
          hasOverdue && "border-red-500/50"
        )}
        onClick={() => navigate('/creator-payments')}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm font-semibold text-foreground">Payments</span>
            </div>
            {hasOverdue && (
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            )}
          </div>

          <div className="space-y-2 mb-3">
            <div className="text-xs text-muted-foreground">
              Pending ({pendingBrandCount}) • Due Soon ({dueThisWeekCount})
            </div>
            <div className="text-3xl font-bold text-foreground tabular-nums">
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
            {pendingBrands.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {pendingBrands.map((brand, idx) => (
                  <span key={idx}>
                    {brand}
                    {idx < pendingBrands.length - 1 ? '. ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CombinedPaymentsCard;

