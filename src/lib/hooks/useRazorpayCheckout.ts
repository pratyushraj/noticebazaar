import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { useCallback } from 'react';

// Define the structure of the Razorpay options object
interface RazorpayOptions {
  key: string;
  amount?: number; // Amount is optional for subscriptions
  currency?: string; // Currency is optional for subscriptions
  name: string;
  description: string;
  subscription_id: string; // Changed from order_id
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

// Utility function to load the Razorpay script dynamically
const loadRazorpayScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('razorpay-checkout-js')) {
      return resolve();
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (error) => reject(new Error(`Failed to load Razorpay script: ${error}`));
    document.body.appendChild(script);
  });
};

interface CheckoutDetails {
  planId: string; // New: Plan ID instead of amount
  description: string;
  onPaymentSuccess: (response: any) => void;
  onPaymentFailure?: (error: any) => void;
}

export const useRazorpayCheckout = () => {
  const { user, profile } = useSession();
  
  // NOTE: Relying solely on VITE_RAZORPAY_KEY_ID from environment variables.
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID; 

  // Mutation to create the subscription via Edge Function
  const createSubscriptionMutation = useSupabaseMutation<{ subscriptionId: string }, Error, { plan_id: string, receipt: string }>(
    async (subscriptionData) => {
      if (!user) throw new Error('User not authenticated.');
      
      // Invoke the new subscription creation function
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: subscriptionData,
      });

      if (error) {
        // This handles network/invocation errors from Supabase client (e.g., 4xx/5xx status codes)
        throw new Error(error.message);
      }
      
      // Check for application-level errors returned by the Edge Function (if it returned a 200 status with an error payload)
      if (data && (data as any).error) {
        // If the Edge Function returned a 200 status but contained an error object (as defined in the function)
        throw new Error((data as any).error);
      }
      
      // If we reach here, the invocation was successful and returned data.
      return data as { subscriptionId: string };
    },
    {
      errorMessage: 'Failed to create payment subscription', // Updated error message
    }
  );

  const initiatePayment = useCallback(async (details: CheckoutDetails) => {
    if (!user || !profile || !RAZORPAY_KEY_ID) {
      toast.error('Payment setup incomplete. Please ensure you are logged in and Razorpay keys are configured in .env.');
      return;
    }

    const { planId, description, onPaymentSuccess, onPaymentFailure } = details;

    try {
      // 1. Load Razorpay script
      await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');

      // 2. Create Subscription via Edge Function
      const userIdShort = user.id.slice(-8);
      const receiptId = `NB_SUB_${userIdShort}_${Date.now()}`;

      const subscriptionResult = await createSubscriptionMutation.mutateAsync({
        plan_id: planId,
        receipt: receiptId,
      });

      const handlePaymentResponse = async (response: any) => {
        // This handler is called on successful payment/subscription activation
        toast.success('Subscription successful!', { description: `Subscription ID: ${response.razorpay_subscription_id}. Status will be updated shortly.` });
        
        // Process referral commission if applicable
        try {
          // Get subscription amount (you may need to adjust this based on your plan pricing)
          const planPrices: Record<string, number> = {
            // Add your plan IDs and prices here
            // Example: 'plan_xxxxx': 1000, // Monthly price in rupees
          };
          
          const subscriptionAmount = planPrices[planId] || 0;
          
          if (subscriptionAmount > 0 && user?.id) {
            // Call edge function to process referral commission
            await supabase.functions.invoke('process-referral-commission', {
              body: {
                userId: user.id,
                subscriptionAmount,
              },
            });
          }
        } catch (referralError: any) {
          console.error('Error processing referral commission:', referralError);
          // Don't block payment success if referral processing fails
        }
        
        onPaymentSuccess(response);
      };

      const options: RazorpayOptions = {
        key: RAZORPAY_KEY_ID,
        name: 'CreatorArmour',
        description: description,
        subscription_id: subscriptionResult.subscriptionId, // Use subscription_id
        handler: handlePaymentResponse,
        prefill: {
          name: `${profile.first_name} ${profile.last_name}`,
          email: user.email || '',
          contact: '',
        },
        theme: {
          color: '#3b82f6',
        },
      };

      // 3. Open Razorpay Checkout
      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', (response: any) => {
        toast.error('Subscription payment failed', { description: response.error.description });
        console.error('Razorpay Failure:', response.error);
        onPaymentFailure?.(response.error);
      });

      rzp.open();

    } catch (error: any) {
      toast.error('Subscription initiation failed', { description: error.message });
      onPaymentFailure?.(error);
    }
  }, [user, profile, RAZORPAY_KEY_ID, createSubscriptionMutation]);

  return {
    initiatePayment,
    isLoading: createSubscriptionMutation.isPending,
  };
};