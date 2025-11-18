import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, subscriptionAmount } = await req.json();

    if (!userId || !subscriptionAmount) {
      return new Response(
        JSON.stringify({ error: 'userId and subscriptionAmount are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find referral for this user
    const { data: referral, error: referralError } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .eq('subscribed', false)
      .single();

    if (referralError || !referral) {
      // No referral found or already processed
      return new Response(
        JSON.stringify({ message: 'No referral found or already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Update referral as subscribed
    const { error: updateError } = await supabaseClient
      .from('referrals')
      .update({
        subscribed: true,
        first_payment_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    if (updateError) {
      throw updateError;
    }

    // Record commission via database function
    const { data: earningId, error: commissionError } = await supabaseClient.rpc(
      'record_referral_commission',
      {
        p_referral_id: referral.id,
        p_subscription_amount: subscriptionAmount,
      }
    );

    if (commissionError) {
      console.error('Commission calculation error:', commissionError);
      // Don't throw - referral is already marked as subscribed
    }

    // Check and award milestones
    await supabaseClient.rpc('check_and_award_milestones', {
      p_user_id: referral.referrer_id,
    });

    // Add free month credit
    await supabaseClient.rpc('add_free_month_credit', {
      p_user_id: referral.referrer_id,
      months_count: 1,
    });

    // Refresh partner stats
    await supabaseClient.rpc('refresh_partner_stats', {
      p_user_id: referral.referrer_id,
    });

    return new Response(
      JSON.stringify({ success: true, earningId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error processing referral commission:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

