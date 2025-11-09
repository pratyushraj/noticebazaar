import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to calculate overdue days
const calculateOverdueDays = (expectedDate: string): number => {
    const today = new Date();
    const expected = new Date(expectedDate);
    
    // Normalize to start of day for accurate day count
    today.setHours(0, 0, 0, 0);
    expected.setHours(0, 0, 0, 0);

    if (expected >= today) {
        return 0;
    }

    const diffTime = Math.abs(today.getTime() - expected.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { brandDealId, messageType = 'email', customMessage } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !brandDealId) {
      return new Response(JSON.stringify({ error: 'Missing brandDealId or authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 1. Initialize Supabase Admin Client (Service Role)
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

    // 2. Get User ID from JWT
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('JWT verification failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const creatorId = user.id;

    // 3. Fetch brand deal details
    const { data: brandDeal, error: dealError } = await supabaseAdmin
      .from('brand_deals')
      .select('brand_name, brand_email, deal_amount, payment_expected_date, invoice_file_url, creator_id')
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
    
    // 4. Fetch creator profile details for the email signature
    const { data: creatorProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', creatorId)
      .single();

    const creatorName = `${creatorProfile?.first_name || 'Creator'} ${creatorProfile?.last_name || ''}`;
    const recipientEmail = brandDeal.brand_email || 'support@noticebazaar.com'; // Fallback to support email
    const overdueDays = calculateOverdueDays(brandDeal.payment_expected_date);
    const formattedAmount = `₹${brandDeal.deal_amount.toLocaleString('en-IN')}`;
    const expectedDate = new Date(brandDeal.payment_expected_date).toLocaleDateString();
    const invoiceLink = brandDeal.invoice_file_url || 'N/A';

    let reminderStatus: 'sent' | 'failed' = 'sent';
    let errorMessage: string | undefined;

    // 5. Send reminder based on messageType (only email implemented for now)
    if (messageType === 'email') {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) {
            console.error('CRITICAL: RESEND_API_KEY is missing.');
            // Do not throw, but mark as failed and log the error
            reminderStatus = 'failed';
            errorMessage = 'Server configuration error: Email API key missing.';
        } else {
            const subject = customMessage 
                ? `Payment Reminder - ${brandDeal.brand_name}`
                : `Payment Reminder - ${brandDeal.brand_name} - ${formattedAmount}`;
                
            const defaultHtmlContent = `
                <div style="font-family: sans-serif; line-height: 1.6;">
                    <p>Hi ${brandDeal.brand_name} Team,</p>
                    <p>This is a reminder for the pending payment of <strong>${formattedAmount}</strong> for our collaboration.</p>
                    <p>Deliverables have already been completed and submitted.</p>
                    <ul>
                        <li><strong>Payment Expected Date:</strong> ${expectedDate}</li>
                        <li><strong>Days Overdue:</strong> ${overdueDays}</li>
                        <li><strong>Invoice Link:</strong> <a href="${invoiceLink}">${invoiceLink}</a></li>
                    </ul>
                    <p>Kindly release the payment at the earliest.</p>
                    <p>Regards,</p>
                    <p><strong>${creatorName}</strong></p>
                </div>
            `;

            const htmlContent = customMessage 
                ? `<div style="font-family: sans-serif; line-height: 1.6;"><p>${customMessage}</p><p>Regards,<br><strong>${creatorName}</strong></p></div>`
                : defaultHtmlContent;

            try {
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: `NoticeBazaar <noreply@noticebazaar.com>`,
                        to: recipientEmail,
                        subject: subject,
                        html: htmlContent,
                    }),
                });

                if (!resendResponse.ok) {
                    const resendBody = await resendResponse.json();
                    console.error('Resend API Error:', resendResponse.status, resendBody);
                    reminderStatus = 'failed';
                    errorMessage = resendBody.message || 'Unknown Resend error';
                }
            } catch (e) {
                reminderStatus = 'failed';
                errorMessage = e.message;
            }
        }
    } else if (messageType === 'whatsapp') {
        reminderStatus = 'failed';
        errorMessage = 'WhatsApp integration is currently disabled.';
    }

    // 6. Log the reminder in payment_reminders table.
    const { error: logError } = await supabaseAdmin
        .from('payment_reminders')
        .insert({
            deal_id: brandDealId,
            creator_id: creatorId,
            recipient_email: recipientEmail,
            status: reminderStatus,
            delivery_method: messageType,
            error_message: errorMessage,
        });

    if (logError) {
        console.error('Error logging payment reminder:', logError.message);
        // Do not throw, as the email might have succeeded.
    }

    if (reminderStatus === 'failed') {
        // Return a 500 status if the reminder failed to send
        return new Response(JSON.stringify({ error: `Reminder failed to send: ${errorMessage}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    // 7. Log activity 
    await supabaseAdmin.from('activity_log').insert({
        client_id: creatorId,
        description: `Sent ${messageType} payment reminder for brand deal "${brandDeal.brand_name}"`,
    });

    return new Response(JSON.stringify({ message: 'Payment reminder sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Send Payment Reminder Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});