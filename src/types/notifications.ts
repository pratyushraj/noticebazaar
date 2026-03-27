/**
 * Notification System Types
 * 
 * Defines types for the notification system including
 * notification structure, preferences, and categories
 */

export type NotificationType = 
  | 'payment' 
  | 'deal' 
  | 'contract' 
  | 'tax' 
  | 'message' 
  | 'system' 
  | 'reminder';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory =
  | 'payment_received'
  | 'payment_pending'
  | 'payment_overdue'
  | 'deal_approved'
  | 'deal_rejected'
  | 'deal_expiring'
  | 'contract_review_required'
  | 'contract_expiring'
  | 'contract_signed'
  | 'tax_deadline_approaching'
  | 'tax_filing_due'
  | 'message_received'
  | 'message_unread'
  | 'system_update'
  | 'system_maintenance'
  | 'reminder_custom';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string | null;
  data: Record<string, any>; // Additional data (deal_id, amount, etc.)
  link: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
  priority: NotificationPriority;
  icon: string | null;
  action_label: string | null;
  action_link: string | null;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start: string | null; // Time format: "HH:MM:SS"
  quiet_hours_end: string | null;
  do_not_disturb: boolean;
  preferences: Record<string, CategoryPreference>; // Category -> Preference mapping
  created_at: string;
  updated_at: string;
}

export interface CategoryPreference {
  email?: boolean;
  push?: boolean;
  in_app?: boolean;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message?: string;
  data?: Record<string, any>;
  link?: string;
  priority?: NotificationPriority;
  icon?: string;
  action_label?: string;
  action_link?: string;
  expires_at?: string;
}

export interface NotificationGroup {
  date: string; // "Today", "Yesterday", "This Week", or actual date
  notifications: Notification[];
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

