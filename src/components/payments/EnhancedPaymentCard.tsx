"use client";

import React from 'react';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IndianRupee,
  Calendar,
  FileText,
  Mail,
  Phone,
  Scale,
  AlertTriangle,
  Clock,
  CheckCircle,
  Send,
  MessageSquare,
  Plus,
  ChevronRight,
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

  // Handle deliverables
  const deliverablesArray = Array.isArray(deal.deliverables)
    ? deal.deliverables
    : typeof deal.deliverables === 'string'
    ? deal.deliverables.split(',').map(d => d.trim()).filter(Boolean)
    : [];

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

  const getCardTheme = () => {
    switch (status) {
      case 'overdue':
        return {
          bg: 'bg-gradient-to-br from-red-950/40 to-red-900/20',
          border: 'border-red-700/40',
          hoverBorder: 'hover:border-red-600/60',
          headerBg: 'bg-red-500/10',
          headerText: 'text-red-500',
          headerTitle: '🚨 OVERDUE - Needs Action',
        };
      case 'pending':
        return {
          bg: 'bg-gradient-to-br from-yellow-950/40 to-yellow-900/20',
          border: 'border-yellow-700/40',
          hoverBorder: 'hover:border-yellow-600/60',
          headerBg: 'bg-yellow-500/10',
          headerText: 'text-yellow-500',
          headerTitle: '⏳ Payment Expected',
        };
      case 'upcoming':
        return {
          bg: 'bg-gradient-to-br from-green-950/40 to-green-900/20',
          border: 'border-green-700/40',
          hoverBorder: 'hover:border-green-600/60',
          headerBg: 'bg-green-500/10',
          headerText: 'text-green-500',
          headerTitle: '✅ Payment Scheduled',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-blue-950/40 to-blue-900/20',
          border: 'border-blue-700/40',
          hoverBorder: 'hover:border-blue-600/60',
          headerBg: 'bg-blue-500/10',
          headerText: 'text-blue-500',
          headerTitle: '✅ Payment Received',
        };
    }
  };

  const theme = getCardTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        theme.bg,
        theme.border,
        theme.hoverBorder,
        "rounded-xl p-5 transition-all"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between mb-4 p-3 rounded-lg",
          theme.headerBg
        )}>
          <span className={cn("text-sm font-semibold", theme.headerText)}>
            {theme.headerTitle}
          </span>
          {daysOverdue && (
            <Badge variant="destructive" className="text-xs">
              -{daysOverdue} days
            </Badge>
          )}
          {daysLeft !== undefined && daysLeft > 0 && (
            <Badge variant="secondary" className="text-xs">
              {daysLeft} days left
            </Badge>
          )}
        </div>

        {/* Brand Info - Compact */}
        <div className="flex items-center gap-2 mb-3">
          <BrandLogo
            brandName={deal.brand_name}
            brandLogo={null}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">
              {deal.brand_name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {PlatformIcon && <PlatformIcon className="w-3.5 h-3.5" />}
              <span>{deal.platform || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Amount and Due Date - Compact */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Amount</div>
            <div className="text-lg font-bold text-foreground">
              ₹{deal.deal_amount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground mb-0.5">
              {status === 'overdue' ? 'Was Due' : 'Due'}
            </div>
            <div className="text-xs font-medium text-foreground">
              {new Date(deal.payment_expected_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Payment Status Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Payment Status</span>
            <span className={cn(
              status === 'overdue' && 'text-red-400',
              status === 'pending' && 'text-yellow-400',
              status === 'upcoming' && 'text-green-400',
              status === 'paid' && 'text-green-500'
            )}>
              {status === 'overdue' ? 'Overdue' : 
               status === 'pending' ? 'Pending' :
               status === 'upcoming' ? 'Scheduled' : 'Paid'}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: status === 'paid' ? '100%' : status === 'overdue' ? '0%' : '70%' }}
              transition={{ duration: 0.5 }}
              className={cn(
                "h-full transition-all",
                status === 'paid' ? 'bg-green-500' :
                status === 'overdue' ? 'bg-red-500' :
                status === 'pending' ? 'bg-yellow-500' :
                'bg-green-400'
              )}
            />
          </div>
        </div>

        {/* Invoice and Reminders - Compact */}
        <div className="flex items-center justify-between text-xs mb-3">
          {deal.invoice_file_url && (
            <a
              href={deal.invoice_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <FileText className="w-3 h-3" />
              <span>Invoice</span>
            </a>
          )}
          {remindersSent > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground" title={`Last reminder sent ${daysOverdue ? `${daysOverdue} days ago` : 'recently'}`}>
              <Mail className="w-3 h-3" />
              <span>{remindersSent} reminder{remindersSent !== 1 ? 's' : ''} sent</span>
            </div>
          )}
        </div>

        {/* Brand Payment History - Compact */}
        {status === 'pending' && (
          <div className="mb-3 p-2 bg-muted/50 rounded-lg border border-border/40">
            <div className="text-[10px] text-muted-foreground mb-0.5">Payment History</div>
            <div className="text-xs text-foreground">
              ~{brandPaymentHistory.avgDays} days avg {brandPaymentHistory.reliability === 'excellent' && '✅'}
            </div>
          </div>
        )}

        {/* Recovery Actions (Overdue only) - Compact */}
        {status === 'overdue' && (
          <div className="mb-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReminder?.(deal);
                }}
                className="flex-1 h-7 text-xs bg-red-500 hover:bg-red-600"
              >
                <Send className="w-3 h-3 mr-1" />
                Remind
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEscalate?.(deal);
                }}
                className="h-7 text-xs border-red-500/50 hover:bg-red-500/10"
              >
                <AlertTriangle className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons - Compact */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
          {reminderConfig.show && (
            <Button
              size="sm"
              variant={reminderConfig.variant}
              onClick={(e) => {
                e.stopPropagation();
                // Show confirmation dialog before sending
                if (window.confirm(`Send reminder to ${deal.brand_name}?\n\n${reminderConfig.urgent ? '⚠️ This payment is overdue. ' : ''}${remindersSent > 0 ? `\nPrevious reminder sent ${remindersSent} time${remindersSent > 1 ? 's' : ''}.` : ''}`)) {
                  onSendReminder?.(deal);
                }
              }}
              className={cn(
                "flex-1 text-xs h-7 px-2",
                reminderConfig.urgent && "bg-red-500 hover:bg-red-600"
              )}
            >
              <Send className="w-3 h-3 mr-1" />
              {reminderConfig.text}
            </Button>
          )}
          {onMarkPaid && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkPaid(deal)}
              className="flex-1 text-xs h-7 px-2"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Mark Paid
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetails?.(deal)}
            className="text-xs h-7 px-2"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default EnhancedPaymentCard;

