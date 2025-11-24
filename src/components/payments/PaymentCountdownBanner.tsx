"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import { BrandDeal } from '@/types';

interface PaymentCountdownBannerProps {
  brandDeals: BrandDeal[] | undefined;
}

export const PaymentCountdownBanner: React.FC<PaymentCountdownBannerProps> = ({ brandDeals }) => {
  const upcomingPayments = useMemo(() => {
    if (!brandDeals) return [];

    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    return brandDeals
      .filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now && dueDate <= next7Days;
      })
      .sort((a, b) => {
        const dateA = new Date(a.payment_expected_date).getTime();
        const dateB = new Date(b.payment_expected_date).getTime();
        return dateA - dateB;
      });
  }, [brandDeals]);

  const totalAmount = useMemo(() => {
    return upcomingPayments.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
  }, [upcomingPayments]);

  const daysUntilNext = useMemo(() => {
    if (upcomingPayments.length === 0) return null;
    const nextPayment = upcomingPayments[0];
    const dueDate = new Date(nextPayment.payment_expected_date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [upcomingPayments]);

  if (upcomingPayments.length === 0 || totalAmount === 0) return null;

  const progress = Math.max(0, Math.min(100, ((7 - (daysUntilNext || 7)) / 7) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-16 z-40 mb-6"
    >
      <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${progress} ${100 - progress}`}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <Clock className="absolute inset-0 m-auto w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm md:text-base truncate">
                ₹{totalAmount.toLocaleString('en-IN')} from {upcomingPayments.length} brand{upcomingPayments.length > 1 ? 's' : ''} drops in the next {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''}
              </p>
              <p className="text-white/70 text-xs mt-0.5">
                Next payment: {new Date(upcomingPayments[0].payment_expected_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-white/80 flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentCountdownBanner;

