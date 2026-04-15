"use client";

import React from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { computePaymentStatus, computeDaysUntilDue, PaymentStatus } from '@/lib/constants/paymentStatus';

interface EnhancedPaymentCardProps {
  deal: BrandDeal;
  status?: PaymentStatus; // If not provided, computed from deal
  daysOverdue?: number;
  daysLeft?: number;
  onSendReminder?: (deal: BrandDeal) => void;
  onMarkPaid?: (deal: BrandDeal) => void;
  onViewDetails?: (deal: BrandDeal) => void;
}

const EnhancedPaymentCard: React.FC<EnhancedPaymentCardProps> = ({
  deal,
  status: propStatus,
  daysOverdue: propDaysOverdue,
  daysLeft: propDaysLeft,
  onSendReminder,
  onMarkPaid,
  onViewDetails,
}) => {
  // Compute status from deal if not provided
  const status = propStatus ?? computePaymentStatus(
    deal.payment_received_date,
    deal.payment_expected_date
  );

  // Compute days
  const computedDaysLeft = propDaysLeft ?? (status === 'upcoming' || status === 'pending'
    ? computeDaysUntilDue(deal.payment_expected_date)
    : null);
  const computedDaysOverdue = propDaysOverdue ?? (status === 'overdue'
    ? computeDaysUntilDue(deal.payment_expected_date)
      ? -computeDaysUntilDue(deal.payment_expected_date)!
      : undefined
    : undefined);

  const daysOverdue = computedDaysOverdue;
  const daysLeft = computedDaysLeft !== null && computedDaysLeft > 0 ? computedDaysLeft : null;

  // Reminder button logic
  const getReminderConfig = () => {
    if (status === 'overdue' && daysOverdue !== undefined && daysOverdue > 0) {
      if (daysOverdue >= 15) return { show: true, text: 'Send Urgent Reminder', variant: 'destructive' as const };
      if (daysOverdue >= 7) return { show: true, text: 'Send Firm Reminder', variant: 'default' as const };
      return { show: true, text: 'Send Reminder', variant: 'default' as const };
    }
    if (status === 'pending' && daysLeft !== null) {
      if (daysLeft <= 1) return { show: true, text: 'Send Reminder', variant: 'default' as const };
      if (daysLeft <= 3) return { show: true, text: 'Send Gentle Reminder', variant: 'outline' as const };
    }
    return { show: false, text: '', variant: 'outline' as const };
  };

  const reminderConfig = getReminderConfig();
  const displayDays = daysLeft ?? (daysOverdue ? -daysOverdue : null);

  const statusLabel = {
    overdue: 'Overdue',
    pending: 'Pending',
    upcoming: 'Scheduled',
    paid: 'Paid',
  }[status];

  const statusColor = {
    overdue: 'text-destructive',
    pending: 'text-yellow-400',
    upcoming: 'text-primary',
    paid: 'text-primary',
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="bg-secondary/[0.08] backdrop-blur-lg border border-border rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] p-4 md:p-5 transition-all hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-0.5"
        onContextMenu={(e) => {
          e.preventDefault();
          const invoiceId = deal.id.slice(0, 8);
          const shareableLink = `${window.location.origin}/i/${invoiceId}`;
          navigator.clipboard.writeText(shareableLink);
          toast.success('Invoice link copied!');
        }}
      >
        {/* Top Badge */}
        {displayDays !== null && (
          <div className={cn(
            'flex items-center gap-2 mb-4 px-3 py-2 rounded-lg',
            (displayDays <= 7 || status === 'overdue')
              ? 'bg-warning/20 border border-warning/20'
              : 'bg-card border border-border'
          )}>
            <Calendar className={cn(
              'w-4 h-4',
              (displayDays <= 7 || status === 'overdue') ? 'text-warning' : 'text-foreground/80'
            )} />
            <span className={cn(
              'text-sm font-medium',
              (displayDays <= 7 || status === 'overdue') ? 'text-warning' : 'text-foreground/80'
            )}>
              Payment Expected · {displayDays > 0 ? `${displayDays} days left` : `${Math.abs(displayDays)} days overdue`}
            </span>
          </div>
        )}

        {/* Brand Logo + Name + Platform + Amount */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-background to-slate-800 flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-[0_0_12px_2px_rgba(255,255,255,0.12)]">
              <BrandLogo
                brandName={deal.brand_name}
                brandLogo={null}
                size="md"
                className="w-full h-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg md:text-xl mb-1 text-foreground">{deal.brand_name}</h3>
              <p className="text-sm text-foreground/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary/40" />
                {deal.platform || 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl md:text-3xl font-bold text-foreground">₹{deal.deal_amount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Payment Status:</span>
            <span className={cn('font-medium', statusColor)}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Two Info Boxes */}
        <div className="flex items-center justify-between gap-3 md:gap-4 mb-5">
          <div className="bg-card rounded-lg px-3 py-2 border border-border flex-1">
            <p className="text-foreground/60 mb-1 text-xs">Payment History</p>
            <p className="font-medium text-foreground/80 text-sm">~35 days avg</p>
          </div>
          <div className="bg-card rounded-lg px-3 py-2 border border-border flex-1">
            <p className="text-foreground/60 mb-1 text-xs">Due Date</p>
            <p className="font-medium text-foreground/80 text-sm">
              {deal.payment_expected_date
                ? new Date(deal.payment_expected_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'TBD'}
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {reminderConfig.show && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Send reminder to ${deal.brand_name}?`)) {
                  onSendReminder?.(deal);
                }
              }}
              variant="outline"
              className="w-full min-h-[44px] px-4 py-3 bg-card hover:bg-secondary/50 rounded-xl font-medium text-base flex items-center justify-center gap-2 transition-all border border-border hover:border-border text-foreground/80"
              aria-label={`Send payment reminder to ${deal.brand_name}`}
            >
              <Send className="w-5 h-5" />
              {reminderConfig.text}
            </Button>
          )}
          {onMarkPaid && status !== 'paid' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkPaid(deal);
              }}
              className="w-full min-h-[44px] py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-xl shadow-emerald-900/40 border border-primary/30 text-foreground transition-all duration-300 ease-out hover:scale-[1.02]"
              aria-label={`Mark payment from ${deal.brand_name} as paid`}
            >
              <span className="opacity-90 text-lg">✔</span>
              Mark Paid
            </button>
          )}
          {onViewDetails && status === 'paid' && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(deal);
              }}
              variant="outline"
              className="w-full min-h-[44px] px-4 py-3 bg-card hover:bg-secondary/50 rounded-xl font-medium text-base flex items-center justify-center gap-2 transition-all border border-border text-foreground/80"
            >
              View Details
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedPaymentCard;
