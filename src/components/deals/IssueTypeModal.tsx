import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, FileText, AlertTriangle, DollarSign, HelpCircle } from 'lucide-react';

export type IssueType = 
  | 'payment_delay'
  | 'contract_mismatch'
  | 'deliverables_dispute'
  | 'wrong_amount'
  | 'other';

interface IssueTypeOption {
  id: IssueType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface IssueTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: IssueType) => void;
  dealTitle?: string;
  dealAmount?: number;
  dueDate?: string;
}

const issueTypes: IssueTypeOption[] = [
  {
    id: 'payment_delay',
    label: 'Payment Delay',
    icon: CreditCard,
    description: 'Payment not received on time',
  },
  {
    id: 'contract_mismatch',
    label: 'Contract Mismatch',
    icon: FileText,
    description: 'Terms differ from agreement',
  },
  {
    id: 'deliverables_dispute',
    label: 'Deliverables Dispute',
    icon: AlertTriangle,
    description: 'Disagreement on deliverables',
  },
  {
    id: 'wrong_amount',
    label: 'Wrong Amount',
    icon: DollarSign,
    description: 'Incorrect payment amount',
  },
  {
    id: 'other',
    label: 'Other',
    icon: HelpCircle,
    description: 'Other issues or concerns',
  },
];

export const IssueTypeModal: React.FC<IssueTypeModalProps> = ({
  open,
  onClose,
  onSelect,
  dealTitle,
  dealAmount,
  dueDate,
}) => {
  const handleSelect = (type: IssueType) => {
    onSelect(type);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[90vw] md:max-w-md bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h3 className="text-white font-semibold text-lg">Select Issue Type</h3>
                <p className="text-sm text-purple-300 mt-1">
                  Choose the category that best describes your issue
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {issueTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleSelect(type.id)}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-[0.98] text-left flex items-start gap-4 group"
                  >
                    <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                      <Icon className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium mb-1">{type.label}</h4>
                      <p className="text-sm text-purple-300">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Generate issue message template based on type
 */
export function generateIssueMessage(
  type: IssueType,
  dealTitle?: string,
  dealAmount?: number,
  dueDate?: string
): string {
  const formattedAmount = dealAmount
    ? `₹${dealAmount.toLocaleString('en-IN')}`
    : 'Amount not specified';
  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date not set';

  const templates: Record<IssueType, string> = {
    payment_delay: `Hi team, I'd like to report a payment delay issue:

Deal: ${dealTitle || 'N/A'}
Expected Amount: ${formattedAmount}
Expected Date: ${formattedDate}

Issue: Payment has not been received as per the contract terms. Please investigate and provide an update on the payment status.

Thank you.`,

    contract_mismatch: `Hi team, I'd like to report a contract mismatch:

Deal: ${dealTitle || 'N/A'}
Expected Amount: ${formattedAmount}

Issue: The current deal terms differ from what was originally agreed upon in the contract. Please review and clarify the discrepancies.

Thank you.`,

    deliverables_dispute: `Hi team, I'd like to report a deliverables dispute:

Deal: ${dealTitle || 'N/A'}
Expected Amount: ${formattedAmount}
Due Date: ${formattedDate}

Issue: There is a disagreement regarding the deliverables for this deal. Please help resolve this matter.

Thank you.`,

    wrong_amount: `Hi team, I'd like to report an incorrect payment amount:

Deal: ${dealTitle || 'N/A'}
Expected Amount: ${formattedAmount}
Received Amount: [Please specify]

Issue: The payment amount received does not match the contract terms. Please review and correct this.

Thank you.`,

    other: `Hi team, I'd like to report an issue with this deal:

Deal: ${dealTitle || 'N/A'}
Expected Amount: ${formattedAmount}
Expected Date: ${formattedDate}

Issue: `,
  };

  return templates[type];
}

