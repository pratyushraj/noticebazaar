"use client";

import React from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CheckCircle2,
  Send,
  Instagram,
  Youtube,
  Music,
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
  onEscalate,
  onMarkPaid,
  onViewDetails,
  onAddNote,
}) => {
  // Get platform icon
  const getPlatformIcon = (platform: string | null) => {
    if (!platform) return null;
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('instagram')) return Instagram;
    if (platformLower.includes('youtube')) return Youtube;
    if (platformLower.includes('tiktok')) return Music;
    return null;
  };

  const PlatformIcon = getPlatformIcon(deal.platform);

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

  // Mock communication history
  const communicationHistory = [
    { date: new Date(deal.payment_expected_date), type: 'invoice_sent', method: 'email' },
    ...(remindersSent > 0 ? [
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), type: 'reminder', method: 'email' },
      { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), type: 'reminder', method: 'email' },
    ] : []),
  ].slice(0, 4);

  // Mock brand payment history (in real app, this would be calculated from all deals with this brand)
  const brandPaymentHistory = {
    avgDays: 35,
    reliability: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    latePayments: 0,
  };

  // Calculate progress percentage
  const progress = status === 'paid' ? 100 : status === 'overdue' ? 0 : status === 'pending' ? 65 : 85;
  
  // Get days left for display
  const displayDaysLeft = daysLeft !== undefined ? daysLeft : daysOverdue ? -daysOverdue : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-all">
        {/* Urgency Banner */}
        {displayDaysLeft !== null && (
          <div className={cn(
            "flex items-center gap-2 mb-4 px-3 py-2 rounded-lg",
            (displayDaysLeft <= 7 || status === 'overdue') 
              ? 'bg-amber-500/20 border border-amber-500/30' 
              : 'bg-blue-500/20 border border-blue-500/30'
          )}>
            <Calendar className={cn(
              "w-4 h-4",
              (displayDaysLeft <= 7 || status === 'overdue') ? 'text-amber-400' : 'text-blue-400'
            )} />
            <span className={cn(
              "text-sm font-medium",
              (displayDaysLeft <= 7 || status === 'overdue') ? 'text-amber-400' : 'text-blue-400'
            )}>
              Payment Expected · {displayDaysLeft > 0 ? `${displayDaysLeft} days left` : `${Math.abs(displayDaysLeft)} days overdue`}
            </span>
          </div>
        )}

        {/* Company Info */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl shadow-lg">
              <BrandLogo
                brandName={deal.brand_name}
                brandLogo={null}
                size="md"
                className="w-full h-full"
              />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1">{deal.brand_name}</h3>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                {deal.platform || 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400 mb-1">Amount</p>
            <p className="text-2xl font-bold">₹{deal.deal_amount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Progress & Status */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Payment Status</span>
              <span className={cn(
                "font-medium",
                status === 'overdue' && 'text-red-400',
                status === 'pending' && 'text-amber-400',
                status === 'upcoming' && 'text-green-400',
                status === 'paid' && 'text-emerald-400'
              )}>
                {status === 'overdue' ? 'Overdue' : 
                 status === 'pending' ? 'Pending' :
                 status === 'upcoming' ? 'Scheduled' : 'Paid'}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "h-full rounded-full transition-all",
                  status === 'paid' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                  status === 'overdue' ? 'bg-gradient-to-r from-red-500 to-red-400' :
                  status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                  'bg-gradient-to-r from-green-500 to-green-400'
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50">
              <p className="text-slate-500 mb-1">Payment History</p>
              <p className="font-medium">~{Math.abs(brandPaymentHistory.avgDays)} days avg</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50">
              <p className="text-slate-500 mb-1">Due Date</p>
              <p className="font-medium">
                {new Date(deal.payment_expected_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
          {reminderConfig.show && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Send reminder to ${deal.brand_name}?\n\n${reminderConfig.urgent ? '⚠️ This payment is overdue. ' : ''}${remindersSent > 0 ? `\nPrevious reminder sent ${remindersSent} time${remindersSent > 1 ? 's' : ''}.` : ''}`)) {
                  onSendReminder?.(deal);
                }
              }}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-600"
            >
              <Send className="w-4 h-4" />
              Send Reminder
            </Button>
          )}
          {onMarkPaid && status !== 'paid' && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onMarkPaid(deal);
              }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Paid
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedPaymentCard;

