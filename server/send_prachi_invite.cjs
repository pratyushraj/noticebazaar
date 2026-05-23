const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendInvite() {
  const email = 'prachisculinarycanvas@gmail.com';
  const username = 'prachisculinarycanvas';
  const firstName = 'Prachi';

  console.log(`Generating invite for ${email}...`);

  // 1. Generate recovery link
  const { data, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email,
    options: { redirectTo: `https://creatorarmour.com/dashboard` }
  });

  if (linkError) {
    console.error('Error generating link:', linkError);
    return;
  }

  const inviteLink = data.properties.action_link;

  // 2. Prepare Email
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #000; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; letter-spacing: -1px;">CreatorArmour</h1>
        </div>
        <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
          <h2 style="color: #111; margin-top: 0;">Welcome, ${firstName}! ✨</h2>
          <p>Your profile is now live on CreatorArmour. We've optimized your dashboard with your ₹5,000 starting rate and healthy lifestyle niche.</p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Public Profile:</p>
            <a href="https://creatorarmour.com/${username}" style="color: #e11d48; font-weight: bold; text-decoration: none;">creatorarmour.com/${username}</a>
          </div>

          <p>Set up your password below to start managing brand collaborations:</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${inviteLink}" style="background: #e11d48; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Set Password & Login</a>
          </div>

          <p style="font-size: 13px; color: #666;">This link is secure and valid for 24 hours.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">Welcome to the future of creator partnerships.</p>
        </div>
      </body>
    </html>
  `;

  // 3. Send
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CreatorArmour <onboarding@creatorarmour.com>',
      to: email,
      subject: '✨ Welcome to CreatorArmour, Prachi!',
      html: emailHtml,
    }),
  });

  const resData = await response.json();
  if (response.ok) {
    console.log('✅ Invitation email sent successfully!');
  } else {
    console.error('❌ Failed to send email:', resData);
  }
}

sendInvite();
