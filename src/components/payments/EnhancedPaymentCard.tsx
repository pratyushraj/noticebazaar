"use client";

import React from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EnhancedPaymentCardProps {
  deal: BrandDeal;
  status: 'overdue' | 'pending' | 'upcoming' | 'paid';
  daysOverdue?: number;
  daysLeft?: number;
  onSendReminder?: (deal: BrandDeal) => void;
  onEscalate?: (deal: BrandDeal) => void;
  onMarkPaid?: (deal: BrandDeal) => void;
  onViewDetails?: (deal: BrandDeal) => void;
  onAddNote?: (deal: BrandDeal) => void;
}

const EnhancedPaymentCard: React.FC<EnhancedPaymentCardProps> = ({
  deal,
  status,
  daysOverdue,
  daysLeft,
  onSendReminder,
  onEscalate: _onEscalate,
  onMarkPaid,
  onViewDetails: _onViewDetails,
  onAddNote: _onAddNote,
}) => {
  // Mock reminder count (in real app, this would come from payment_reminders table)
  const remindersSent = daysOverdue && daysOverdue > 7 ? Math.floor(daysOverdue / 7) : 0;
  
  // Calculate days until due (for pending status)
  const daysUntilDue = daysLeft !== undefined ? daysLeft : null;
  
  // Determine if reminder button should be shown and what text to use
  const getReminderButtonConfig = () => {
    if (status === 'overdue' && daysOverdue) {
      if (daysOverdue >= 15) {
        return { show: true, text: 'Send Urgent Reminder', variant: 'destructive' as const, urgent: true };
      } else if (daysOverdue >= 7) {
        return { show: true, text: 'Send Firm Reminder', variant: 'default' as const, urgent: false };
      } else {
        return { show: true, text: 'Send Reminder', variant: 'default' as const, urgent: false };
      }
    } else if (status === 'pending' && daysUntilDue !== null) {
      if (daysUntilDue <= 1) {
        return { show: true, text: 'Send Reminder', variant: 'default' as const, urgent: false };
      } else if (daysUntilDue <= 3) {
        return { show: true, text: 'Send Gentle Reminder', variant: 'outline' as const, urgent: false };
      } else {
        return { show: false, text: '', variant: 'outline' as const, urgent: false };
      }
    }
    return { show: false, text: '', variant: 'outline' as const, urgent: false };
  };
  
  const reminderConfig = getReminderButtonConfig();

  // Mock brand payment history (in real app, this would be calculated from all deals with this brand)
  const brandPaymentHistory = {
    avgDays: 35,
    reliability: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    latePayments: 0,
  };
  
  // Get days left for display
  const displayDaysLeft = daysLeft !== undefined ? daysLeft : daysOverdue ? -daysOverdue : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5 hover:border-white/10 transition-all shadow-[0_0_25px_-6px_rgba(0,0,0,0.45)]">
        {/* Top Badge */}
        {displayDaysLeft !== null && (
          <div className={cn(
            "flex items-center gap-2 mb-4 px-3 py-2 rounded-lg",
            (displayDaysLeft <= 7 || status === 'overdue') 
              ? 'bg-amber-500/20 border border-amber-400/20' 
              : 'bg-white/5 border border-white/10'
          )}>
            <Calendar className={cn(
              "w-4 h-4",
              (displayDaysLeft <= 7 || status === 'overdue') ? 'text-amber-400' : 'text-white/80'
            )} />
            <span className={cn(
              "text-sm font-medium",
              (displayDaysLeft <= 7 || status === 'overdue') ? 'text-amber-400' : 'text-white/80'
            )}>
              Payment Expected · {displayDaysLeft > 0 ? `${displayDaysLeft} days left` : `${Math.abs(displayDaysLeft)} days overdue`}
            </span>
          </div>
        )}

        {/* Brand Logo + Name + Platform + Amount */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-[0_0_12px_2px_rgba(255,255,255,0.12)]">
              <BrandLogo
                brandName={deal.brand_name}
                brandLogo={null}
                size="md"
                className="w-full h-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg md:text-xl mb-1 text-white">{deal.brand_name}</h3>
              <p className="text-sm text-white/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/40"></span>
                {deal.platform || 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl md:text-3xl font-bold text-white">₹{deal.deal_amount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Payment Status:</span>
            <div className="text-right">
              <span className={cn(
                "font-medium",
                status === 'overdue' && 'text-red-400',
                status === 'pending' && 'text-yellow-400',
                status === 'upcoming' && 'text-emerald-400',
                status === 'paid' && 'text-emerald-400'
              )}>
                {status === 'overdue' ? 'Overdue' : 
                 status === 'pending' ? 'Pending' :
                 status === 'upcoming' ? 'Scheduled' : 'Paid'}
              </span>
              {status === 'overdue' && daysOverdue !== undefined && daysOverdue > 0 && (
                <div className="text-xs text-red-400 font-medium mt-0.5">
                  Overdue by {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two Info Boxes */}
        <div className="flex items-center justify-between gap-3 md:gap-4 mb-5">
          <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 flex-1">
            <p className="text-white/60 mb-1 text-xs">Payment History</p>
            <p className="font-medium text-white/80 text-sm">~{Math.abs(brandPaymentHistory.avgDays)} days avg</p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 flex-1">
            <p className="text-white/60 mb-1 text-xs">Due Date</p>
            <p className="font-medium text-white/80 text-sm">
              {new Date(deal.payment_expected_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {reminderConfig.show && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Send reminder to ${deal.brand_name}?\n\n${reminderConfig.urgent ? '⚠️ This payment is overdue. ' : ''}${remindersSent > 0 ? `\nPrevious reminder sent ${remindersSent} time${remindersSent > 1 ? 's' : ''}.` : ''}`)) {
                  onSendReminder?.(deal);
                }
              }}
              variant="outline"
              className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-white/20 text-white/80"
            >
              <Send className="w-4 h-4" />
              Send Reminder
            </Button>
          )}
          {onMarkPaid && status !== 'paid' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkPaid(deal);
              }}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-xl shadow-emerald-900/40 border border-emerald-500/30 text-white transition-all duration-300 ease-out hover:scale-[1.02]"
            >
              <span className="opacity-90 text-lg">✔</span>
              Mark Paid
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedPaymentCard;

