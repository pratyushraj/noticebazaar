/**
 * Subscription Context
 * 
 * Manages user subscription state and billing operations.
 * Extracted from SessionContext for single responsibility.
 * 
 * @module domains/payments/contexts/SubscriptionContext
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../auth';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  UserSubscription,
  SubscriptionPlanDetails,
  SubscriptionUsage,
  SubscriptionContextType,
  Invoice,
  PaymentMethod,
  SUBSCRIPTION_PLANS,
} from '../types';

/**
 * API base URL
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Context
 */
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

/**
 * Provider component
 */
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch subscription data
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user?.id,
  });

  // Fetch usage data
  const { data: usageData, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['subscription-usage', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase as any)
        .rpc('get_subscription_usage', { p_user_id: user.id });

      if (error) throw error;
      return data as SubscriptionUsage[];
    },
    enabled: !!user?.id,
  });

  // Get plan details
  const plan = useMemo(() => {
    const planId = subscriptionData?.planId || 'free';
    return SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
  }, [subscriptionData?.planId]);

  // Computed values
  const isSubscribed = useMemo(() => {
    return subscriptionData?.status === 'active' || subscriptionData?.status === 'trialing';
  }, [subscriptionData?.status]);

  const isTrialing = useMemo(() => {
    return subscriptionData?.status === 'trialing';
  }, [subscriptionData?.status]);

  const isPastDue = useMemo(() => {
    return subscriptionData?.status === 'past_due';
  }, [subscriptionData?.status]);

  const daysUntilRenewal = useMemo(() => {
    if (!subscriptionData?.currentPeriodEnd) return null;
    const end = new Date(subscriptionData.currentPeriodEnd);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [subscriptionData?.currentPeriodEnd]);

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, interval }: { planId: SubscriptionPlan; interval: BillingInterval }) => {
      const response = await fetch(`${API_URL}/subscriptions/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ planId, interval }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');
      return response.json();
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async (immediately: boolean = false) => {
      const response = await fetch(`${API_URL}/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ immediately }),
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    },
  });

  // Resume subscription mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/subscriptions/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to resume subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    },
  });

  // Update payment method mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/subscriptions/update-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to update payment method');
      return response.json();
    },
  });

  // Check if user has a feature
  const hasFeature = useCallback((featureId: string): boolean => {
    const feature = plan.features.find(f => f.id === featureId);
    return feature?.included ?? false;
  }, [plan]);

  // Get feature limit
  const getFeatureLimit = useCallback((featureId: string): number | null => {
    const feature = plan.features.find(f => f.id === featureId);
    if (!feature?.included) return null;
    return feature.limit ?? null; // null means unlimited
  }, [plan]);

  // Get feature usage
  const getFeatureUsage = useCallback((featureId: string): SubscriptionUsage | null => {
    return usageData?.find(u => u.featureId === featureId) || null;
  }, [usageData]);

  // Check feature access (considering usage limits)
  const checkFeatureAccess = useCallback((featureId: string): boolean => {
    if (!hasFeature(featureId)) return false;
    
    const limit = getFeatureLimit(featureId);
    if (limit === null) return true; // Unlimited
    
    const usage = getFeatureUsage(featureId);
    if (!usage) return true; // No usage data yet
    
    return usage.used < limit;
  }, [hasFeature, getFeatureLimit, getFeatureUsage]);

  // Subscribe to a plan
  const subscribe = useCallback(async (planId: SubscriptionPlan, interval: BillingInterval) => {
    const result = await subscribeMutation.mutateAsync({ planId, interval });
    return { checkoutUrl: result.checkoutUrl };
  }, [subscribeMutation]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (immediately: boolean = false) => {
    await cancelMutation.mutateAsync(immediately);
  }, [cancelMutation]);

  // Resume subscription
  const resumeSubscription = useCallback(async () => {
    await resumeMutation.mutateAsync();
  }, [resumeMutation]);

  // Update payment method
  const updatePaymentMethod = useCallback(async () => {
    const result = await updatePaymentMutation.mutateAsync();
    return { setupUrl: result.setupUrl };
  }, [updatePaymentMutation]);

  // Get invoices
  const getInvoices = useCallback(async (): Promise<Invoice[]> => {
    const response = await fetch(`${API_URL}/subscriptions/invoices`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  }, []);

  // Get payment methods
  const getPaymentMethods = useCallback(async (): Promise<PaymentMethod[]> => {
    const response = await fetch(`${API_URL}/subscriptions/payment-methods`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch payment methods');
    return response.json();
  }, []);

  const value: SubscriptionContextType = {
    // State
    subscription: subscriptionData ?? null,
    plan,
    usage: usageData || [],
    isLoading: isLoadingSubscription || isLoadingUsage,
    isError: false,
    
    // Computed
    isSubscribed,
    isTrialing,
    isPastDue,
    daysUntilRenewal,
    hasFeature,
    getFeatureLimit,
    getFeatureUsage,
    
    // Actions
    subscribe,
    cancelSubscription,
    resumeSubscription,
    updatePaymentMethod,
    getInvoices,
    getPaymentMethods,
    checkFeatureAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to use subscription context
 */
export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export default SubscriptionContext;
