import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    // Check visit count
    const count = parseInt(localStorage.getItem('visit_count') || '0', 10);
    setVisitCount(count);

    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Request permission on 2nd visit
    if (count === 2 && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000); // Wait 3 seconds after page load

      return () => clearTimeout(timer);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('You\'ll now receive payment reminders and updates!');
      } else if (result === 'denied') {
        toast.info('You can enable notifications in your browser settings');
      }
    } catch (error) {
      toast.error('Failed to request notification permission');
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      });
    }
  };

  return { permission, requestPermission, sendNotification };
};

