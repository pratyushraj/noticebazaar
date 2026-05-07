// @ts-nocheck
import { supabase } from '../lib/supabase.js';
import { sendGenericPushNotification } from './pushNotificationService.js';

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type: 'deal' | 'contract' | 'payment' | 'system';
  category: string;
  link: string;
  priority?: 'normal' | 'high';
  data?: Record<string, any>;
  actionLabel?: string;
  actionLink?: string;
  icon?: string;
}

/**
 * Sends a unified notification (In-app DB + Push)
 */
export const notifyUser = async (input: NotificationInput) => {
  const {
    userId,
    title,
    message,
    type,
    category,
    link,
    priority = 'normal',
    data = {},
    actionLabel,
    actionLink,
    icon,
  } = input;

  if (!userId) {
    console.warn('[NotificationService] userId is required');
    return { dbSuccess: false, pushSent: false };
  }

  // 1. In-app notification
  const { error: dbError } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    category,
    title,
    message,
    data,
    link,
    priority,
    icon: icon || (type === 'payment' ? 'DollarSign' : type === 'contract' ? 'FileText' : 'Bell'),
    action_label: actionLabel,
    action_link: actionLink || link,
    read: false,
  });

  if (dbError) {
    console.warn('[NotificationService] Failed to create DB notification:', dbError.message);
  }

  // 2. Push notification
  const pushResult = await sendGenericPushNotification({
    userId,
    title,
    body: message,
    url: actionLink || link,
    data: {
      ...data,
      category,
      type,
    },
  });

  return {
    dbSuccess: !dbError,
    pushSent: pushResult.sent,
    pushDetails: pushResult,
  };
};

/**
 * Brand-specific notification triggers
 */
export const notifyBrandOfCreatorAction = async (
  brandId: string,
  dealId: string,
  creatorName: string,
  action: 'accepted' | 'content_uploaded' | 'shipping_updated'
) => {
  let title = '';
  let message = '';
  let category = '';
  let actionLabel = 'View Deal';

  switch (action) {
    case 'accepted':
      title = 'Offer accepted!';
      message = `${creatorName} accepted your collaboration offer.`;
      category = 'brand_offer_accepted';
      actionLabel = 'Review Deal';
      break;
    case 'content_uploaded':
      title = 'Content uploaded';
      message = `${creatorName} uploaded content for your review.`;
      category = 'brand_content_review_pending';
      actionLabel = 'Review Content';
      break;
    case 'shipping_updated':
      title = 'Shipping updated';
      message = `${creatorName} updated shipping details for your product.`;
      category = 'brand_shipping_update';
      actionLabel = 'Track Shipping';
      break;
  }

  return notifyUser({
    userId: brandId,
    title,
    message,
    type: 'deal',
    category,
    link: `/brand-dashboard?dealId=${dealId}`,
    actionLabel,
    actionLink: `/brand-dashboard?dealId=${dealId}`,
    priority: 'high'
  });
};

/**
 * Creator-specific notification triggers
 */
export const notifyCreatorOfBrandAction = async (
  creatorId: string,
  dealId: string,
  brandName: string,
  action: 'pincode_added' | 'contract_signed' | 'content_approved' | 'payment_released'
) => {
  let title = '';
  let message = '';
  let category = '';
  let actionLabel = 'View Deal';
  let type: any = 'deal';

  switch (action) {
    case 'pincode_added':
      title = 'Shipping address added';
      message = `${brandName} added their shipping address for your barter.`;
      category = 'creator_shipping_address_ready';
      actionLabel = 'View Details';
      break;
    case 'contract_signed':
      title = 'Contract signed';
      message = `${brandName} signed the contract. You can now start working!`;
      category = 'contract_signed';
      type = 'contract';
      actionLabel = 'View Contract';
      break;
    case 'content_approved':
      title = 'Content approved';
      message = `${brandName} approved your content submission.`;
      category = 'deal_content_approved';
      actionLabel = 'View Status';
      break;
    case 'payment_released':
      title = 'Payment released';
      message = `${brandName} released your payment. Check your account!`;
      category = 'payment_confirmed';
      type = 'payment';
      actionLabel = 'View Payout';
      break;
  }

  return notifyUser({
    userId: creatorId,
    title,
    message,
    type,
    category,
    link: `/deal/${dealId}`,
    actionLabel,
    actionLink: `/deal/${dealId}`,
    priority: 'high'
  });
};
