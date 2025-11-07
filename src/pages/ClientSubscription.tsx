"use client";

import React, { useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb } from 'lucide-react'; // Import Lightbulb
import { toast } from 'sonner';
import { useClientSubscription } from '@/lib/hooks/useSubscriptions';
import { Badge } from '@/components/ui/badge';
import { Subscription } from '@/types';
import { Button } from '@/components/ui/button'; // Import Button
import { Link, useSearchParams } from 'react-router-dom'; // Import Link and useSearchParams
import { useClientDashboardMetrics } from '@/lib/hooks/useClientDashboardMetrics'; // Import new hook
import { useRazorpayCheckout } from '@/lib/hooks/useRazorpayCheckout'; // Import the new hook

// Razorpay Plan IDs (These must be created in the Razorpay dashboard)
const RAZORPAY_PLAN_IDS = {
  ESSENTIAL: 'plan_RYAEcDAo04FquF', // Updated: NB Essential Plan - Monthly
  GROWTH: 'plan_RXenKrqGKknM0T', // Confirmed: NB Growth Plan - Monthly
  STRATEGIC: 'plan_RYAFH2ibkrtE1m', // Updated: NB Strategic Plan - Monthly
};

const ClientSubscription = () => {
  const { profile, loading: sessionLoading } = useSession();
  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpayCheckout(); // Initialize checkout hook
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan'); // Get plan from URL query parameter

  const { data: subscription, isLoading: isLoadingSubscription, error: subscriptionError } = useClientSubscription({
    clientId: profile?.id,
    enabled: !!profile?.id,
  });

  const { data: clientMetrics, isLoading: isLoadingClientMetrics, error: clientMetricsError } = useClientDashboardMetrics(
    profile?.id,
    !!profile?.id
  );

  useEffect(() => {
    if (subscriptionError && (subscriptionError as any).code !== 'PGRST116') {
      toast.error('Error fetching subscription', { description: subscriptionError.message });
    }
  }, [subscriptionError]);

  useEffect(() => {
    if (clientMetricsError) {
      toast.error('Error fetching client metrics', { description: clientMetricsError.message });
    }
  }, [clientMetricsError]);

  const defaultSubscription: Subscription = {
    id: 'default-plan',
    client_id: profile?.id || '',
    plan_name: 'Premium',
    next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    status: 'active',
    priceDisplay: '₹15,000/month',
    cases_limit: 5, // Placeholder
    documents_limit: 20, // Placeholder
    consultations_limit: 2, // Placeholder
    created_at: new Date().toISOString(), // Added missing property
  };

  const currentSubscription = subscription || defaultSubscription;
  const isDefaultSubscription = !subscription;

  const handleManageSubscription = () => {
    let planId: string;
    let planName: string;

    // Determine which plan to initiate based on URL parameter or current subscription
    if (initialPlan === 'essential') {
      planId = RAZORPAY_PLAN_IDS.ESSENTIAL;
      planName = 'Essential';
    } else if (initialPlan === 'growth') {
      planId = RAZORPAY_PLAN_IDS.GROWTH;
      planName = 'Business Growth';
    } else if (initialPlan === 'strategic') {
      planId = RAZORPAY_PLAN_IDS.STRATEGIC;
      planName = 'Strategic Partner';
    } else {
      // Default to the current plan if one exists, or Essential if none exists
      planId = RAZORPAY_PLAN_IDS.ESSENTIAL;
      planName = currentSubscription.plan_name;
    }
    
    const description = `Subscription payment for ${planName}`;

    initiatePayment({
      planId: planId, // Pass determined planId
      description: description,
      onPaymentSuccess: (response) => {
        // In a real app, this would trigger a server-side verification and update the DB
        toast.success('Subscription payment processed!', { description: `Subscription ID: ${response.razorpay_subscription_id}. Your subscription status will be updated shortly.` });
        // Optionally trigger a refetch of subscription data here
      },
      onPaymentFailure: (error) => {
        console.error('Razorpay Payment Failed:', error);
      }
    });
  };

  if (sessionLoading || isLoadingSubscription || isLoadingClientMetrics) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">💳 My Subscription</h1>

      <Card className="max-w-2xl mx-auto bg-card shadow-lg rounded-xl border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Subscription Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {initialPlan && (
            <div className="bg-blue-500/10 text-blue-400 p-3 rounded-lg flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0" />
              <p className="text-sm">You selected the <strong>{initialPlan.charAt(0).toUpperCase() + initialPlan.slice(1)} Plan</strong>. Click 'Pay / Manage Subscription' to proceed with payment.</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Plan Name</p>
            <p className="text-lg font-semibold text-foreground">{currentSubscription.plan_name}</p>
          </div>
          {currentSubscription.priceDisplay && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Price</p>
              <p className="text-lg font-semibold text-foreground">{currentSubscription.priceDisplay}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={currentSubscription.status === 'active' ? 'success' : 'secondary'}>
              {currentSubscription.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Next Billing Date</p>
            <p className="text-lg font-semibold text-foreground">
              {isDefaultSubscription ? 'N/A (Default Plan)' : new Date(currentSubscription.next_billing_date).toLocaleDateString()}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cases this month</p>
              <p className="text-lg font-semibold text-foreground">{clientMetrics?.consultationsCompletedThisMonth || 0}/{currentSubscription.cases_limit}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents uploaded</p>
              <p className="text-lg font-semibold text-foreground">{clientMetrics?.documentsUploadedThisMonth || 0}/{currentSubscription.documents_limit}</p>
            </div>
          </div>
          {isDefaultSubscription && (
            <p className="text-sm text-muted-foreground">
              This is a default plan displayed because you do not have an active subscription.
            </p>
          )}
          <Button 
            variant="default" 
            className="w-full mt-6 bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90" 
            onClick={handleManageSubscription}
            disabled={isPaymentLoading}
          >
            {isPaymentLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Payment...
              </>
            ) : (
              'Pay / Manage Subscription'
            )}
          </Button>
          <div className="space-y-2 mt-4">
            <Card className="bg-secondary border-border text-foreground p-3 text-sm rounded-lg flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" /> Upgrade to Enterprise for unlimited cases, priority support, and dedicated advisor!
            </Card>
            <Card className="bg-secondary border-border text-foreground p-3 text-sm rounded-lg flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" /> Need more? Contact us for custom plans tailored to your needs.
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ClientSubscription;