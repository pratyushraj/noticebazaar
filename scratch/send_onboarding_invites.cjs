
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Config
const SUPABASE_URL = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';
const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';
const FRONTEND_URL = 'https://www.creatorarmour.com'; // Production URL for redirect

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SHOULD_SEND = process.env.SEND_EMAILS === 'true';

async function sendInvites() {
  console.log('--- 🛡️ Creator Armour Onboarding Dispatcher ---');
  console.log(`Mode: ${SHOULD_SEND ? '🚀 LIVE SEND' : '🔍 DRY RUN (Use SEND_EMAILS=true to send)')}`);
  
  // 1. Fetch users and profiles
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, username, first_name, last_name, role');

  if (usersError || profilesError) {
    console.error('Data fetch error:', usersError || profilesError);
    return;
  }

  const profileMap = (profiles || []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  for (const user of users) {
    const profile = profileMap[user.id];
    
    // Only target creators
    if (!profile || profile.role !== 'creator') continue;

    // Generate link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: { redirectTo: `${FRONTEND_URL}/reset-password` }
    });

    if (linkError) {
      console.error(`Link error for ${user.email}:`, linkError.message);
      continue;
    }

    const inviteLink = linkData.properties.action_link;
    const creatorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Creator';
    const username = profile.username || 'username';

    console.log(`[Target] ${creatorName} (${user.email}) -> Link Ready`);

    if (SHOULD_SEND) {
      try {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <div style="background-color: #5b21b6; padding: 40px 20px; text-align: center; border-radius: 8px;">
              <h1 style="color: white; margin: 0;">Your Profile is Ready</h1>
              <p style="color: rgba(255,255,255,0.8);">Access your secure collaboration dashboard</p>
            </div>
            <div style="padding: 30px 0;">
              <p>Hello ${creatorName},</p>
              <p>Your Creator Armour profile and collaboration link are now live. To start receiving protected brand offers, please set your account password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Set Your Password</a>
              </div>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Set your password using the button above.</li>
                <li><strong>Install the Web App</strong> (instructions will be shown after you set your password) for instant deal alerts.</li>
                <li>Share your link: <strong>creatorarmour.com/${username}</strong></li>
              </ul>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666; text-align: center;">
              &copy; 2026 Creator Armour. All rights reserved.
            </div>
          </div>
        `;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Creator Armour <noreply@creatorarmour.com>',
            to: user.email,
            subject: 'Your Creator Armour Profile is Ready 🛡️',
            html: emailHtml
          })
        });

        if (res.ok) console.log(`   ✅ Email sent to ${user.email}`);
        else console.error(`   ❌ Failed to send to ${user.email}:`, await res.text());
      } catch (e) {
        console.error(`   ❌ Exception for ${user.email}:`, e.message);
      }
    } else {
      console.log(`   🔗 Invite Link: ${inviteLink}`);
    }
  }
}

sendInvites();
