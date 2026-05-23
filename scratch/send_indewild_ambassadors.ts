import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';
const resend = new Resend(RESEND_API_KEY);

async function run() {
  console.log('🚀 Sending referral follow-up email to ambassadors@indewild.com...');

  const subject = 'creator ops at Inde Wild // referral from support';
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 12px 0;">
      <p>Hi Team,</p>
      
      <p>Hope you're having a great weekend!</p>
      
      <p>Your support team (India Care) kindly referred me to reach out directly to your ambassadors team regarding creator collaborations and campaign operations at <strong>Inde Wild</strong> 👏</p>
      
      <p>We’re building Creator Armour — a creator collaboration operating system for growing D2C brands.</p>
      
      <p>Most brands already know influencer marketing works. The painful part is:<br>
      • creator sourcing & verification<br>
      • tracking replies<br>
      • managing briefs & guidelines<br>
      • chasing deliverables<br>
      • coordinating payouts & barters<br>
      • handling WhatsApp + Instagram operational chaos</p>
      
      <p>That’s the exact operational layer we simplify.</p>
      
      <p>Would love to show you how fast-growing beauty and lifestyle brands are using Creator Armour to run campaigns with far less overhead.</p>
      
      <p>Open to a quick 10-minute intro sometime next week?</p>
      
      <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
        — Pratyush Raj<br>
        Founder, Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #0f172a; text-decoration: underline; font-weight: 600;">creatorarmour.com</a>
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
      to: 'ambassadors@indewild.com',
      reply_to: 'creatorarmour07@gmail.com',
      subject: subject,
      html: htmlBody
    });

    if (error) throw error;
    console.log(`✅ Success! Resend Email ID: ${data?.id}`);
    console.log(`📄 Sent to: ambassadors@indewild.com`);
  } catch (err: any) {
    console.error(`❌ Failed to send email:`, err.message);
  }
}

run();
