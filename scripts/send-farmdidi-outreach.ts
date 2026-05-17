import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from server directory
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ Error: Missing RESEND_API_KEY in server/.env');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function sendOutreach() {
  // Grab recipient email from CLI argument, default to test email
  const args = process.argv.slice(2);
  const targetEmail = args[0] || 'creatorarmour07@gmail.com';
  const recipientName = args[1] || 'FarmDidi Team';

  console.log(`🚀 Sending FarmDidi Pitch outreach email using Resend...`);
  console.log(`➡️ Target Recipient: ${recipientName} (${targetEmail})`);

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>Hi ${recipientName},</p>
      
      <p>Thanks for connecting 😊</p>
      
      <p>To better showcase what Creator Armour can do, we created a custom creator collaboration portal specifically for FarmDidi:</p>
      
      <p style="margin: 24px 0;">
        <a href="https://www.creatorarmour.com/farmdidi" style="display: inline-block; background-color: #f59e0b; color: white; font-weight: bold; text-decoration: none; padding: 12px 24px; rounded: 8px; border-radius: 8px;">
          👉 View FarmDidi Shortlist
        </a>
      </p>
      
      <p>We’ve shortlisted curated cooking, traditional recipe, and clean-eating creators who align well with FarmDidi’s handmade pickles, chutneys, and spice-focused content style. The page includes creator previews, sample content references, and collaboration flow examples tailored for your brand.</p>
      
      <p>Beyond creator discovery, Creator Armour is focused on simplifying the operational side of influencer campaigns, including:</p>
      
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        <li style="margin-bottom: 8px;">Creator sourcing & coordination</li>
        <li style="margin-bottom: 8px;">Barter/paid collaboration workflows</li>
        <li style="margin-bottom: 8px;">Shipment tracking support</li>
        <li style="margin-bottom: 8px;">Content follow-ups & approvals</li>
        <li style="margin-bottom: 8px;">Centralized campaign management</li>
      </ul>
      
      <p>The goal is to reduce the manual coordination that usually happens across DMs, spreadsheets, and scattered communication.</p>
      
      <p>Would love to explore running a small pilot collaboration with a few shortlisted creators and understand how FarmDidi currently approaches creator marketing.</p>
      
      <p>Happy to connect for a quick discussion anytime next week 😊</p>
      
      <p style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #1f2937;">
        Regards,<br>
        <strong>Pratyush Raj</strong><br>
        Founder — Creator Armour<br>
        <a href="https://www.creatorarmour.com" style="color: #f59e0b; text-decoration: none;">creatorarmour.com</a>
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
      to: targetEmail,
      reply_to: 'creatorarmour07@gmail.com',
      subject: 'Custom Creator Portal + Campaign Infrastructure for FarmDidi 👵🌾',
      html: emailHtml,
    });

    if (error) throw error;

    console.log(`\n✨ Email Sent Successfully! Message ID: ${data?.id}`);
    console.log(`📧 Check your inbox/outbox for preview and delivery confirmations.`);
  } catch (err: any) {
    console.error(`❌ Failed to send email outreach:`, err.message);
  }
}

sendOutreach();
