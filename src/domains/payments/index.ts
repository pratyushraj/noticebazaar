/**
 * Payments Domain
 * 
 * Exports for the payments/subscription domain module.
 * 
 * @module domains/payments
 */

// Types
export type {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  SubscriptionFeature,
  SubscriptionPlanDetails,
  UserSubscription,
  PaymentMethod,
  Invoice,
  SubscriptionUsage,
  SubscriptionContextType,
} from './types';

// Constants
export { SUBSCRIPTION_PLANS } from './types';

// Context
export { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
