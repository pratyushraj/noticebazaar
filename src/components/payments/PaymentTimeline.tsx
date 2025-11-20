"use client";

import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertCircle, Clock } from 'lucide-react';

interface PaymentTimelineProps {
  allDeals: BrandDeal[];
}

const PaymentTimeline: React.FC<PaymentTimelineProps> = ({ allDeals }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

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
      .slice(0, 5);
  }, [allDeals]);

  if (timelineDeals.length === 0) return null;

  const getStatusConfig = (daysDiff: number) => {
    if (daysDiff < 0) {
      return {
        color: 'red',
        textColor: 'text-red-300',
        bgGradient: 'from-red-500/20 via-red-500/10 to-red-500/5',
        borderColor: 'border-red-500/40',
        chipBg: 'bg-red-500/25',
        chipText: 'text-red-200',
        chipBorder: 'border-red-500/50',
        icon: AlertCircle,
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
      };
    }
    if (daysDiff <= 7) {
      return {
        color: 'amber',
        textColor: 'text-amber-300',
        bgGradient: 'from-amber-500/20 via-amber-500/10 to-amber-500/5',
        borderColor: 'border-amber-500/40',
        chipBg: 'bg-amber-500/25',
        chipText: 'text-amber-200',
        chipBorder: 'border-amber-500/50',
        icon: Clock,
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
      };
    }
    return {
      color: 'emerald',
      textColor: 'text-emerald-300',
      bgGradient: 'from-emerald-500/20 via-emerald-500/10 to-emerald-500/5',
      borderColor: 'border-emerald-500/40',
      chipBg: 'bg-emerald-500/25',
      chipText: 'text-emerald-200',
      chipBorder: 'border-emerald-500/50',
      icon: Clock,
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    };
  };

  const handleNext = () => {
    if (currentIndex < timelineDeals.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const canGoNext = currentIndex < timelineDeals.length - 1;
  const canGoPrev = currentIndex > 0;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-white/10">
      <CardContent className="p-4 sm:p-5 md:p-6 relative z-10">
        {/* Premium Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 
                          flex items-center justify-center border border-blue-500/30 backdrop-blur-sm
                          shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-[16px] font-semibold text-white tracking-tight">Payment Timeline</h3>
              <p className="text-[10px] sm:text-[11px] text-white/50 font-medium">Upcoming & overdue payments</p>
            </div>
          </div>
        </div>

        {/* Apple Wallet-Style Carousel */}
        <div className="relative">
          {/* Carousel Container */}
          <div 
            ref={carouselRef}
            className="relative overflow-hidden rounded-2xl"
            style={{ 
              perspective: '1000px',
            }}
          >
            <motion.div
              className="flex gap-4"
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                mass: 0.8
              }}
              style={{ x }}
            >
              {timelineDeals.map((item, index) => {
                const config = getStatusConfig(item.daysDiff);
                const StatusIcon = config.icon;
                const isPastDue = item.daysDiff < 0;
                const daysDisplay = isPastDue 
                  ? `-${Math.abs(item.daysDiff)}D` 
                  : item.daysDiff === 0 
                    ? 'TODAY' 
                    : `+${item.daysDiff}D`;

                return (
                  <motion.div
                    key={item.deal.id}
                    className={cn(
                      "flex-shrink-0 w-full",
                      "min-w-0"
                    )}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Apple Wallet-Style Card */}
                    <div className={cn(
                      "relative rounded-[20px] border backdrop-blur-xl overflow-hidden",
                      "bg-gradient-to-br", config.bgGradient,
                      config.borderColor,
                      config.glow,
                      "h-[220px] sm:h-[240px] md:h-[260px]",
                      "transition-all duration-300",
                      "hover:scale-[1.02] hover:shadow-lg"
                    )}>
                      {/* Subtle glassmorphic overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Card Content */}
                      <div className="relative z-10 h-full flex flex-col p-5 sm:p-6 md:p-7">
                        {/* Top Section: Brand Logo & Status Chip */}
                        <div className="flex items-start justify-between mb-4">
                          {/* Large Brand Logo */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl opacity-50" />
                            <BrandLogo
                              brandName={item.deal.brand_name}
                              brandLogo={null}
                              size="lg"
                              className="relative z-10"
                            />
                          </div>
                          
                          {/* Status Chip */}
                          <div className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                            "border backdrop-blur-sm",
                            config.chipBg,
                            config.chipText,
                            config.chipBorder,
                            "shadow-sm"
                          )}>
                            {daysDisplay}
                          </div>
                        </div>

                        {/* Middle Section: Large Amount */}
                        <div className="flex-1 flex items-center justify-center mb-4">
                          <div className="text-center">
                            <div className="text-[11px] sm:text-xs text-white/60 uppercase tracking-wider mb-1 font-medium">
                              Amount Due
                            </div>
                            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tabular-nums tracking-tight">
                              ₹{(item.deal.deal_amount / 1000).toFixed(0)}K
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: Timeline Bar */}
                        <div className="space-y-2">
                          {/* Status Indicator */}
                          <div className="flex items-center gap-2">
                            <StatusIcon className={cn("w-4 h-4", config.textColor)} />
                            <span className={cn("text-xs font-semibold uppercase tracking-wide", config.textColor)}>
                              {isPastDue ? 'Overdue' : item.daysDiff === 0 ? 'Due Today' : 'Upcoming'}
                            </span>
                          </div>
                          
                          {/* Timeline Progress Bar */}
                          <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              className={cn(
                                "absolute inset-y-0 left-0 h-full rounded-full",
                                isPastDue ? "bg-red-500" : 
                                item.daysDiff <= 7 ? "bg-amber-500" : 
                                "bg-emerald-500"
                              )}
                              initial={{ width: 0 }}
                              animate={{ 
                                width: isPastDue 
                                  ? '100%' 
                                  : item.daysDiff === 0 
                                    ? '50%' 
                                    : `${Math.min((item.daysDiff / 30) * 100, 100)}%`
                              }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-white/10 backdrop-blur-sm border border-white/20",
                "transition-all duration-200",
                canGoPrev
                  ? "hover:bg-white/20 hover:border-white/30 cursor-pointer active:scale-95"
                  : "opacity-40 cursor-not-allowed"
              )}
              aria-label="Previous payment"
            >
              <ChevronLeft className="w-5 h-5 text-white/80" />
            </button>
            
            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {timelineDeals.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200",
                    index === currentIndex
                      ? "w-6 bg-blue-400"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  )}
                  aria-label={`Go to payment ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-white/10 backdrop-blur-sm border border-white/20",
                "transition-all duration-200",
                canGoNext
                  ? "hover:bg-white/20 hover:border-white/30 cursor-pointer active:scale-95"
                  : "opacity-40 cursor-not-allowed"
              )}
              aria-label="Next payment"
            >
              <ChevronRight className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentTimeline;
