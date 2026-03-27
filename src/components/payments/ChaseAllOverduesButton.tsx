"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
import { BrandDeal } from '@/types';
import { Button } from '@/components/ui/button';
import { useSendPaymentReminder } from '@/lib/hooks/useSendPaymentReminder';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface ChaseAllOverduesButtonProps {
  brandDeals: BrandDeal[] | undefined;
}

export const ChaseAllOverduesButton: React.FC<ChaseAllOverduesButtonProps> = ({ brandDeals }) => {
  const [isChasing, setIsChasing] = useState(false);
  const sendReminderMutation = useSendPaymentReminder();

  const overdueDeals = useMemo(() => {
    if (!brandDeals) return [];
    const now = new Date();
    return brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    });
  }, [brandDeals]);

  const handleChaseAll = async () => {
    if (overdueDeals.length === 0) return;

    setIsChasing(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      // Send reminders to all overdue deals
      const promises = overdueDeals.map(deal =>
        sendReminderMutation.mutateAsync({ brandDealId: deal.id })
      );

      await Promise.all(promises);

      toast.success(`Sent payment reminders to ${overdueDeals.length} brand${overdueDeals.length > 1 ? 's' : ''}!`, {
        description: 'They should receive WhatsApp reminders shortly.',
      });

      triggerHaptic(HapticPatterns.success);
    } catch (error: any) {
      console.error('Error chasing overdues:', error);
      toast.error('Failed to send some reminders', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsChasing(false);
    }
  };

  if (overdueDeals.length < 2) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed bottom-24 right-6 z-[60] md:bottom-20 md:right-6"
    >
      <Button
        onClick={handleChaseAll}
        disabled={isChasing}
        className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-red-500/30 hover:shadow-red-500/50 min-h-[56px] flex items-center gap-2"
      >
        {isChasing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-5 h-5" />
            <span>Chase All {overdueDeals.length} Overdues</span>
            <MessageSquare className="w-4 h-4" />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default ChaseAllOverduesButton;

