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
  const recipientName = args[1] || 'Naturally Yours Team';

  console.log(`🚀 Sending Naturally Yours Pitch outreach email using Resend...`);
  console.log(`➡️ Target Recipient: ${recipientName} (${targetEmail})`);

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>Hi ${recipientName},</p>
      
      <p>Thanks for connecting 😊</p>
      
      <p>To better showcase what Creator Armour is building, we created a custom creator collaboration page tailored specifically for Naturally Yours:</p>
      
      <p style="margin: 24px 0;">
        <a href="https://www.creatorarmour.com/naturallyyours" style="display: inline-block; background-color: #047857; color: white; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
          👉 View Naturally Yours Shortlist
        </a>
      </p>
      
      <p>We’ve shortlisted creators aligned with the wellness, Ayurveda, self-care, and natural lifestyle space — including profiles suitable for:</p>
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        <li style="margin-bottom: 8px;">UGC-style product storytelling</li>
        <li style="margin-bottom: 8px;">morning/evening wellness routines</li>
        <li style="margin-bottom: 8px;">ingredient-focused reels</li>
        <li style="margin-bottom: 8px;">organic skincare & lifestyle content</li>
        <li style="margin-bottom: 8px;">barter and performance-based collaborations</li>
      </ul>
      
      <p>The goal behind Creator Armour is to help D2C brands simplify creator operations without managing scattered DMs, spreadsheets, and constant manual follow-ups.</p>
      
      <p>Beyond creator discovery, we’re also building lightweight infrastructure around:</p>
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        <li style="margin-bottom: 8px;">creator onboarding</li>
        <li style="margin-bottom: 8px;">campaign coordination</li>
        <li style="margin-bottom: 8px;">shipment tracking support</li>
        <li style="margin-bottom: 8px;">centralized collaboration management</li>
        <li style="margin-bottom: 8px;">content follow-ups and approvals</li>
      </ul>
      
      <p>Would love to explore running a small pilot collaboration with a few curated creators for Naturally Yours and understand your current creator marketing goals.</p>
      
      <p>Happy to connect anytime next week 😊</p>
      
      <p style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #1f2937;">
        Regards,<br>
        <strong>Pratyush Raj</strong><br>
        Founder — Creator Armour<br>
        <a href="https://www.creatorarmour.com" style="color: #047857; text-decoration: none;">creatorarmour.com</a>
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
      to: targetEmail,
      reply_to: 'creatorarmour07@gmail.com',
      subject: 'Custom Creator Portal + Campaign Infrastructure for Naturally Yours 🍜🌾',
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
