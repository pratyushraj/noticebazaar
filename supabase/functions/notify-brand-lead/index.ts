import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { brand_name, contact, category, budget, creator_count, message } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server config error: missing email API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        
        <div style="background: linear-gradient(135deg, #15803d, #16a34a); padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
            🎯 New Brand Lead
          </h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">
            Submitted via Creator Armour landing page · ${submittedAt} IST
          </p>
        </div>

        <div style="padding: 28px 32px; background: #fff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr>
              <td style="padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 700; width: 38%; border-radius: 6px 0 0 0;">Brand / Company</td>
              <td style="padding: 10px 14px; border: 1px solid #e5e7eb; font-weight: 600; color: #0f172a;">${brand_name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 700;">Contact</td>
              <td style="padding: 10px 14px; border: 1px solid #e5e7eb; font-weight: 600; color: #16a34a;">${contact}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 700;">Category</td>
              <td style="padding: 10px 14px; border: 1px solid #e5e7eb;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 700;">Budget</td>
              <td style="padding: 10px 14px; border: 1px solid #e5e7eb; font-weight: 700; color: #0f172a;">${budget}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 700;">Creators needed</td>
              <td style="padding: 10px 14px; border: 1px solid #e5e7eb;">${creator_count || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 700; border-radius: 0 0 0 6px;">Campaign Brief</td>
              <td style="padding: 10px 14px; border: 1px solid #e5e7eb; color: #475569;">${message || '—'}</td>
            </tr>
          </table>

          <div style="margin-top: 24px; padding: 16px 20px; background: #ecfdf5; border-radius: 10px; border: 1px solid #d1fae5;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #15803d;">⏰ Action Required</p>
            <p style="margin: 6px 0 0; font-size: 14px; color: #166534;">
              Respond within <strong>48 hours</strong> with a curated creator shortlist. Reach out via the contact above.
            </p>
          </div>
        </div>

        <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e5e7eb; font-size: 13px; color: #94a3b8; text-align: center;">
          Creator Armour · <a href="https://creatorarmour.com" style="color: #16a34a;">creatorarmour.com</a>
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Creator Armour Leads <onboarding@creatorarmour.com>',
        to: 'creatorarmour07@gmail.com',
        subject: `🎯 New Brand Lead: ${brand_name} (${category} · ${budget})`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Resend error: ${err.message || res.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('notify-brand-lead error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
