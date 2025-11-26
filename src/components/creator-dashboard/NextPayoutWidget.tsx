"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianRupee, Clock, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { BrandDeal } from '@/types';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NextPayoutWidgetProps {
  brandDeals?: BrandDeal[];
}

type PayoutStatus = 'approved' | 'pending' | 'processing';

const NextPayoutWidget: React.FC<NextPayoutWidgetProps> = ({ brandDeals = [] }) => {
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const navigate = useNavigate();

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
  
  // Determine status and urgency
  const getStatus = (): { status: PayoutStatus; color: string; bgColor: string; borderColor: string; label: string } => {
    if (daysUntil <= 1) {
      return {
        status: 'approved',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        label: 'Approved'
      };
    } else if (daysUntil <= 3) {
      return {
        status: 'processing',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        label: 'Processing'
      };
    } else {
      return {
        status: 'pending',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        label: 'Pending'
      };
    }
  };

  const statusInfo = getStatus();
  
  // Progress steps (2/3 complete example)
  const progressSteps = 2;
  const totalSteps = 3;
  const needsAction = statusInfo.status === 'pending' && daysUntil > 7;

  // Format date
  const dueDate = new Date(deal.payment_expected_date);
  const formattedDate = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className={cn(
        "backdrop-blur-[40px] border rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-2xl hover:-translate-y-0.5 transition-all overflow-hidden relative",
        statusInfo.status === 'approved' && "bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 border-green-500/30",
        statusInfo.status === 'processing' && "bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border-blue-500/30",
        statusInfo.status === 'pending' && "bg-gradient-to-br from-orange-500/20 via-amber-500/20 to-yellow-500/20 border-orange-500/30"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
        <CardContent className="p-6 relative z-10">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="w-5 h-5 text-white/80" />
                  <span className="text-sm font-medium text-white/80">Your Next Payout</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  ₹{deal.deal_amount.toLocaleString('en-IN')}
                </h3>
                
                {/* Platform/Source */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-white/70">
                    {deal.platform || 'Direct'}
                  </span>
                  <span className="text-sm text-white/60">
                    from <span className="font-semibold text-white/90">{deal.brand_name}</span>
                  </span>
                </div>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="w-8 h-8 text-white/80" />
              </div>
            </div>

            {/* Status & Date Row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Status Badge */}
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
                  statusInfo.bgColor,
                  statusInfo.borderColor
                )}>
                  {statusInfo.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  {statusInfo.status === 'processing' && <Clock className="w-4 h-4 text-blue-400" />}
                  {statusInfo.status === 'pending' && <AlertCircle className="w-4 h-4 text-orange-400" />}
                  <span className={cn("text-xs font-semibold", statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>
                
                {/* Payout Date */}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white/70">
                    Due: <span className="font-semibold text-white">{formattedDate}</span>
                  </span>
                  {timeRemaining && timeRemaining.days > 0 && (
                    <span className="text-xs text-white/50">
                      ({timeRemaining.days} day{timeRemaining.days !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            {statusInfo.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Payout Progress</span>
                  <span className="text-white/80 font-semibold">
                    {progressSteps}/{totalSteps} steps complete
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(progressSteps / totalSteps) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Action Required */}
            {needsAction && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-orange-400 font-medium">
                  ⚠️ Action required: Upload invoice to proceed
                </p>
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={() => navigate('/creator-payments')}
              className={cn(
                "w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all",
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <span className="font-semibold">View Details</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NextPayoutWidget;

