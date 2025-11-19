"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';

interface PaymentTimelineProps {
  allDeals: BrandDeal[];
}

const PaymentTimeline: React.FC<PaymentTimelineProps> = ({ allDeals }) => {
  const timelineDeals = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const paymentDeals = allDeals.filter(deal => 
      deal.status === 'Payment Pending' || deal.status === 'Completed'
    );

    return paymentDeals
      .map(deal => {
        const dueDate = new Date(deal.payment_expected_date);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          deal,
          daysDiff: diffDays,
          dueDate,
        };
      })
      .sort((a, b) => a.daysDiff - b.daysDiff)
      .slice(0, 5); // Show top 5
  }, [allDeals]);

  if (timelineDeals.length === 0) return null;

  const getStatusConfig = (daysDiff: number) => {
    if (daysDiff < 0) {
      return {
        color: 'red',
        textColor: 'text-red-300',
        bgGradient: 'from-red-500/20 via-red-500/10 to-red-500/5',
        borderColor: 'border-red-500/40',
        icon: AlertCircle,
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
      };
    }
    if (daysDiff <= 7) {
      return {
        color: 'amber',
        textColor: 'text-amber-300',
        bgGradient: 'from-amber-500/20 via-amber-500/10 to-amber-500/5',
        borderColor: 'border-amber-500/40',
        icon: Clock,
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      };
    }
    return {
      color: 'emerald',
      textColor: 'text-emerald-300',
      bgGradient: 'from-emerald-500/20 via-emerald-500/10 to-emerald-500/5',
      borderColor: 'border-emerald-500/40',
      icon: CheckCircle,
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    };
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-white/10">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      
      <CardContent className="p-5 md:p-6 relative z-10">
        {/* Premium Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 
                          flex items-center justify-center border border-blue-500/30 backdrop-blur-sm
                          shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <Calendar className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-white tracking-tight">Payment Timeline</h3>
              <p className="text-[11px] text-white/50 font-medium">Upcoming & overdue payments</p>
            </div>
          </div>
        </div>

        {/* Premium Timeline */}
        <div className="relative overflow-x-auto pb-3 -mx-2 px-2 scrollbar-hide">
          <div className="flex items-end gap-4 min-w-max">
            {/* Today marker - Premium */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 flex flex-col items-center gap-3 relative"
            >
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full 
                              border-2 border-white/20 shadow-[0_0_16px_rgba(59,130,246,0.6)] 
                              animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="text-[10px] text-blue-300 font-semibold uppercase tracking-wide">Today</div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-transparent"></div>
            </motion.div>

            {timelineDeals.map((item, index) => {
              const config = getStatusConfig(item.daysDiff);
              const StatusIcon = config.icon;
              const isPastDue = item.daysDiff < 0;
              const isToday = item.daysDiff === 0;
              const isUpcoming = item.daysDiff > 0;

              return (
                <motion.div
                  key={item.deal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-shrink-0 flex flex-col items-center gap-3 min-w-[100px] group relative"
                >
                  {/* Timeline connector */}
                  {index < timelineDeals.length - 1 && (
                    <div className={cn(
                      "absolute top-4 left-full w-4 h-0.5",
                      isPastDue ? "bg-gradient-to-r from-red-500/50 to-red-500/20" :
                      isToday ? "bg-gradient-to-r from-amber-500/50 to-amber-500/20" :
                      "bg-gradient-to-r from-emerald-500/50 to-emerald-500/20"
                    )} />
                  )}

                  {/* Premium Card */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex flex-col items-center gap-2.5 p-4 rounded-[14px] border backdrop-blur-xl w-full",
                      "bg-gradient-to-br", config.bgGradient,
                      config.borderColor,
                      config.glow,
                      "hover:shadow-lg transition-all duration-300 cursor-pointer",
                      "group-hover:border-opacity-60"
                    )}
                  >
                    {/* Subtle inner glow */}
                    <div className={cn(
                      "absolute inset-0 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      isPastDue ? "bg-gradient-to-br from-red-500/10 to-transparent" :
                      isToday ? "bg-gradient-to-br from-amber-500/10 to-transparent" :
                      "bg-gradient-to-br from-emerald-500/10 to-transparent"
                    )} />

                    <div className="relative z-10 w-full flex flex-col items-center gap-2.5">
                      {/* Brand Logo */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                        <BrandLogo
                          brandName={item.deal.brand_name}
                          brandLogo={null}
                          size="sm"
                        />
                      </div>

                      {/* Brand Name */}
                      <div className="text-[11px] font-semibold text-white text-center truncate w-full leading-tight">
                        {item.deal.brand_name}
                      </div>

                      {/* Days Badge */}
                      <div className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                        "border backdrop-blur-sm",
                        isPastDue 
                          ? "bg-red-500/25 text-red-200 border-red-500/50" 
                          : isToday
                          ? "bg-amber-500/25 text-amber-200 border-amber-500/50"
                          : "bg-emerald-500/25 text-emerald-200 border-emerald-500/50"
                      )}>
                        {item.daysDiff < 0 ? `-${Math.abs(item.daysDiff)}d` : 
                         item.daysDiff === 0 ? 'Today' :
                         `+${item.daysDiff}d`}
                      </div>

                      {/* Amount */}
                      <div className="text-[14px] font-bold text-white tabular-nums tracking-tight">
                        ₹{(item.deal.deal_amount / 1000).toFixed(0)}K
                      </div>

                      {/* Status Icon */}
                      <div className={cn(
                        "p-1.5 rounded-lg backdrop-blur-sm border",
                        isPastDue 
                          ? "bg-red-500/20 border-red-500/40" 
                          : isToday
                          ? "bg-amber-500/20 border-amber-500/40"
                          : "bg-emerald-500/20 border-emerald-500/40"
                      )}>
                        <StatusIcon className={cn(
                          "w-3.5 h-3.5",
                          config.textColor
                        )} />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentTimeline;

