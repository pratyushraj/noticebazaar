import { Clock, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineItemProps {
  icon: 'clock' | 'file' | 'check';
  label: string;
  date: Date | string | null;
  highlight?: boolean;
}

const iconMap = {
  clock: Clock,
  file: FileText,
  check: CheckCircle,
};

export const TimelineItem = ({ icon, label, date, highlight = false }: TimelineItemProps) => {
  const Icon = iconMap[icon];
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border backdrop-blur-xl transition-all',
        highlight
          ? 'bg-green-500/20 border-green-500/30 text-green-300'
          : 'bg-white/10 border-white/20 text-white/80',
        'hover:bg-white/15'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          highlight ? 'bg-green-500/30' : 'bg-white/10'
        )}
      >
        <Icon className={cn('w-5 h-5', highlight ? 'text-green-400' : 'text-white/60')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('font-semibold mb-1', highlight ? 'text-green-300' : 'text-white')}>
          {label}
        </div>
        <div className={cn('text-sm', highlight ? 'text-green-400/80' : 'text-white/60')}>
          {formattedDate}
        </div>
      </div>
    </div>
  );
};

interface PaymentTimelineProps {
  createdAt: Date | string | null;
  invoiceDate?: Date | string | null;
  receivedAt?: Date | string | null;
  className?: string;
}

export const PaymentTimeline = ({
  createdAt,
  invoiceDate,
  receivedAt,
  className,
}: PaymentTimelineProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
      <div className="space-y-3">
        <TimelineItem icon="clock" label="Payment Created" date={createdAt} />
        {invoiceDate && <TimelineItem icon="file" label="Invoice Generated" date={invoiceDate} />}
        {receivedAt && (
          <TimelineItem icon="check" label="Payment Received" date={receivedAt} highlight />
        )}
      </div>
    </div>
  );
};
