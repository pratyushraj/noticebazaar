// Demo email sender script
// Usage: node send-demo-email.js

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Try to get API key from environment variable or .env file
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY_FROM_ENV;

if (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key_here' || RESEND_API_KEY.trim() === '') {
  console.error('❌ RESEND_API_KEY is not configured in server/.env');
  process.exit(1);
}

const demoEmail = {
  from: 'CreatorArmour <noreply@creatorarmour.com>',
  to: 'funnyraj10@gmail.com',
  subject: '🎉 Welcome to CreatorArmour - Demo Email',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CreatorArmour</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">🎉 Demo Email from CreatorArmour</h2>
          <p style="color: #4b5563; font-size: 16px;">
            Hello!
          </p>
          <p style="color: #4b5563; font-size: 16px;">
            This is a demo email sent from CreatorArmour to test our email service integration with Resend.
          </p>
          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #667eea; margin-top: 0;">✨ What's Working:</h3>
            <ul style="color: #4b5563; font-size: 14px;">
              <li>✅ Domain verified: creatorarmour.com</li>
              <li>✅ Email sending via Resend API</li>
              <li>✅ Professional email templates</li>
              <li>✅ Branded sender address</li>
            </ul>
          </div>
          <p style="color: #4b5563; font-size: 16px;">
            If you received this email, it means our email service is working perfectly! 🚀
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is a demo email from CreatorArmour. Sent via Resend API.
            </p>
          </div>
        </div>
      </body>
    </html>
  `,
};

async function sendDemoEmail() {
  try {
    console.log('📧 Sending demo email to funnyraj10@gmail.com...');
    console.log('📤 From: CreatorArmour <noreply@creatorarmour.com>');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(demoEmail),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to send email:');
      console.error('Status:', response.status);
      console.error('Error:', data);
      process.exit(1);
    }

    if (data.id) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Email ID:', data.id);
      console.log('📬 Check funnyraj10@gmail.com inbox (and spam folder)');
    } else {
      console.error('❌ Unexpected response:', data);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    process.exit(1);
  }
}

sendDemoEmail();

