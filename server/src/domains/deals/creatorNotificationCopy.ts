import type { DealRecord } from './lifecycle.js';

export type CreatorNotificationTemplate =
  | 'offer_received'
  | 'offer_accepted'
  | 'contract_signed'
  | 'content_requested'
  | 'revision_requested'
  | 'content_approved'
  | 'payment_marked'
  | 'payment_confirmed'
  | 'deal_completed';

export interface CreatorNotificationContent {
  title: string;
  message: string;
  type: 'deal' | 'contract' | 'payment';
  category: string;
  priority: 'normal' | 'high';
  link: string;
  actionLabel: string;
  actionLink: string;
  emailSubject: string;
}

const frontendUrl = (process.env.FRONTEND_URL || 'https://creatorarmour.com').replace(/\/$/, '');

const getDealLink = (dealId: string) => `${frontendUrl}/deal/${dealId}`;
const getDeliveryDetailsLink = (dealId: string) => `${frontendUrl}/deal-delivery-details/${dealId}`;
const getPaymentLink = (dealId: string) => `${frontendUrl}/payment/${dealId}`;

export function getCreatorNotificationContent(
  template: CreatorNotificationTemplate,
  deal: DealRecord
): CreatorNotificationContent {
  switch (template) {
    case 'offer_received':
      return {
        title: 'New brand offer',
        message: 'You have a new brand offer',
        type: 'deal',
        category: 'deal_offer_received',
        priority: 'high',
        link: `${frontendUrl}/creator-dashboard`,
        actionLabel: 'Review Offer',
        actionLink: `${frontendUrl}/creator-dashboard`,
        emailSubject: 'You have a new brand offer',
      };
    case 'offer_accepted':
      return {
        title: 'Deal started',
        message: 'Deal started',
        type: 'deal',
        category: 'deal_started',
        priority: 'high',
        link: getDeliveryDetailsLink(deal.id),
        actionLabel: 'View Deal',
        actionLink: getDealLink(deal.id),
        emailSubject: 'Deal started',
      };
    case 'contract_signed':
      return {
        title: 'Contract signed',
        message: 'Contract signed. You can start working on content.',
        type: 'contract',
        category: 'contract_signed',
        priority: 'high',
        link: getDealLink(deal.id),
        actionLabel: 'Start Content',
        actionLink: getDealLink(deal.id),
        emailSubject: 'Contract signed. You can start working on content.',
      };
    case 'content_requested':
      return {
        title: 'Upload content',
        message: 'Upload your content for brand review',
        type: 'deal',
        category: 'content_requested',
        priority: 'high',
        link: getDealLink(deal.id),
        actionLabel: 'Upload Content',
        actionLink: getDealLink(deal.id),
        emailSubject: 'Upload your content for brand review',
      };
    case 'revision_requested':
      return {
        title: 'Changes requested',
        message: 'Brand requested changes to your content',
        type: 'deal',
        category: 'deal_revision_requested',
        priority: 'high',
        link: getDealLink(deal.id),
        actionLabel: 'Upload Revised Content',
        actionLink: getDealLink(deal.id),
        emailSubject: 'Brand requested changes to your content',
      };
    case 'content_approved':
      return {
        title: 'Content approved',
        message: 'Content approved. Waiting for payment',
        type: 'deal',
        category: 'deal_content_approved',
        priority: 'high',
        link: getPaymentLink(deal.id),
        actionLabel: 'View Deal',
        actionLink: getDealLink(deal.id),
        emailSubject: 'Content approved. Waiting for payment',
      };
    case 'payment_marked':
      return {
        title: 'Payment sent',
        message: 'Brand marked payment sent. Confirm once you receive it',
        type: 'payment',
        category: 'payment_marked_sent',
        priority: 'high',
        link: getPaymentLink(deal.id),
        actionLabel: 'Confirm Payment Received',
        actionLink: getPaymentLink(deal.id),
        emailSubject: 'Brand marked payment sent. Confirm once you receive it',
      };
    case 'payment_confirmed':
      return {
        title: 'Payment confirmed',
        message: 'Payment confirmed. Invoice ready',
        type: 'payment',
        category: 'payment_confirmed',
        priority: 'high',
        link: getPaymentLink(deal.id),
        actionLabel: 'Download Invoice',
        actionLink: getDealLink(deal.id),
        emailSubject: 'Payment confirmed. Invoice ready',
      };
    case 'deal_completed':
      return {
        title: 'Deal completed',
        message: 'Deal completed successfully',
        type: 'deal',
        category: 'deal_completed',
        priority: 'normal',
        link: getDealLink(deal.id),
        actionLabel: 'View Deal',
        actionLink: getDealLink(deal.id),
        emailSubject: 'Deal completed successfully',
      };
  }
}
