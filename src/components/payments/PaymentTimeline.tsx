"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

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

  const getStatusColor = (daysDiff: number) => {
    if (daysDiff < 0) return 'text-red-500';
    if (daysDiff <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = (daysDiff: number) => {
    if (daysDiff < 0) return AlertCircle;
    if (daysDiff <= 7) return Clock;
    return CheckCircle;
  };

  return (
    <Card className="bg-card border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Payment Timeline</h3>
        </div>

        {/* Horizontal Scrollable Timeline */}
        <div className="relative overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex items-center gap-3 min-w-max">
            {/* Today marker */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full border-2 border-background"></div>
              <div className="text-[10px] text-muted-foreground font-medium">Today</div>
            </div>

            {timelineDeals.map((item, index) => {
              const StatusIcon = getStatusIcon(item.daysDiff);
              const isPastDue = item.daysDiff < 0;
              const isToday = item.daysDiff === 0;
              const isUpcoming = item.daysDiff > 0;

              return (
                <motion.div
                  key={item.deal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[90px]"
                >
                  <div className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 rounded-lg border bg-card w-full",
                    isPastDue && "border-red-500/30 bg-red-500/5",
                    isToday && "border-yellow-500/30 bg-yellow-500/5",
                    isUpcoming && "border-green-500/30 bg-green-500/5"
                  )}>
                    <BrandLogo
                      brandName={item.deal.brand_name}
                      brandLogo={null}
                      size="sm"
                    />
                    <div className="text-[10px] font-medium text-foreground text-center truncate w-full">
                      {item.deal.brand_name}
                    </div>
                    <div className={cn(
                      "text-[10px] font-bold",
                      getStatusColor(item.daysDiff)
                    )}>
                      {item.daysDiff < 0 ? `-${Math.abs(item.daysDiff)}d` : 
                       item.daysDiff === 0 ? 'Today' :
                       `+${item.daysDiff}d`}
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      ₹{(item.deal.deal_amount / 1000).toFixed(0)}K
                    </div>
                    <StatusIcon className={cn(
                      "w-3.5 h-3.5",
                      getStatusColor(item.daysDiff)
                    )} />
                  </div>
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

