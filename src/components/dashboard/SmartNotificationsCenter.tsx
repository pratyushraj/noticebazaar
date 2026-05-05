

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Settings, DollarSign, MessageSquare, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'payment' | 'message' | 'alert' | 'success' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface SmartNotificationsCenterProps {
  notifications?: Notification[];
  isDark?: boolean;
}

const SmartNotificationsCenter: React.FC<SmartNotificationsCenterProps> = ({
  notifications = [],
  isDark = true,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'payment' | 'message' | 'alert'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showPreferences, setShowPreferences] = useState(false);

  const defaultNotifications: Notification[] = [
    {
      id: '1',
      type: 'payment',
      title: 'Payment Received',
      description: '₹35,000 from Zepto has been credited to your account',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '2',
      type: 'message',
      title: 'New Collaboration Request',
      description: 'Spotify wants to collaborate with you for a sponsored post',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '3',
      type: 'alert',
      title: 'Payment Overdue',
      description: 'Fashion Nova payment (₹25K) is 5 days overdue',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '4',
      type: 'success',
      title: 'Deal Completed',
      description: 'Your Instagram content for Zepto has been approved',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '5',
      type: 'info',
      title: 'Profile Update Tip',
      description: 'Adding past brands to your profile increases collaboration chances by 40%',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ];

  const displayNotifications = notifications;

  const typeConfig = {
    payment: {
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-primary/20 text-primary border-primary/30',
      badge: 'emerald',
      label: 'Payment',
    },
    message: {
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'bg-info/20 text-info border-info/30',
      badge: 'blue',
      label: 'Message',
    },
    alert: {
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-destructive/20 text-destructive border-destructive/30',
      badge: 'red',
      label: 'Alert',
    },
    success: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'bg-green-500/20 text-green-300 border-green-500/30',
      badge: 'green',
      label: 'Success',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      color: 'bg-secondary/20 text-secondary border-purple-500/30',
      badge: 'purple',
      label: 'Info',
    },
  };

  const filterOptions: Array<{ value: typeof selectedFilter; label: string; count: number }> = [
    {
      value: 'all',
      label: 'All',
      count: displayNotifications.filter((n) => !dismissedIds.has(n.id)).length,
    },
    {
      value: 'unread',
      label: 'Unread',
      count: displayNotifications.filter((n) => !n.read && !dismissedIds.has(n.id)).length,
    },
    {
      value: 'payment',
      label: 'Payments',
      count: displayNotifications.filter((n) => n.type === 'payment' && !dismissedIds.has(n.id)).length,
    },
    {
      value: 'message',
      label: 'Messages',
      count: displayNotifications.filter((n) => n.type === 'message' && !dismissedIds.has(n.id)).length,
    },
    {
      value: 'alert',
      label: 'Alerts',
      count: displayNotifications.filter((n) => n.type === 'alert' && !dismissedIds.has(n.id)).length,
    },
  ];

  const filteredNotifications = displayNotifications.filter((n) => {
    if (dismissedIds.has(n.id)) return false;
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !n.read;
    return n.type === selectedFilter;
  });

  const unreadCount = displayNotifications.filter((n) => !n.read && !dismissedIds.has(n.id)).length;

  const handleDismiss = (id: string) => {
    setDismissedIds(new Set([...dismissedIds, id]));
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
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
          <div className="flex items-center gap-2">
            <h3 className={cn(
              'text-base font-bold tracking-tight flex items-center gap-2',
              isDark ? 'text-foreground' : 'text-muted-foreground'
            )}>
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-foreground text-xs">{unreadCount}</Badge>
            )}
          </div>
          <button type="button"
            onClick={() => setShowPreferences(!showPreferences)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-secondary/50' : 'hover:bg-background'
            )}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-2 px-2">
          {filterOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => setSelectedFilter(option.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all',
                selectedFilter === option.value
                  ? isDark
                    ? 'bg-info text-foreground shadow-lg'
                    : 'bg-info text-foreground shadow-lg'
                  : isDark
                  ? 'bg-secondary/50 text-foreground/70 hover:bg-secondary/15'
                  : 'bg-background text-muted-foreground hover:bg-background'
              )}
            >
              {option.label}
              <span className={cn(
                'ml-1.5 text-xs font-semibold',
                selectedFilter === option.value ? 'text-foreground' : isDark ? 'text-foreground/50' : 'text-muted-foreground'
              )}>
                {option.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, idx) => {
                const config = typeConfig[notification.type];
                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      'p-3 rounded-lg border transition-all group',
                      config.color,
                      !notification.read && (isDark ? 'bg-opacity-30' : 'bg-opacity-20')
                    )}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={cn(
                            'text-sm font-semibold',
                            isDark ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {notification.title}
                            {!notification.read && (
                              <span className="inline-block w-2 h-2 bg-current rounded-full ml-2" />
                            )}
                          </h4>
                          <span className={cn(
                            'text-xs flex-shrink-0',
                            isDark ? 'text-foreground/50' : 'text-muted-foreground'
                          )}>
                            {getTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                        <p className={cn(
                          'text-xs',
                          isDark ? 'text-foreground/70' : 'text-muted-foreground'
                        )}>
                          {notification.description}
                        </p>
                      </div>

                      {/* Dismiss Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDismiss(notification.id)}
                        className={cn(
                          'flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                          isDark ? 'hover:bg-secondary/50' : 'hover:bg-card'
                        )}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'text-center py-6',
                  isDark ? 'text-foreground/60' : 'text-muted-foreground'
                )}
              >
                <p className="text-sm">No notifications</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartNotificationsCenter;
