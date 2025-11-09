import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Edge Function: create-razorpay-subscription started.');

  try {
    // 1. Authentication Check (Ensure JWT is present)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Authentication failed: Missing Authorization header.');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Expect plan_id instead of amount
    const { plan_id, total_count = 12, notes } = await req.json(); 

    if (!plan_id) {
      console.error('Invalid plan_id received.');
      return new Response(JSON.stringify({ error: 'Plan ID is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    console.log(`Attempting to create subscription for plan: ${plan_id}`);

    // Retrieve keys from Deno environment using the names provided by the user.
    const key_id = Deno.env.get('key_id');
    const key_secret = Deno.env.get('key_secret');

    if (!key_id || !key_secret) {
        console.error('CRITICAL: Razorpay keys missing in environment.');
        return new Response(JSON.stringify({ 
            error: 'Server configuration error: Razorpay keys missing.',
            details: 'Please ensure key_id and key_secret are set as Supabase Secrets.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    
    // Use btoa for Base64 encoding (standard in Deno)
    const auth = btoa(`${key_id}:${key_secret}`); 

    const subscriptionData = {
      plan_id: plan_id,
      total_count: total_count, // Default to 12 billing cycles
      customer_notify: 1, // Notify customer via email
      notes: notes || {},
    };

    // 3. Use fetch to create the subscription
    const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      // Log the full error response from Razorpay
      console.error('Razorpay API Error (Non-2xx Status):', response.status, responseBody);
      
      // Return a 500 status to the client, including the Razorpay error description if available
      const errorMessage = responseBody.error?.description || responseBody.error?.code || 'Unknown Razorpay API error';
      return new Response(JSON.stringify({ 
        error: `Razorpay API failed: ${errorMessage}`,
        razorpay_status: response.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const subscription = responseBody;
    
    console.log('Razorpay Subscription created successfully:', subscription.id);

    return new Response(JSON.stringify({ subscriptionId: subscription.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Razorpay Subscription Creation Error:', error.message, error);
    return new Response(JSON.stringify({ error: `Subscription creation failed: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});