"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface PaymentCardProps {
  id: string;
  title: string;
  dealName: string;
  platform: string;
  amount: number;
  type: 'received' | 'pending' | 'expense';
  paymentStatus: 'received' | 'pending' | 'due_today' | 'overdue';
  expectedDate?: string;
  daysInfo?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  method: string | null | undefined;
  invoice: string;
  tax?: number | null;
  taxInfo?: {
    message: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  finalAmount?: number;
  onClick?: () => void;
}

// replaced-by-ultra-polish: Memoized for performance
export const PaymentCard: React.FC<PaymentCardProps> = memo(({
  title,
  dealName,
  amount,
  type,
  paymentStatus,
  daysInfo,
  onClick,
}) => {

  // Format date info for display
  const formatDateInfo = () => {
    if (type === 'received' && daysInfo) {
      // Extract days from "Paid" or similar
      const daysMatch = daysInfo.match(/(\d+)\s+day/);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
      }
      return 'Paid';
    }
    if (type === 'pending' && daysInfo) {
      // Extract days from "Due in X days" or "Overdue by X days"
      if (daysInfo.includes('Overdue')) {
        const daysMatch = daysInfo.match(/(\d+)/);
        if (daysMatch) {
          return `Overdue ${daysMatch[1]} day${parseInt(daysMatch[1]) !== 1 ? 's' : ''} ago`;
        }
        return 'Overdue';
      }
      const daysMatch = daysInfo.match(/(\d+)/);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        return `Due in ${days} day${days !== 1 ? 's' : ''}`;
      }
      return 'Pending';
    }
    return type === 'received' ? 'Paid' : 'Pending';
  };

  // Get status pill color
  const getStatusPillColor = () => {
    if (type === 'received') {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (paymentStatus === 'overdue') {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15"
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
      {/* Simplified Layout: Brand Name | Status Pill | Amount */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand / Campaign Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-white truncate">{dealName}</h3>
          {title !== dealName && (
            <div className="text-sm text-white/60 truncate mt-0.5">{title}</div>
          )}
        </div>

        {/* Middle: Status Pill */}
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusPillColor()}`}>
            {formatDateInfo()}
          </span>
        </div>

        {/* Right: Amount (₹), bold */}
        <div className="flex-shrink-0 text-right">
          <div className={`text-lg md:text-xl font-bold ${
            type === 'expense' ? 'text-red-400' : 'text-green-400'
          }`}>
            {type === 'expense' ? '-' : ''}₹{Math.round(amount).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PaymentCard.displayName = 'PaymentCard';

