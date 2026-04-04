/**
 * Subscription Types
 * 
 * Type definitions for subscription and payment domain.
 * 
 * @module domains/payments/types
 */

/**
 * Subscription plan types
 */
export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing';

/**
 * Billing interval
 */
export type BillingInterval = 'monthly' | 'yearly';

/**
 * Subscription feature
 */
export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

/**
 * Subscription plan details
 */
export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  billingInterval: BillingInterval;
  features: SubscriptionFeature[];
  popular?: boolean;
}

/**
 * User subscription
 */
export interface UserSubscription {
  id: string;
  userId: string;
  planId: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

/**
 * Payment method
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

/**
 * Invoice
 */
export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: string;
  paidAt?: string;
  invoiceUrl?: string;
  invoicePdf?: string;
}

/**
 * Subscription usage
 */
export interface SubscriptionUsage {
  featureId: string;
  featureName: string;
  used: number;
  limit: number;
  percentage: number;
}

/**
 * Subscription context type
 */
export interface SubscriptionContextType {
  // State
  subscription: UserSubscription | null;
  plan: SubscriptionPlanDetails | null;
  usage: SubscriptionUsage[];
  isLoading: boolean;
  isError: boolean;
  
  // Computed
  isSubscribed: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  daysUntilRenewal: number | null;
  hasFeature: (featureId: string) => boolean;
  getFeatureLimit: (featureId: string) => number | null;
  getFeatureUsage: (featureId: string) => SubscriptionUsage | null;
  
  // Actions
  subscribe: (planId: SubscriptionPlan, interval: BillingInterval) => Promise<{ checkoutUrl: string }>;
  cancelSubscription: (immediately?: boolean) => Promise<void>;
  resumeSubscription: () => Promise<void>;
  updatePaymentMethod: () => Promise<{ setupUrl: string }>;
  getInvoices: () => Promise<Invoice[]>;
  getPaymentMethods: () => Promise<PaymentMethod[]>;
  checkFeatureAccess: (featureId: string) => boolean;
}

/**
 * Subscription plans configuration
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic features',
    price: 0,
    billingInterval: 'monthly',
    features: [
      { id: 'contracts', name: 'Contracts', description: 'Generate contracts', included: true, limit: 3 },
      { id: 'ai_analysis', name: 'AI Analysis', description: 'AI contract analysis', included: true, limit: 1 },
      { id: 'messaging', name: 'Messaging', description: 'Direct messaging', included: true, limit: 10 },
      { id: 'storefront', name: 'Storefront', description: 'Creator storefront', included: false },
      { id: 'priority_support', name: 'Priority Support', description: 'Priority customer support', included: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for growing creators',
    price: 499,
    billingInterval: 'monthly',
    features: [
      { id: 'contracts', name: 'Contracts', description: 'Generate contracts', included: true, limit: 10 },
      { id: 'ai_analysis', name: 'AI Analysis', description: 'AI contract analysis', included: true, limit: 5 },
      { id: 'messaging', name: 'Messaging', description: 'Direct messaging', included: true, limit: 50 },
      { id: 'storefront', name: 'Storefront', description: 'Creator storefront', included: true },
      { id: 'priority_support', name: 'Priority Support', description: 'Priority customer support', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For serious content creators',
    price: 1499,
    billingInterval: 'monthly',
    popular: true,
    features: [
      { id: 'contracts', name: 'Contracts', description: 'Generate contracts', included: true, limit: 50 },
      { id: 'ai_analysis', name: 'AI Analysis', description: 'AI contract analysis', included: true, limit: 25 },
      { id: 'messaging', name: 'Messaging', description: 'Direct messaging', included: true, limit: -1 }, // -1 = unlimited
      { id: 'storefront', name: 'Storefront', description: 'Creator storefront', included: true },
      { id: 'priority_support', name: 'Priority Support', description: 'Priority customer support', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For agencies and teams',
    price: 4999,
    billingInterval: 'monthly',
    features: [
      { id: 'contracts', name: 'Contracts', description: 'Generate contracts', included: true, limit: -1 },
      { id: 'ai_analysis', name: 'AI Analysis', description: 'AI contract analysis', included: true, limit: -1 },
      { id: 'messaging', name: 'Messaging', description: 'Direct messaging', included: true, limit: -1 },
      { id: 'storefront', name: 'Storefront', description: 'Creator storefront', included: true },
      { id: 'priority_support', name: 'Priority Support', description: 'Priority customer support', included: true },
      { id: 'dedicated_manager', name: 'Dedicated Manager', description: 'Dedicated account manager', included: true },
    ],
  },
];
