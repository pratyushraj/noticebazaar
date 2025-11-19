"use client";

import React, { useState } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

// Mock notifications - in real app, fetch from API
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Payment Received',
    message: 'You received ₹8,500 from Zepto',
    time: '2 hours ago',
    read: false,
    link: '/creator-payments',
  },
  {
    id: '2',
    title: 'Deal Approved',
    message: 'Nike deal has been approved',
    time: '5 hours ago',
    read: false,
    link: '/creator-contracts',
  },
  {
    id: '3',
    title: 'Contract Review',
    message: 'Mamaearth contract needs your review',
    time: '1 day ago',
    read: true,
    link: '/creator-contracts',
  },
  {
    id: '4',
    title: 'Tax Reminder',
    message: 'Quarterly tax filing due in 7 days',
    time: '2 days ago',
    read: true,
    link: '/creator-tax-compliance',
  },
];

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-gray-400/80 hover:text-gray-200 hover:bg-white/5 transition-all duration-200"
        >
          <Bell className="h-4 w-4 opacity-80" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 bg-[#0F121A]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl p-0"
        align="end"
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-400">{unreadCount} unread</p>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-4 cursor-pointer hover:bg-white/5 border-b border-white/5 last:border-b-0",
                  !notification.read && "bg-blue-500/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={cn(
                  "mt-0.5 h-2 w-2 rounded-full flex-shrink-0",
                  !notification.read ? "bg-blue-500" : "bg-transparent"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium mb-0.5",
                    !notification.read ? "text-white" : "text-gray-300"
                  )}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.time}
                  </p>
                </div>
                {notification.link && (
                  <ExternalLink className="h-3 w-3 text-gray-500 flex-shrink-0 mt-1" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5"
                onClick={() => {
                  navigate('/notifications');
                }}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;

