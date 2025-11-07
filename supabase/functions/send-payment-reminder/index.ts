import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandDealId } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !brandDealId) {
      return new Response(JSON.stringify({ error: 'Missing brandDealId or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('JWT verification failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const creatorId = user.id;

    // Fetch brand deal details
    const { data: brandDeal, error: dealError } = await supabaseAdmin
      .from('brand_deals')
      .select('*')
      .eq('id', brandDealId)
      .eq('creator_id', creatorId) // Ensure creator owns the deal
      .single();

    if (dealError || !brandDeal) {
      console.error('Error fetching brand deal:', dealError?.message || 'Deal not found');
      return new Response(JSON.stringify({ error: 'Brand deal not found or unauthorized.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('CRITICAL: RESEND_API_KEY is missing.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Email API key missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const senderEmail = 'noreply@noticebazaar.com'; // Use a generic noreply email
    const recipientEmail = brandDeal.brand_email || 'support@noticebazaar.com'; // Fallback to support email

    const subject = `Reminder: Payment Due for Brand Deal with ${brandDeal.brand_name}`;
    const htmlContent = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <p>Dear ${brandDeal.contact_person || brandDeal.brand_name} Team,</p>
        <p>This is a friendly reminder regarding the payment for our recent collaboration:</p>
        <ul>
          <li><strong>Brand:</strong> ${brandDeal.brand_name}</li>
          <li><strong>Deal Amount:</strong> ₹${brandDeal.deal_amount.toLocaleString('en-IN')}</li>
          <li><strong>Deliverables:</strong> ${brandDeal.deliverables}</li>
          <li><strong>Payment Expected Date:</strong> ${new Date(brandDeal.payment_expected_date).toLocaleDateString()}</li>
        </ul>
        <p>The payment for this deal is currently due. We would appreciate it if you could process this at your earliest convenience.</p>
        <p>Please let us know if you have any questions or require further information.</p>
        <p>Thank you,</p>
        <p><strong>${user.user_metadata.first_name || 'Creator'} ${user.user_metadata.last_name || ''}</strong></p>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">
          This reminder was sent via NoticeBazaar.
        </p>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `NoticeBazaar <${senderEmail}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      }),
    });

    const resendBody = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API Error:', resendResponse.status, resendBody);
      throw new Error(`Failed to send email: ${resendBody.message || 'Unknown error'}`);
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      client_id: creatorId,
      description: `Sent payment reminder for brand deal "${brandDeal.brand_name}" (Amount: ₹${brandDeal.deal_amount.toLocaleString('en-IN')})`,
    });

    return new Response(JSON.stringify({ message: 'Payment reminder sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Send Payment Reminder Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});