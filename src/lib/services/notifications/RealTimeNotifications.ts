import { useEffect, useRef, useCallback, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { trackEvent } from '@/lib/utils/analytics';

export interface RealTimeNotification {
  id: string;
  type: 'brand_offer' | 'deal_update' | 'payment_received' | 'deadline_reminder' | 'achievement' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  brandOffers: boolean;
  dealUpdates: boolean;
  payments: boolean;
  deadlines: boolean;
  achievements: boolean;
  marketing: boolean;
}

// WebSocket-based real-time notifications
export class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private listeners: Map<string, Function> = new Map();
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.connect();
  }

  private connect() {
    try {
      const wsUrl = `${process.env.NODE_ENV === 'production' ? 'wss' : 'ws'}://${
        process.env.VITE_WS_HOST || 'localhost:8080'
      }/notifications?userId=${this.userId}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const notification: RealTimeNotification = JSON.parse(event.data);
          this.emit('notification', notification);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  on(event: string, callback: Function) {
    this.listeners.set(event, callback);
  }

  off(event: string) {
    this.listeners.delete(event);
  }

  private emit(event: string, ...args: any[]) {
    const listener = this.listeners.get(event);
    if (listener) {
      listener(...args);
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// React hook for real-time notifications
export const useRealTimeNotifications = () => {
  const { profile } = useSession();
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<NotificationWebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (profile?.id && !wsRef.current) {
      wsRef.current = new NotificationWebSocket(profile.id);

      wsRef.current.on('connected', () => {
        setIsConnected(true);
        trackEvent('websocket_connected', { user_id: profile.id });
      });

      wsRef.current.on('notification', (notification: RealTimeNotification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            tag: notification.id,
            data: notification
          });
        }

        // Track notification received
        trackEvent('notification_received', {
          type: notification.type,
          user_id: profile.id
        });
      });

      wsRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      });
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [profile?.id]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      trackEvent('notification_permission_requested', {
        granted: permission === 'granted',
        user_id: profile?.id
      });
      return permission;
    }
    return 'denied';
  }, [profile?.id]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Send test notification (for development)
  const sendTestNotification = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send({
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification from NoticeBazaar',
        timestamp: new Date()
      });
    }
  }, []);

  return {
    notifications,
    isConnected,
    unreadCount,
    requestNotificationPermission,
    markAsRead,
    markAllAsRead,
    removeNotification,
    sendTestNotification
  };
};

// React components will be in separate files