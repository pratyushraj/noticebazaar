"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PaymentStatus, computeDaysUntilDue, PAYMENT_STATUS_CONFIG } from '@/lib/constants/paymentStatus';

interface PaymentCardProps {
  id: string;
  title: string;
  dealName: string;
  platform: string;
  amount: number;
  type: 'received' | 'pending' | 'expense';
  paymentStatus: PaymentStatus;
  expectedDate?: string;
  daysInfo?: string;
  riskLevel?: 'low' | 'moderate' | 'high';
  method: string | null | undefined;
  invoice: string;
  tax?: number | null;
  taxInfo?: {
    message: string;
    riskLevel: 'low' | 'moderate' | 'high';
  };
  finalAmount?: number;
  onClick?: () => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = memo(({
  title,
  dealName,
  amount,
  type,
  paymentStatus,
  daysInfo,
  onClick,
}) => {
  // Determine badge text
  const getBadge = () => {
    if (type === 'received') {
      return { text: 'Paid', ...PAYMENT_STATUS_CONFIG.paid };
    }
    if (paymentStatus === 'overdue') {
      return { text: 'Overdue', ...PAYMENT_STATUS_CONFIG.overdue };
    }
    if (paymentStatus === 'due_today') {
      return { text: 'Due today', ...PAYMENT_STATUS_CONFIG.upcoming };
    }
    if (daysInfo?.includes('Due in')) {
      const match = daysInfo.match(/(\d+)/);
      return match
        ? { text: `Due in ${match[1]} days`, ...PAYMENT_STATUS_CONFIG.upcoming }
        : { text: 'Pending', ...PAYMENT_STATUS_CONFIG.pending };
    }
    return { text: 'Pending', ...PAYMENT_STATUS_CONFIG.pending };
  };

  const badge = getBadge();

  // Extract campaign name from title if different from brand name
  const campaignName = title !== dealName && title !== `${dealName} Campaign`
    ? title.replace(`${dealName} `, '').replace(' Campaign', '')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative bg-card backdrop-blur-xl rounded-xl p-3.5 border border-border cursor-pointer transition-all duration-200 hover:bg-secondary/7 hover:border-border"
      role="button"
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Payment: ${dealName} - ${type === 'received' ? 'Paid' : 'Pending'}`}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand Name (bold) and Campaign Name (muted) */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate">{dealName}</h3>
          {campaignName && (
            <div className="text-sm text-foreground/60 truncate mt-0.5">{campaignName}</div>
          )}
        </div>

        {/* Right: Amount and Badge */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <div className={`text-lg font-bold ${
            type === 'expense' ? 'text-destructive' : 'text-foreground'
          }`}>
            {type === 'expense' ? '-' : ''}₹{Math.round(amount).toLocaleString('en-IN')}
          </div>

          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
            badge.colorClass
          )}>
            {badge.text}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

PaymentCard.displayName = 'PaymentCard';
