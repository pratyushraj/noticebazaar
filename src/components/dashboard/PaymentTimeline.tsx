

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentMilestone {
  id: string;
  date: Date;
  amount: number;
  status: 'completed' | 'pending' | 'overdue';
  label: string;
  brandName: string;
  description?: string;
}

interface PaymentTimelineProps {
  milestones?: PaymentMilestone[];
  isDark?: boolean;
  maxItems?: number;
}

const PaymentTimeline: React.FC<PaymentTimelineProps> = ({
  milestones = [],
  isDark = true,
  maxItems = 6,
}) => {
  const defaultMilestones: PaymentMilestone[] = [
    {
      id: '1',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      amount: 35000,
      status: 'completed',
      label: 'Content Delivered',
      brandName: 'Zepto',
      description: 'Instagram Reel',
    },
    {
      id: '2',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      amount: 35000,
      status: 'completed',
      label: 'Payment Received',
      brandName: 'Zepto',
      description: '₹35,000 credited',
    },
    {
      id: '3',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      amount: 45000,
      status: 'pending',
      label: 'Delivery Due',
      brandName: 'Spotify',
      description: '3 Stories + 1 Reel',
    },
    {
      id: '4',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      amount: 45000,
      status: 'pending',
      label: 'Payment Expected',
      brandName: 'Spotify',
      description: 'Upon approval',
    },
    {
      id: '5',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      amount: 25000,
      status: 'overdue',
      label: 'Payment Overdue',
      brandName: 'Fashion Nova',
      description: '5 days pending',
    },
  ];

  const displayMilestones = milestones.length > 0 ? milestones : defaultMilestones;
  const sortedMilestones = [...displayMilestones].sort((a, b) => a.date.getTime() - b.date.getTime());
  const truncatedMilestones = sortedMilestones.slice(0, maxItems);

  const statusConfig = {
    completed: {
      color: 'text-primary',
      bgColor: 'bg-primary/10 border-primary/30',
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: 'Completed',
    },
    pending: {
      color: 'text-info',
      bgColor: 'bg-info/10 border-info/30',
      icon: <Clock className="w-5 h-5" />,
      label: 'Pending',
    },
    overdue: {
      color: 'text-destructive',
      bgColor: 'bg-destructive/10 border-destructive/30',
      icon: <AlertCircle className="w-5 h-5" />,
      label: 'Overdue',
    },
  };

  const getFormattedDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toDateString();
    if (dateStr === today.toDateString()) return 'Today';
    if (dateStr === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  const getDaysFrom = (date: Date): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  };

  return (
    <Card className={cn(
      'border transition-all duration-300',
      isDark
        ? 'bg-gradient-to-br from-background/50 to-slate-800/30 border-border'
        : 'bg-card border-border shadow-sm'
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            'text-base font-bold tracking-tight',
            isDark ? 'text-foreground' : 'text-muted-foreground'
          )}>
            💰 Payment Timeline
          </h3>
          <Badge variant="outline" className={cn(
            isDark ? 'bg-info/20 text-info border-info/30' : 'bg-info text-info border-info'
          )}>
            {truncatedMilestones.length} events
          </Badge>
        </div>

        {/* Timeline */}
        <div className="relative space-y-0">
          {truncatedMilestones.map((milestone, idx) => {
            const config = statusConfig[milestone.status];
            const daysFrom = getDaysFrom(milestone.date);
            const isLast = idx === truncatedMilestones.length - 1;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="relative"
              >
                {/* Timeline line */}
                {!isLast && (
                  <div className={cn(
                    'absolute left-6 top-14 bottom-0 w-0.5',
                    isDark ? 'bg-secondary/50' : 'bg-background'
                  )} />
                )}

                <div className="flex gap-4 pb-6">
                  {/* Timeline dot */}
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className={cn(
                      'relative flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center mt-1 transition-all',
                      config.bgColor
                    )}
                  >
                    <div className={config.color}>
                      {milestone.status === 'completed' && <CheckCircle2 className="w-6 h-6" />}
                      {milestone.status === 'pending' && <Clock className="w-6 h-6" />}
                      {milestone.status === 'overdue' && <AlertCircle className="w-6 h-6" />}
                    </div>

                    {/* Pulse for active milestones */}
                    {milestone.status === 'pending' && (
                      <motion.div
                        animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn(
                          'absolute inset-0 rounded-full border-2',
                          config.bgColor
                        )}
                      />
                    )}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className={cn(
                          'font-bold text-sm',
                          isDark ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {milestone.label}
                        </h4>
                        <p className={cn(
                          'text-xs mt-0.5',
                          isDark ? 'text-foreground/60' : 'text-muted-foreground'
                        )}>
                          {milestone.brandName} • {milestone.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn(
                          'font-bold text-sm',
                          isDark ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          ₹{milestone.amount.toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {daysFrom === 0 ? 'Today' : daysFrom > 0 ? `+${daysFrom}d` : `${daysFrom}d`}
                        </Badge>
                      </div>
                    </div>

                    {/* Date and status */}
                    <div className="flex items-center justify-between text-xs">
                      <p className={isDark ? 'text-foreground/50' : 'text-muted-foreground'}>
                        {getFormattedDate(milestone.date)}
                      </p>
                      <Badge className={cn(
                        'text-xs font-semibold',
                        config.bgColor
                      )}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {displayMilestones.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'text-center py-8',
              isDark ? 'text-foreground/60' : 'text-muted-foreground'
            )}
          >
            <p className="text-sm">No payment milestones yet</p>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'mt-6 pt-4 border-t grid grid-cols-3 gap-3',
            isDark ? 'border-border' : 'border-border'
          )}
        >
          <div className="text-center">
            <p className={cn(
              'text-xs font-semibold mb-1',
              isDark ? 'text-foreground/60' : 'text-muted-foreground'
            )}>
              Expected
            </p>
            <p className={cn(
              'text-lg font-bold',
              isDark ? 'text-primary' : 'text-primary'
            )}>
              ₹45K
            </p>
          </div>
          <div className="text-center">
            <p className={cn(
              'text-xs font-semibold mb-1',
              isDark ? 'text-foreground/60' : 'text-muted-foreground'
            )}>
              Pending
            </p>
            <p className={cn(
              'text-lg font-bold',
              isDark ? 'text-info' : 'text-info'
            )}>
              ₹25K
            </p>
          </div>
          <div className="text-center">
            <p className={cn(
              'text-xs font-semibold mb-1',
              isDark ? 'text-foreground/60' : 'text-muted-foreground'
            )}>
              Overdue
            </p>
            <p className={cn(
              'text-lg font-bold',
              isDark ? 'text-destructive' : 'text-destructive'
            )}>
              ₹25K
            </p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default PaymentTimeline;
