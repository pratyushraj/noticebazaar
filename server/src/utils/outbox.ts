import { supabase } from '../lib/supabase.js';

export type FailedNotificationType = 'email' | 'push' | 'sms';

export interface FailedNotification {
  type: FailedNotificationType;
  recipient_id?: string;
  recipient_email?: string;
  recipient_phone?: string;
  payload: any;
  error_message: string;
  source: string;
}

export const logFailedNotification = async (notification: FailedNotification) => {
  try {
    // Attempt to log to a dedicated failed_notifications table
    const { error } = await supabase
      .from('failed_notifications')
      .insert({
        type: notification.type,
        recipient_id: notification.recipient_id,
        recipient_email: notification.recipient_email,
        recipient_phone: notification.recipient_phone,
        payload: notification.payload,
        error_message: notification.error_message,
        source: notification.source,
        status: 'pending_retry',
        created_at: new Date().toISOString()
      });

    if (error) {
      // Fallback: If table doesn't exist yet, we still log to console but with a specific format
      // that Datadog/CloudWatch can easily parse and alert on.
      console.error(JSON.stringify({
        level: 'CRITICAL',
        event: 'NOTIFICATION_DELIVERY_FAILED',
        ...notification
      }));
    }
  } catch (err) {
    console.error('[Outbox] Failed to log failed notification:', err);
  }
};
