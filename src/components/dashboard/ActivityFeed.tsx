

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, DollarSign, MessageSquare, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ActivityItem {
  id: string;
  type: 'payment' | 'deal' | 'message' | 'milestone' | 'reminder';
  title: string;
  description: string;
  timestamp: Date;
  icon?: React.ReactNode;
  actionUrl?: string;
  imageUrl?: string;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  isDark?: boolean;
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  isDark = true,
  maxItems = 5,
}) => {
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'payment',
      title: 'Payment Received',
      description: 'Zepto paid ₹35,000 for Instagram Reel',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: '2',
      type: 'deal',
      title: 'Deal Completed',
      description: 'Instagram content delivered & approved',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      id: '3',
      type: 'message',
      title: 'New Collab Request',
      description: 'Spotify sent you a collaboration offer',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: '4',
      type: 'milestone',
      title: '5 Deals Completed 🎉',
      description: 'You\'ve unlocked the "Rising Star" badge',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      icon: <Trophy className="w-5 h-5" />,
    },
  ];

  const displayActivities = activities;
  const truncatedActivities = displayActivities.slice(0, maxItems);

  const typeConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
    payment: {
      color: 'text-primary',
      bgColor: 'bg-primary/10 border-primary/30',
      icon: <DollarSign className="w-5 h-5" />,
    },
    deal: {
      color: 'text-info',
      bgColor: 'bg-info/10 border-info/30',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    message: {
      color: 'text-secondary',
      bgColor: 'bg-secondary/50 border-purple-500/30',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    milestone: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
      icon: <Trophy className="w-5 h-5" />,
    },
    reminder: {
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 border-orange-500/30',
      icon: <Clock className="w-5 h-5" />,
    },
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
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
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn(
            'text-base font-bold tracking-tight',
            isDark ? 'text-foreground' : 'text-muted-foreground'
          )}>
            Recent Activity
          </h3>
          <span className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full',
            isDark ? 'bg-info/20 text-info' : 'bg-info text-info'
          )}>
            {truncatedActivities.length} events
          </span>
        </div>

        {/* Activity List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {truncatedActivities.map((activity, idx) => {
              const config = typeConfig[activity.type];
              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all hover:border-opacity-100 cursor-pointer group',
                    config.bgColor,
                    isDark ? 'hover:bg-opacity-20' : 'hover:bg-opacity-30'
                  )}
                >
                  {/* Icon / Thumbnail */}
                  {activity.imageUrl ? (
                    <div className="flex-shrink-0 mt-0.5">
                      <img
                        src={activity.imageUrl}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover border border-border"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      'flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-lg mt-0.5',
                      isDark ? 'bg-secondary/50' : 'bg-background'
                    )}>
                      <div className={config.color}>
                        {activity.icon || config.icon}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-semibold truncate',
                      isDark ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {activity.title}
                    </p>
                    <p className={cn(
                      'text-xs truncate mt-0.5',
                      isDark ? 'text-foreground/60' : 'text-muted-foreground'
                    )}>
                      {activity.description}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <p className={cn(
                    'text-xs font-medium flex-shrink-0 whitespace-nowrap',
                    isDark ? 'text-foreground/50' : 'text-muted-foreground'
                  )}>
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {displayActivities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'text-center py-6',
              isDark ? 'text-foreground/60' : 'text-muted-foreground'
            )}
          >
            <p className="text-sm">No recent activity</p>
          </motion.div>
        )}

        {displayActivities.length > maxItems && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'w-full mt-3 py-2 text-xs font-bold rounded-lg border transition-colors',
              isDark
                ? 'border-border text-foreground/70 hover:bg-secondary/50 hover:text-foreground'
                : 'border-border text-muted-foreground hover:bg-background'
            )}
          >
            View all activity
          </motion.button>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
