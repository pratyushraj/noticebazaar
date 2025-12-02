/**
 * useNotifications Hook
 * 
 * Fetches and manages user notifications with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Notification, NotificationStats } from '@/types/notifications';
import { toast } from 'sonner';

interface UseNotificationsOptions {
  enabled?: boolean;
  limit?: number;
  filter?: {
    read?: boolean;
    type?: string;
    category?: string;
  };
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { profile, user } = useSession();
  const queryClient = useQueryClient();
  const {
    enabled = true,
    limit = 50,
    filter = {},
  } = options;

  const userId = profile?.id || user?.id;

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', userId, filter],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filter.read !== undefined) {
        query = query.eq('read', filter.read);
      }
      if (filter.type) {
        query = query.eq('type', filter.type);
      }
      if (filter.category) {
        query = query.eq('category', filter.category);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist (404), return empty array instead of throwing
        const errorCode = (error as any)?.code;
        const errorStatus = (error as any)?.status;
        if (
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorStatus === 404 ||
          String(error.message || '').toLowerCase().includes('does not exist') ||
          String(error.message || '').toLowerCase().includes('relation') ||
          String(error.message || '').toLowerCase().includes('not found')
        ) {
          return [];
        }
        throw error;
      }

      return (data || []) as Notification[];
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Calculate stats
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPriority: notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      // Silently handle if table doesn't exist
      if (error) {
        const errorCode = (error as any)?.code;
        const errorStatus = (error as any)?.status;
        if (
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorStatus === 404 ||
          String(error.message || '').toLowerCase().includes('does not exist') ||
          String(error.message || '').toLowerCase().includes('relation')
        ) {
          return; // Table doesn't exist, silently ignore
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error('Failed to mark all as read', { description: error.message });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) return;
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      // Silently handle if table doesn't exist
      if (error) {
        const errorCode = (error as any)?.code;
        const errorStatus = (error as any)?.status;
        if (
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorStatus === 404 ||
          String(error.message || '').toLowerCase().includes('does not exist') ||
          String(error.message || '').toLowerCase().includes('relation')
        ) {
          return; // Table doesn't exist, silently ignore
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!userId || !enabled) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });

          // Show toast for new notifications
          if (payload.eventType === 'INSERT' && payload.new) {
            const notification = payload.new as Notification;
            if (!notification.read) {
              toast.info(notification.title, {
                description: notification.message || undefined,
                action: notification.link ? {
                  label: 'View',
                  onClick: () => window.location.href = notification.link!,
                } : undefined,
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, queryClient]);

  return {
    notifications,
    unreadCount: stats.unread,
    stats,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
  };
};

