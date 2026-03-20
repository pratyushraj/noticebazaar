"use client";

import { X, Briefcase, Wallet, FileText, Calendar, IndianRupee, ExternalLink, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { CalendarEvent } from './CalendarView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BrandDeal } from '@/types';

interface CalendarEventModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function CalendarEventModal({ event, onClose }: CalendarEventModalProps) {
  const navigate = useNavigate();
  const deal = event.metadata?.deal as BrandDeal | undefined;
  const filing = event.metadata?.filing as any | undefined;

  const handleViewDeal = () => {
    if (deal) {
      navigate(`/creator-contracts/${deal.id}`);
      onClose();
    }
  };

  const handleViewPayments = () => {
    navigate('/creator-payments');
    onClose();
  };

  const handleViewTax = () => {
    navigate('/creator-tax-compliance');
    onClose();
  };

  const getEventIcon = () => {
    switch (event.type) {
      case 'payment':
        return Wallet;
      case 'deal':
        return Briefcase;
      case 'tax':
        return FileText;
      case 'deliverable':
        return Briefcase;
      default:
        return Calendar;
    }
  };

  const Icon = getEventIcon();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border-white/20 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${event.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl">{event.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-white/60">
            <Calendar className="w-4 h-4" />
            <span>
              {event.date.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>

          {/* Description */}
          {event.description && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/80">{event.description}</p>
            </div>
          )}

          {/* Deal Details */}
          {deal && (
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Brand</span>
                  <span className="font-semibold">{deal.brand_name}</span>
                </div>
                {deal.deal_amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Amount</span>
                    <span className="font-semibold flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {deal.deal_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {deal.platform && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Platform</span>
                    <span className="font-semibold">{deal.platform}</span>
                  </div>
                )}
                {deal.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Status</span>
                    <Badge variant="outline" className="bg-white/10 text-white/80 border-white/20">
                      {deal.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Overdue Warning */}
              {event.type === 'payment' && new Date(deal.payment_expected_date) < new Date() && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-semibold text-red-400">Payment Overdue</p>
                    <p className="text-xs text-red-300">
                      {Math.ceil((new Date().getTime() - new Date(deal.payment_expected_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tax Filing Details */}
          {filing && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Filing Type</span>
                <span className="font-semibold">{filing.filing_type.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              {filing.details && (
                <div>
                  <span className="text-sm text-white/60">Details</span>
                  <p className="text-sm text-white/80 mt-1">{filing.details}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {deal && (
              <Button
                onClick={handleViewDeal}
                className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                View Deal
              </Button>
            )}
            {event.type === 'payment' && (
              <Button
                onClick={handleViewPayments}
                variant="outline"
                className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Wallet className="w-4 h-4 mr-2" />
                View Payments
              </Button>
            )}
            {event.type === 'tax' && (
              <Button
                onClick={handleViewTax}
                variant="outline"
                className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Tax
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

