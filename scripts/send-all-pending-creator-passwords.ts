import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getEmailLayout(content: string, creatorName: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Creator Armour</title>
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td style="background-color: #10b981; padding: 50px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">Welcome to Creator Armour</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; color: #ffffff !important; opacity: 0.9;">Secure your professional profile</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #1f2937; font-weight: 600;">Hi ${creatorName},</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Your professional creator profile is now live on Creator Armour. To access your dashboard, track collaborations, and manage secure payments, please set your account password using the button below.
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="background-color: #10b981; border-radius: 8px;">
                    ${content}
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 30px; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #1e293b; font-weight: 700;">Why secure your account?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                  <li style="margin-bottom: 5px;"><strong>Track Deals</strong>: View and manage all your brand collaborations.</li>
                  <li style="margin-bottom: 5px;"><strong>Secure Payouts</strong>: Register your UPI for faster, secure payments.</li>
                  <li><strong>Legal Safety</strong>: Every collab is backed by legally binding contracts.</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 0 0; font-size: 13px; color: #94a3b8; font-style: italic; text-align: center;">
                This secure link is unique to you and will expire soon.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">Protected by Creator Armour</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">Building authentic brand-creator partnerships with trust and transparency.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function main() {
  console.log('🚀 Bulk triggering password set emails for all pending creators...');

  try {
    // 1. Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, role')
      .eq('role', 'creator');

    if (profilesError) throw profilesError;

    // 2. Fetch all users paginated
    let allUsers: any[] = [];
    let page = 1;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 100
      });

      if (error) throw error;

      if (data.users && data.users.length > 0) {
        allUsers = allUsers.concat(data.users);
        page++;
      } else {
        keepFetching = false;
      }

      if (data.users && data.users.length < 100) {
        keepFetching = false;
      }
    }

    const userMap = allUsers.reduce((acc: any, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const pendingCreators = [];

    for (const p of profiles) {
      const authUser = userMap[p.id];
      if (!authUser) continue;

      const email = authUser.email;
      const isTest = email.includes('example.com') || email.includes('noticebazaar.com') || email.includes('admin@creatorarmour.com') || email.includes('test.elite@creatorarmour.com');
      const isAdmin = p.username.toLowerCase().includes('admin');

      if (isTest || isAdmin) continue;

      // Has never logged in
      const hasSignedIn = authUser.last_sign_in_at !== null && authUser.last_sign_in_at !== undefined;

      if (!hasSignedIn) {
        pendingCreators.push({
          id: p.id,
          username: p.username,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username,
          email: email
        });
      }
    }

    console.log(`\nFound ${pendingCreators.length} creators who have never logged in.`);
    console.log('='.repeat(90));

    for (let i = 0; i < pendingCreators.length; i++) {
      const c = pendingCreators[i];
      console.log(`[${i + 1}/${pendingCreators.length}] ✉️ Processing @${c.username} (${c.email})...`);

      try {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: c.email,
          options: {
            redirectTo: 'https://creatorarmour.com/reset-password'
          }
        });

        if (linkError) {
          console.error(`  ❌ Failed to generate link for ${c.email}: ${linkError.message}`);
          continue;
        }

        const actionUrl = linkData.properties.action_link;
        const ctaButton = `<a href="${actionUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">Set My Password</a>`;
        const htmlBody = getEmailLayout(ctaButton, c.name);

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Creator Armour <onboarding@creatorarmour.com>',
            to: c.email,
            subject: '🛡️ Welcome to Creator Armour — Secure Your Account',
            html: htmlBody
          })
        });

        if (response.ok) {
          console.log(`  ✅ Onboarding email sent!`);
        } else {
          const errData = await response.json();
          console.error(`  ❌ Failed to send via Resend: ${JSON.stringify(errData)}`);
        }
      } catch (err: any) {
        console.error(`  ❌ Network error: ${err.message}`);
      }
    }

    console.log('='.repeat(90));
    console.log(`\n✨ Successfully processed and emailed all ${pendingCreators.length} pending creators!`);

  } catch (error: any) {
    console.error('❌ Bulk mailing failed:', error.message);
  }
}

main();
