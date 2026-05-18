import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Use verified active Resend API key
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

function getGynovedaBusinessEmailTemplate(): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
      <div style="margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
        <span style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.025em;">CREATOR<span style="color: #10b981;">ARMOUR</span></span>
        <span style="float: right; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.05em;">Campaign Infrastructure</span>
      </div>

      <p>Hi Gynoveda Business Team,</p>
      
      <p>Hope you are having a productive week!</p>
      
      <p>Saba Shaikh from Gynoveda kindly suggested we share our custom creator partnerships proposal with your business team directly at this email address.</p>
      
      <p>We absolutely love Gynoveda's focus on authentic, modern Ayurvedic nutrition and wellness formulations for women. Influencer marketing is exceptionally lucrative for wellness, but the operations are highly manual and exhausting—manually tracking lost product samples, chasing creators for schedule updates, and checking if they followed compliance guidelines.</p>
      
      <p><strong>Creator Armour is a SaaS operating system that manages the entire campaign lifecycle for you.</strong> We handle all operational logistics so your team can scale campaigns hands-off.</p>
      
      <p>For Gynoveda, we have pre-curated top-tier women's wellness, Ayurveda, and lifestyle creators (like Monika and Rohit) who are pre-vetted and perfect for creative, educational integration reels with verified audience demographic data.</p>
      
      <div style="margin: 28px 0; text-align: center;">
        <a href="https://creatorarmour.com" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2); transition: all 0.3s ease;">
          👉 Explore Creator Armour OS
        </a>
      </div>
      
      <p><strong>How we eliminate your operational burden ("Brands chill. We handle operations"):</strong></p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 40px; font-size: 20px;">📦</td>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            <strong style="color: #0f172a;">Sample Box Logistics:</strong> Automated shipping label generation and real-time tracking updates for sample deliveries.
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 40px; font-size: 20px;">💬</td>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            <strong style="color: #0f172a;">WhatsApp Campaign Engine:</strong> Briefs, schedule reminders, and draft approvals are sent automatically via WhatsApp (zero manual DM follow-ups).
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 40px; font-size: 20px;">🔒</td>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            <strong style="color: #0f172a;">Escrow-Protected Payouts:</strong> Payout is locked in escrow and only released after the reel goes live, containing the exact hashtags and tag requirements.
          </td>
        </tr>
      </table>
      
      <p><strong>Launch Offer:</strong> We will curate a custom list of <strong>10 pre-vetted, high-conversion creators</strong> for Gynoveda within 24 hours. If you like the matches, we can kick off a small test campaign. If not, it costs you absolutely nothing.</p>
      
      <p>Would love to jump on a quick 10-minute demo call this week to showcase how we can streamline campaigns for Gynoveda! 😊</p>
      
      <p style="margin-top: 32px; border-top: 2px solid #f1f5f9; padding-top: 20px; font-size: 14px; color: #64748b;">
        Best regards,<br>
        <strong style="color: #0f172a; font-size: 15px;">Pratyush Raj</strong><br>
        Founder & CEO — Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #10b981; font-weight: 700; text-decoration: none;">creatorarmour.com</a>
      </p>
    </div>
  `;
}

async function main() {
  const brandName = 'Gynoveda';
  const newEmail = 'business@gynoveda.com';

  console.log(`🐾 Handling Gynoveda's inbound reply...`);

  try {
    // 1. Check current lead status
    const { data: lead, error: getError } = await supabase
      .from('brand_leads')
      .select('*')
      .eq('brand_name', brandName)
      .single();

    if (getError) throw getError;
    console.log(`- Found current lead: ${lead.brand_name} with email ${lead.email}`);

    // 2. Update status and email to business@gynoveda.com
    const updatedLeadPayload = {
      email: newEmail,
      status: 'replied',
      outreach_count: (lead.outreach_count || 0) + 1,
      last_contacted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'Received reply from Saba Shaikh. Redirected and pitched directly to business@gynoveda.com.'
    };

    console.log(`- Updating database row...`);
    const { error: updateError } = await supabase
      .from('brand_leads')
      .update(updatedLeadPayload)
      .eq('id', lead.id);

    if (updateError) throw updateError;
    console.log(`✅ Supabase brand lead updated successfully!`);

    // 3. Dispatch pitch email to business@gynoveda.com via Resend
    const subject = `Fwd: Zero-Ops Creator Campaigns & Custom Portal for Gynoveda 🚀📦`;
    const htmlBody = getGynovedaBusinessEmailTemplate();

    console.log(`- Sending personalized pitch email to business@gynoveda.com...`);
    const { data: resData, error: sendError } = await resend.emails.send({
      from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
      to: newEmail,
      reply_to: 'creatorarmour07@gmail.com',
      subject: subject,
      html: htmlBody
    });

    if (sendError) throw sendError;
    console.log(`✅ Success! Pitch email delivered directly to Gynoveda partnerships team. Resend ID: ${resData?.id}`);

    // Print out the verification result
    const { data: verifiedLead } = await supabase
      .from('brand_leads')
      .select('*')
      .eq('brand_name', brandName)
      .single();

    console.log('\n🐾 Verification audit:');
    console.log(`- Brand: ${verifiedLead.brand_name}`);
    console.log(`- New Email: ${verifiedLead.email}`);
    console.log(`- Status: ${verifiedLead.status}`);
    console.log(`- Outreach Count: ${verifiedLead.outreach_count}`);
    console.log(`- Notes: ${verifiedLead.notes}`);
    console.log('\n✨ Gynoveda Conversion Followup Sync Completed successfully!');

  } catch (err: any) {
    console.error('❌ Failed Gynoveda followup process:', err.message);
  }
}

main();
