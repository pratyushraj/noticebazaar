"use client";

import React from 'react';
import { Bell, Check, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Notification } from '@/types/notifications';
import { formatDistanceToNow } from '@/lib/utils/date';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationDropdownProps {
  className?: string;
}

/**
 * Enhanced Notification Dropdown
 * - Real-time updates
 * - Grouped by date
 * - Mark as read/unread
 * - iOS 17 design
 */
export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, error } = useNotifications({
    limit: 10,
  });

  // Log errors for debugging
  React.useEffect(() => {
    if (error) {
      console.error('[NotificationDropdown] Error:', error);
    }
  }, [error]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle collaboration request notifications specially
    if (notification.category === 'collab_request' && notification.data?.collab_request_id) {
      // Navigate to creator dashboard and scroll to collab requests section
      navigate('/creator-dashboard');
      // Scroll to collab requests section after a brief delay to allow page to render
      setTimeout(() => {
        const collabSection = document.querySelector('[data-section="collab-requests"]');
        if (collabSection) {
          collabSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return;
    }

    // Navigate to link if available
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  // Group notifications by date
  const groupedNotifications = React.useMemo(() => {
    const groups: Record<string, Notification[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach(notification => {
      const createdAt = new Date(notification.created_at);
      
      if (createdAt >= today) {
        groups['Today'].push(notification);
      } else if (createdAt >= yesterday) {
        groups['Yesterday'].push(notification);
      } else if (createdAt >= weekAgo) {
        groups['This Week'].push(notification);
      } else {
        groups['Older'].push(notification);
      }
    });

    // Remove empty groups
    return Object.entries(groups).filter(([_, notifications]) => notifications.length > 0);
  }, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 focus-visible:ring-4 focus-visible:ring-purple-400/50 focus-visible:outline-none",
            className
          )}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          {unreadCount > 0 && unreadCount <= 99 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-purple-900">
              {unreadCount}
            </span>
          )}
          {unreadCount > 99 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-purple-900">
              99+
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 md:w-96 bg-white/[0.08] backdrop-blur-[60px] saturate-[200%] border border-white/15 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-0 max-h-[600px] overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-white text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs text-white/70 hover:text-white hover:bg-white/10 h-7 px-2"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[500px]">
          {error ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
              <div className="text-red-400 text-sm mb-2">Error loading notifications</div>
              <div className="text-white/40 text-xs">{String(error)}</div>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <div className="text-white/60 text-sm">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <div className="text-white/60 text-sm">No notifications yet</div>
            </div>
          ) : (
            <AnimatePresence>
              {groupedNotifications.map(([groupName, groupNotifications]) => (
                <div key={groupName} className="border-b border-white/10 last:border-0">
                  <div className="px-4 py-2 bg-white/5">
                    <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                      {groupName}
                    </span>
                  </div>
                  {groupNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={cn(
                        "px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0",
                        !notification.read && "bg-white/[0.08]"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-white leading-tight">
                              {notification.title}
                            </p>
                            {notification.priority === 'urgent' && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                Urgent
                              </span>
                            )}
                          </div>
                          {notification.message && (
                            <p className="text-xs text-white/70 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            {notification.action_label && (
                              <span className="text-xs text-purple-400 flex items-center gap-1">
                                {notification.action_label}
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/notifications')}
              className="w-full text-white/70 hover:text-white hover:bg-white/10 justify-center"
            >
              View All Notifications
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;

