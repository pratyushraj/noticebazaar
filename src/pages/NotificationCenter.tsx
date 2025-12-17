"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  X, 
  Filter, 
  Search, 
  Trash2,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  Calendar,
  MessageCircle,
  AlertCircle,
  Clock,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/notifications';
import { formatDistanceToNow, format } from '@/lib/utils/date';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * Notification Center Page
 * 
 * Full-page notification inbox with:
 * - Filter by type and read status
 * - Search functionality
 * - Mark as read/unread
 * - Delete notifications
 * - Grouped by date
 * - iOS 17 design
 */
const NotificationCenter = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAllAsRead,
  } = useNotifications({
    filter: filter === 'unread' ? { read: false } : filter === 'read' ? { read: true } : {},
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  // Filter notifications by search query
  const filteredNotifications = useMemo(() => {
    if (!searchQuery) return notifications;

    const query = searchQuery.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.message && n.message.toLowerCase().includes(query)) ||
        n.category.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    filteredNotifications.forEach((notification) => {
      const createdAt = new Date(notification.created_at);

      if (createdAt >= today) {
        groups['Today'].push(notification);
      } else if (createdAt >= yesterday) {
        groups['Yesterday'].push(notification);
      } else if (createdAt >= weekAgo) {
        groups['This Week'].push(notification);
      } else if (createdAt >= monthAgo) {
        groups['This Month'].push(notification);
      } else {
        groups['Older'].push(notification);
      }
    });

    // Remove empty groups and return as array
    return Object.entries(groups)
      .filter(([_, notifications]) => notifications.length > 0)
      .map(([date, notifications]) => ({
        date,
        notifications: notifications.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));
  }, [filteredNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notificationId);
    toast.success('Notification deleted');
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'payment':
        return DollarSign;
      case 'deal':
        return CheckCircle2;
      case 'contract':
        return FileText;
      case 'tax':
        return Calendar;
      case 'message':
        return MessageCircle;
      case 'reminder':
        return Clock;
      default:
        return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-white/60">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/creator-profile?section=notifications')}
              className="text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Notification settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllAsRead}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <SegmentedControl
            options={[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'read', label: 'Read' },
            ]}
            value={filter}
            onChange={(value) => setFilter(value as any)}
            className="flex-shrink-0"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'payment', 'deal', 'contract', 'tax', 'message', 'system'] as const).map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className={`flex-shrink-0 ${
                typeFilter === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15'
              }`}
            >
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white/60">Loading notifications...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center bg-white/5 border-white/10">
            <Bell className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No notifications</h3>
            <p className="text-white/60 text-sm">
              {searchQuery
                ? 'No notifications match your search'
                : filter === 'unread'
                ? 'All caught up! No unread notifications'
                : 'You\'re all caught up!'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedNotifications.map(({ date, notifications: groupNotifications }) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 px-2">
                  {date}
                </h2>
                <div className="space-y-2">
                  <AnimatePresence>
                    {groupNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-4 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/[0.12] transition-all cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              notification.type === 'payment' ? 'bg-green-500/20' :
                              notification.type === 'deal' ? 'bg-blue-500/20' :
                              notification.type === 'contract' ? 'bg-purple-500/20' :
                              notification.type === 'tax' ? 'bg-orange-500/20' :
                              notification.type === 'message' ? 'bg-pink-500/20' :
                              'bg-white/10'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                notification.type === 'payment' ? 'text-green-400' :
                                notification.type === 'deal' ? 'text-blue-400' :
                                notification.type === 'contract' ? 'text-purple-400' :
                                notification.type === 'tax' ? 'text-orange-400' :
                                notification.type === 'message' ? 'text-pink-400' :
                                'text-white/60'
                              }`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`text-sm font-semibold ${!notification.read ? 'text-white' : 'text-white/80'}`}>
                                      {notification.title}
                                    </h3>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                    )}
                                  </div>
                                  {notification.message && (
                                    <p className="text-xs text-white/70 mb-2 line-clamp-2">
                                      {notification.message}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleDelete(notification.id, e)}
                                  className="w-6 h-6 text-white/40 hover:text-red-400 hover:bg-red-500/20 flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {notification.priority !== 'normal' && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityColor(notification.priority)}`}>
                                      {notification.priority}
                                    </span>
                                  )}
                                  <span className="text-xs text-white/50">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                {notification.action_label && (
                                  <span className="text-xs text-purple-400 flex items-center gap-1">
                                    {notification.action_label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

