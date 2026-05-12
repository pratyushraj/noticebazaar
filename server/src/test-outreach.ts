import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestOutreach() {
    console.log('🧪 Sending NEW Spam-Proof test D2C outreach email to creatorarmour07@gmail.com...');
    
    const brandName = 'Skincare Co.';
    const niche = 'Skincare';
    const firstName = 'Team';
    const targetEmail = 'creatorarmour07@gmail.com';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.6;">
        <p>Hi ${firstName},</p>
        
        <p>Came across <strong>${brandName}</strong> and really liked your brand positioning 👀</p>
        
        <p>I'm Pratyush from <strong>Creator Armour</strong>. We've built a curated network of creators specifically for D2C brands to help with:</p>
        
        <ul style="padding-left: 20px; color: #4b5563;">
          <li>High-quality UGC & Reels</li>
          <li>Barter collaborations (product for content)</li>
          <li>Aesthetic ad creatives</li>
        </ul>
        
        <p>Most of our creators are affordable, highly engaged, and comfortable creating authentic content for <strong>${niche}</strong> brands.</p>
        
        <p>Would love to share a few creator profiles that could fit your brand. Do you have a moment to chat or should I send over some profiles here?</p>
        
        <p>Best,<br>
        <strong>Pratyush Raj</strong><br>
        Founder, Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #10b981; text-decoration: none;">creatorarmour.com</a></p>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          If you're not the right person for this, please let me know and I'll stop reaching out.
        </p>
      </div>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
            to: targetEmail,
            reply_to: 'creatorarmour07@gmail.com',
            subject: `Content & UGC for ${brandName}`,
            html: emailHtml,
        });

        if (error) {
            console.error('❌ Error sending email:', error);
            return;
        }

        console.log('✅ New test email sent successfully!', data);
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

sendTestOutreach();
