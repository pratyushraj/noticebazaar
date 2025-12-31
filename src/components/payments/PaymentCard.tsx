"use client";

import React, { memo } from 'react';
import { ArrowDownRight, CheckCircle, Clock, AlertCircle, CreditCard, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatIndianCurrency } from '@/lib/utils/currency';

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
  platform,
  amount,
  type,
  paymentStatus,
  expectedDate,
  daysInfo,
  riskLevel,
  method,
  invoice,
  tax,
  taxInfo,
  finalAmount,
  onClick,
}) => {
  // Payment status configuration
  const getPaymentStatusConfig = () => {
    if (type === 'received') {
      return {
        icon: CheckCircle,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        label: 'Received',
        statusColor: 'text-green-400',
      };
    }
    
    if (paymentStatus === 'overdue') {
      return {
        icon: AlertCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        label: 'Overdue',
        statusColor: 'text-red-400',
      };
    }
    
    if (paymentStatus === 'due_today') {
      return {
        icon: Clock,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        label: 'Due Today',
        statusColor: 'text-orange-400',
      };
    }
    
    return {
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      label: 'Pending',
      statusColor: 'text-yellow-400',
    };
  };

  const paymentStatusConfig = getPaymentStatusConfig();
  const PaymentStatusIcon = paymentStatusConfig.icon;

  // Risk level colors
  const riskColors = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-3xl before:pointer-events-none"
      role="button"
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Payment card: ${title} - ${dealName} - ${paymentStatusConfig.label}`}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-4">
        {/* Left: Circular Icon Bubble */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${paymentStatusConfig.bgColor} backdrop-blur-md shadow-lg`}>
          <ArrowDownRight className={`w-7 h-7 ${paymentStatusConfig.color}`} />
        </div>

        {/* Right: Amount + Risk Badge */}
        <div className="text-right ml-4 flex-shrink-0 flex flex-col items-end gap-2">
          <div className={`text-2xl font-bold ${
            type === 'expense' ? 'text-red-400' : 'text-green-400'
          }`}>
            {type === 'expense' ? '-' : '+'}{formatIndianCurrency(amount)}
          </div>
          
          {/* Risk Badge - Next to Amount */}
          {type !== 'received' && riskLevel && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskColors[riskLevel]}`}>
              {riskLevel === 'low' ? 'Low Risk' :
               riskLevel === 'medium' ? 'Medium Risk' :
               'High Risk'}
            </span>
          )}
        </div>
      </div>

      {/* Contract Title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1 text-white">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span>{dealName}</span>
          <span>•</span>
          <span>{platform}</span>
        </div>
      </div>

      {/* Status / Expected / Due */}
      <div className="flex items-center gap-2 flex-wrap mb-4 text-sm">
        <PaymentStatusIcon className={`w-4 h-4 ${paymentStatusConfig.statusColor} flex-shrink-0`} />
        <span className={`font-medium ${paymentStatusConfig.statusColor}`}>
          {paymentStatusConfig.label}
        </span>
        {type !== 'received' && expectedDate && (
          <>
            <span className="text-white/40">•</span>
            <span className="text-white/70">Expected: {expectedDate}</span>
          </>
        )}
        {daysInfo && (
          <>
            <span className="text-white/40">•</span>
            <span className={`${
              paymentStatus === 'overdue' ? 'text-red-400' :
              paymentStatus === 'due_today' ? 'text-orange-400' :
              'text-white/70'
            }`}>
              {daysInfo}
            </span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-4" />

      {/* Bottom Metadata Block - Apple Wallet Style */}
      <div className="space-y-2 text-xs">
        {/* Invoice */}
        <div className="text-white/60">
          Invoice: {invoice}
        </div>
        
        {/* Tax */}
        <div>
          {taxInfo ? (
            <span className={`text-xs opacity-80 ${
              taxInfo.riskLevel === 'high' ? 'text-[#FFD57A]' :
              taxInfo.riskLevel === 'medium' ? 'text-[#FFD57A]' :
              'text-white/60'
            }`}>
              Tax: {taxInfo.message}
            </span>
          ) : tax && tax > 0 ? (
            <span className="text-xs opacity-80 text-white/60">
              Tax: {formatIndianCurrency(tax)}
            </span>
          ) : (
            <span className="text-xs opacity-80 text-[#FFD57A]">
              Tax: Not Mentioned — Confirm with brand
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

PaymentCard.displayName = 'PaymentCard';

