/**
 * Notification Worker
 * 
 * Handles notification sending jobs.
 * 
 * @module shared/workers/notificationWorker
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Notification options
 */
interface NotificationOptions {
  userId: string;
  type: 'push' | 'email' | 'in_app';
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Notification result
 */
interface NotificationResult {
  notificationId: string;
  type: string;
  status: string;
}

/**
 * Supabase client (lazy initialized)
 */
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Supabase client
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabaseClient;
}

/**
 * Send a notification
 */
export async function sendNotification(options: NotificationOptions): Promise<NotificationResult> {
  const { userId, type, title, message, data } = options;
  const supabase = getSupabaseClient();

  // Create notification record
  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
    })
    .select()
    .single();

  if (notificationError) {
    throw new Error(`Failed to create notification: ${notificationError.message}`);
  }

  // Send based on type
  switch (type) {
    case 'push':
      await sendPushNotification(userId, title, message, data);
      break;
    case 'email':
      await sendEmailNotification(userId, title, message, data);
      break;
    case 'in_app':
      // Already created in database, no additional action needed
      break;
    default:
      console.warn(`Unknown notification type: ${type}`);
  }

  return {
    notificationId: notification.id,
    type,
    status: 'sent',
  };
}

/**
 * Send push notification
 */
async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Get user's push tokens
  const { data: pushTokens, error } = await supabase
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', userId)
    .eq('active', true);

  if (error || !pushTokens?.length) {
    console.log(`No push tokens found for user ${userId}`);
    return;
  }

  // Send to each token
  // Note: In production, you'd use FCM/APNs directly or a service like OneSignal
  for (const { token, platform } of pushTokens) {
    try {
      // Placeholder for actual push notification sending
      // In production, integrate with Firebase Cloud Messaging or similar
      console.log(`Sending push to ${platform} device: ${token.substring(0, 10)}...`);
      
      // Example FCM integration (would need firebase-admin package):
      // await admin.messaging().send({
      //   token,
      //   notification: { title, body: message },
      //   data: data as any,
      // });
    } catch (error) {
      console.error(`Failed to send push to token ${token.substring(0, 10)}...:`, error);
    }
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Get user's email
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (error || !profile?.email) {
    console.log(`No email found for user ${userId}`);
    return;
  }

  // Queue email
  const { queueEmail } = await import('../lib/queue');
  await queueEmail({
    to: profile.email,
    subject: title,
    template: 'notification',
    data: {
      title,
      message,
      userName: profile.full_name,
      ...data,
    },
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Clean up old notifications
 */
export async function cleanupOldNotifications(olderThanDays: number = 90): Promise<number> {
  const supabase = getSupabaseClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .eq('read', true)
    .select('id');

  if (error) {
    throw new Error(`Failed to cleanup notifications: ${error.message}`);
  }

  return data?.length || 0;
}

export default {
  sendNotification,
  markNotificationRead,
  getUnreadCount,
  cleanupOldNotifications,
};
