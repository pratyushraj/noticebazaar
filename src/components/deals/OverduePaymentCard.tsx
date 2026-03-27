import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Send } from 'lucide-react';

interface OverduePaymentCardProps {
  dealTitle: string;
  brandName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  onSendReminder: () => void;
}

export const OverduePaymentCard: React.FC<OverduePaymentCardProps> = ({
  dealTitle,
  brandName,
  amount,
  dueDate,
  daysOverdue,
  onSendReminder,
}) => {
  const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-red-500/20 via-amber-500/20 to-yellow-500/20 backdrop-blur-xl rounded-2xl p-5 border border-red-400/30 shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-500/20 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold mb-1">Payment Overdue</h3>
          <p className="text-sm text-white/80 mb-3">
            Your payment is overdue by <span className="font-semibold text-red-300">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''}</span>.
          </p>

          <div className="space-y-1.5 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Deal:</span>
              <span className="text-white font-medium">{dealTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Brand:</span>
              <span className="text-white font-medium">{brandName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Amount:</span>
              <span className="text-white font-medium">{formattedAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Due Date:</span>
              <span className="text-white font-medium">{formattedDate}</span>
            </div>
          </div>

          <button
            onClick={onSendReminder}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            <Send className="w-4 h-4" />
            Send Reminder
          </button>
        </div>
      </div>
    </motion.div>
  );
};

