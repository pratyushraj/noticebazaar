import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
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
    const { contentUrl, platform, infringingUrl, infringingUser } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !contentUrl || !platform || !infringingUrl) {
      return new Response(JSON.stringify({ error: 'Missing contentUrl, platform, infringingUrl, or authorization header' }), {
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

    // Fetch creator profile details for the email signature
    const { data: creatorProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', creatorId)
      .single();

    const creatorFirstName = creatorProfile?.first_name || 'Creator';
    const creatorLastName = creatorProfile?.last_name || '';


    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('CRITICAL: RESEND_API_KEY is missing.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Email API key missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const senderEmail = 'noreply@noticebazaar.com';
    const recipientEmail = 'support@noticebazaar.com'; // In a real scenario, this would be the platform's legal/copyright email

    const subject = `DMCA Takedown Notice: Infringement of Copyrighted Content on ${platform}`;
    const htmlContent = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <p>Dear ${platform} Legal/Copyright Team,</p>
        <p>This letter serves as a formal notification of copyright infringement pursuant to the Digital Millennium Copyright Act (DMCA).</p>
        <p>I am the copyright owner of the original content located at:</p>
        <p><strong>Original Content URL:</strong> <a href="${contentUrl}">${contentUrl}</a></p>
        <p>The infringing material is located at:</p>
        <p><strong>Infringing Content URL:</strong> <a href="${infringingUrl}">${infringingUrl}</a></p>
        <p><strong>Infringing User/Channel:</strong> ${infringingUser || 'N/A'}</p>
        <p>I have a good faith belief that the use of the copyrighted materials described above as infringing is not authorized by the copyright owner, its agent, or the law.</p>
        <p>I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</p>
        <p>I hereby demand that you immediately remove or disable access to the infringing material.</p>
        <p>Sincerely,</p>
        <p><strong>${creatorFirstName} ${creatorLastName}</strong></p>
        <p>Email: ${user.email}</p>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">
          This notice was generated and sent via NoticeBazaar.
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
      description: `Sent takedown notice for content on ${platform} at ${infringingUrl}`,
    });

    return new Response(JSON.stringify({ message: 'Takedown notice sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Send Takedown Notice Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});