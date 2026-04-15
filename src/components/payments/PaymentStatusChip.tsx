import React from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentStatus, PAYMENT_STATUS_CONFIG } from '@/lib/constants/paymentStatus';

interface PaymentStatusChipProps {
  status: PaymentStatus;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  clock: Clock,
  alert: AlertCircle,
  check: CheckCircle,
  calendar: Calendar,
};

export const PaymentStatusChip = ({ status, className }: PaymentStatusChipProps) => {
  const config = PAYMENT_STATUS_CONFIG[status];
  const Icon = iconMap[config.icon] ?? Clock;

  return (
    <div
      className={cn(
        'px-3 py-1.5 rounded-full border text-sm font-semibold flex items-center gap-2 backdrop-blur-xl',
        config.colorClass,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </div>
  );
};
