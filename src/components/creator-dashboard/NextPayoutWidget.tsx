"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock } from 'lucide-react';
import { BrandDeal } from '@/types';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';

interface NextPayoutWidgetProps {
  brandDeals?: BrandDeal[];
}

const NextPayoutWidget: React.FC<NextPayoutWidgetProps> = ({ brandDeals = [] }) => {
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  const nextPayout = useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) return null;

    const now = new Date();
    const upcomingPayments = brandDeals
      .filter(deal => {
        if (deal.status !== 'Payment Pending' || deal.payment_received_date) return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now;
      })
      .map(deal => ({
        deal,
        daysUntil: Math.ceil((new Date(deal.payment_expected_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return upcomingPayments.length > 0 ? upcomingPayments[0] : null;
  }, [brandDeals]);

  useEffect(() => {
    if (!nextPayout) return;

    const updateTimer = () => {
      const now = new Date();
      const dueDate = new Date(nextPayout.deal.payment_expected_date);
      const diff = dueDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining({ days, hours, minutes });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextPayout]);

  if (!nextPayout) return null;

  const { deal, daysUntil } = nextPayout;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-[40px] border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-0.5 transition-all overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-white/80">Your Next Payout</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
                ₹{deal.deal_amount.toLocaleString('en-IN')}
              </h3>
              <p className="text-sm text-white/60 mb-4">
                from <span className="font-semibold text-white/90">{deal.brand_name}</span>
              </p>
              
              {timeRemaining ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/80">
                    Expected in{' '}
                    {timeRemaining.days > 0 && (
                      <span className="font-semibold text-white">{timeRemaining.days} day{timeRemaining.days !== 1 ? 's' : ''}</span>
                    )}
                    {timeRemaining.days === 0 && timeRemaining.hours > 0 && (
                      <span className="font-semibold text-white">{timeRemaining.hours} hour{timeRemaining.hours !== 1 ? 's' : ''}</span>
                    )}
                    {timeRemaining.days === 0 && timeRemaining.hours === 0 && (
                      <span className="font-semibold text-white">{timeRemaining.minutes} minute{timeRemaining.minutes !== 1 ? 's' : ''}</span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">Due: {formatDate(deal.payment_expected_date)}</span>
                </div>
              )}
            </div>
            <div className="h-16 w-16 rounded-2xl bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NextPayoutWidget;

