import React from 'react';
import { ArrowDownRight, FileText, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Expense } from '@/lib/hooks/useExpenses';
import { cn } from '@/lib/utils';
import { animations } from '@/lib/design-system';

interface ExpenseCardProps {
  expense: Expense;
  onClick?: () => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleReceiptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expense.receipt_file_url) {
      window.open(expense.receipt_file_url, '_blank');
    }
  };

  return (
    <motion.div
      whileHover={window.innerWidth > 768 ? { scale: 1.02 } : undefined}
      whileTap={animations.microTap}
      onClick={onClick}
      className={cn(
        "rounded-2xl p-5 md:p-6",
        "bg-white/10 backdrop-blur-xl border border-white/20",
        "shadow-xl shadow-black/10",
        "cursor-pointer transition-all duration-200",
        "hover:bg-white/12 hover:border-white/25"
      )}
    >
      {/* Top Row: Amount + Category */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 backdrop-blur-md">
            <ArrowDownRight className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              ₹{expense.amount.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-white/80 font-medium mt-0.5">
              {expense.category}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {expense.description && (
        <div className="mb-4">
          <p className="text-sm text-white/90 leading-relaxed">
            {expense.description}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/10 my-4" />

      {/* Metadata */}
      <div className="space-y-2 text-xs">
        {/* Vendor */}
        {expense.vendor_name && (
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-white/50">Vendor:</span>
            <span className="font-medium">{expense.vendor_name}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-white/70">
          <span className="text-white/50">Date:</span>
          <span className="font-medium">{formatDate(expense.expense_date)}</span>
        </div>

        {/* Payment Method */}
        {expense.payment_method && (
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-white/50">Method:</span>
            <span className="font-medium">{expense.payment_method}</span>
          </div>
        )}

        {/* Tags */}
        {expense.tags && expense.tags.length > 0 && (
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-white/50 pt-0.5">Tags:</span>
            <div className="flex flex-wrap gap-1.5">
              {expense.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs"
                >
                  • {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Receipt */}
        {expense.receipt_file_url && (
          <div className="pt-2">
            <button
              onClick={handleReceiptClick}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "bg-white/10 hover:bg-white/15",
                "text-white/80 hover:text-white",
                "transition-colors duration-200",
                "text-xs font-medium"
              )}
            >
              <FileText className="w-3 h-3" />
              <span>View Receipt</span>
              <Eye className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

