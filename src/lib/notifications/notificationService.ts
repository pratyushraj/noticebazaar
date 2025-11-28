/**
 * Notification Service
 * 
 * Service for creating and managing notifications
 * Can be used from backend (Edge Functions) or frontend (with service role)
 */

import { supabase } from '@/integrations/supabase/client';
import { CreateNotificationInput, Notification } from '@/types/notifications';

class NotificationService {
  /**
   * Create a notification
   * Note: This requires service role key or RLS policy that allows inserts
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.user_id,
        type: input.type,
        category: input.category,
        title: input.title,
        message: input.message || null,
        data: input.data || {},
        link: input.link || null,
        priority: input.priority || 'normal',
        icon: input.icon || null,
        action_label: input.action_label || null,
        action_link: input.action_link || null,
        expires_at: input.expires_at || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return data as Notification;
  }

  /**
   * Create multiple notifications (batch)
   */
  async createNotifications(inputs: CreateNotificationInput[]): Promise<Notification[]> {
    const notifications = inputs.map(input => ({
      user_id: input.user_id,
      type: input.type,
      category: input.category,
      title: input.title,
      message: input.message || null,
      data: input.data || {},
      link: input.link || null,
      priority: input.priority || 'normal',
      icon: input.icon || null,
      action_label: input.action_label || null,
      action_link: input.action_link || null,
      expires_at: input.expires_at || null,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('Error creating notifications:', error);
      throw error;
    }

    return (data || []) as Notification[];
  }

  /**
   * Create notification for payment received
   */
  async notifyPaymentReceived(
    userId: string,
    amount: number,
    brandName: string,
    paymentId?: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'payment',
      category: 'payment_received',
      title: 'Payment Received',
      message: `You received ₹${amount.toLocaleString('en-IN')} from ${brandName}`,
      data: {
        amount,
        brand_name: brandName,
        payment_id: paymentId,
      },
      link: '/creator-payments',
      priority: 'high',
      icon: 'DollarSign',
      action_label: 'View Payment',
      action_link: paymentId ? `/creator-payments?payment=${paymentId}` : '/creator-payments',
    });
  }

  /**
   * Create notification for deal approved
   */
  async notifyDealApproved(
    userId: string,
    dealTitle: string,
    dealId: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'deal',
      category: 'deal_approved',
      title: 'Deal Approved',
      message: `${dealTitle} has been approved`,
      data: {
        deal_id: dealId,
        deal_title: dealTitle,
      },
      link: `/creator-contracts/${dealId}`,
      priority: 'high',
      icon: 'CheckCircle',
      action_label: 'View Deal',
      action_link: `/creator-contracts/${dealId}`,
    });
  }

  /**
   * Create notification for contract expiring
   */
  async notifyContractExpiring(
    userId: string,
    contractTitle: string,
    daysUntilExpiry: number,
    contractId: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'contract',
      category: 'contract_expiring',
      title: 'Contract Expiring Soon',
      message: `${contractTitle} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
      data: {
        contract_id: contractId,
        contract_title: contractTitle,
        days_until_expiry: daysUntilExpiry,
      },
      link: `/creator-contracts/${contractId}`,
      priority: daysUntilExpiry <= 7 ? 'urgent' : 'normal',
      icon: 'AlertCircle',
      action_label: 'Review Contract',
      action_link: `/creator-contracts/${contractId}`,
    });
  }

  /**
   * Create notification for tax deadline
   */
  async notifyTaxDeadline(
    userId: string,
    deadlineType: string,
    daysUntilDeadline: number
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'tax',
      category: 'tax_deadline_approaching',
      title: 'Tax Deadline Approaching',
      message: `${deadlineType} filing due in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`,
      data: {
        deadline_type: deadlineType,
        days_until_deadline: daysUntilDeadline,
      },
      link: '/creator-tax-compliance',
      priority: daysUntilDeadline <= 7 ? 'urgent' : 'normal',
      icon: 'Calendar',
      action_label: 'View Tax Compliance',
      action_link: '/creator-tax-compliance',
    });
  }

  /**
   * Create notification for new message
   */
  async notifyNewMessage(
    userId: string,
    senderName: string,
    messagePreview: string,
    messageId: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'message',
      category: 'message_received',
      title: `New message from ${senderName}`,
      message: messagePreview,
      data: {
        sender_name: senderName,
        message_id: messageId,
      },
      link: '/messages',
      priority: 'high',
      icon: 'MessageCircle',
      action_label: 'View Message',
      action_link: '/messages',
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;

