import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentStatus = 'received' | 'pending' | 'overdue';

interface PaymentStatusChipProps {
  status: PaymentStatus;
  className?: string;
}

const statusConfig = {
  received: {
    label: 'Payment Received',
    icon: CheckCircle,
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  overdue: {
    label: 'Overdue',
    icon: AlertCircle,
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

export const PaymentStatusChip = ({ status, className }: PaymentStatusChipProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'px-3 py-1.5 rounded-full border text-sm font-semibold flex items-center gap-2 backdrop-blur-xl',
        config.className,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </div>
  );
};

