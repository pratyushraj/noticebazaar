import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function getEmailLayout(content: string, creatorName: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Creator Armour</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);">
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
                Your professional creator profile is now live on Creator Armour. To access your dashboard, track collaborations, register your UPI, and manage secure payments, please set your account password using the button below.
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
  const email = 'anacollab19@gmail.com';
  const username = 'anaa_mika_20';
  const fullName = 'Anamika';
  const password = 'CreatorArmourAnamika2026!'; // Temporary password
  const optimizedVideoPath = path.join(process.cwd(), 'scratch', 'anamika_optimized.mp4');

  console.log(`🚀 Starting Onboarding & Asset synchronization pipeline for Anamika (@${username})...`);

  try {
    // 1. Verify files exist
    if (!fs.existsSync(optimizedVideoPath)) {
      throw new Error(`Optimized Reel not found at ${optimizedVideoPath}. Run optimization first.`);
    }

    // Phase 1: Create Auth User
    console.log(`[1/8] Creating/resolving auth user for ${email}...`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Anamika',
        last_name: '',
      }
    });

    if (userError) {
      if (userError.message.toLowerCase().includes('already')) {
        console.log('⚠️ User already exists, proceeding to resolve existing user ID...');
      } else {
        throw userError;
      }
    }

    const userId = userData.user?.id;
    let actualUserId = '';
    if (!userId) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!existingUser) throw new Error('Could not find or create user');
      actualUserId = existingUser.id;
    } else {
      actualUserId = userId;
    }

    console.log(`✅ User ID resolved: ${actualUserId}`);

    // Phase 2: High-resolution Avatar via unavatar proxy or fallback
    console.log('[2/8] Setting avatar from Instagram proxy...');
    let avatarPublicUrl = `https://unavatar.io/instagram/${username}`;
    let avatarBuffer: Buffer | null = null;
    
    try {
      const fetchRes = await fetch(avatarPublicUrl);
      if (fetchRes.ok) {
        avatarBuffer = await fetchRes.buffer();
        console.log('✅ Successfully downloaded avatar via unavatar proxy!');
      }
    } catch (fetchErr: any) {
      console.error('❌ Fetch failed:', fetchErr.message);
    }

    if (avatarBuffer) {
      const avatarStoragePath = `${username}/avatar_perfect_final_${Date.now()}.png`;
      const { error: avatarUploadError } = await supabase.storage
        .from('creator-assets')
        .upload(avatarStoragePath, avatarBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      if (!avatarUploadError) {
        avatarPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/creator-assets/${avatarStoragePath}`;
        console.log(`✅ Avatar CDN URL generated: ${avatarPublicUrl}`);
      }
    } else {
      console.warn('⚠️ Avatar fetch failed. Setting standard default avatar fallback.');
      avatarPublicUrl = `https://sqqocqujxlgoxbcnfbfb.supabase.co/storage/v1/object/public/creator-assets/default_avatar.png`;
    }

    // Phase 3: Register Profile Details
    console.log('[3/8] Registering creator profile parameters with official Meta Marketplace metrics...');
    
    const profileUpdate = {
      id: actualUserId,
      first_name: 'Anamika',
      last_name: '',
      avatar_url: avatarPublicUrl,
      instagram_profile_photo: avatarPublicUrl,
      username: username,
      instagram_handle: username,
      business_name: 'Anamika | Beauty, Fashion & UGC Creator 💄✨',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Fashion & Lifestyle',
      instagram_followers: 34000,
      followers_count: 34000,
      engagement_rate: 8.6, // Incredibly active engagement from 7.2M reach & 624.3K engagement metrics
      avg_views: 180000,
      avg_reel_views_manual: 180000,
      reel_price: 1500,      // ₹1,500 highly competitive paid starting rate from DM responses
      story_price: 500,       // Stories rate
      starting_price: 1500,
      barter_min_value: 2000, // Barter minimum value
      open_to_collabs: true,
      collaboration_preference: 'both',
      is_verified: true,
      is_elite_verified: true,
      location: 'Noida, Uttar Pradesh, India',
      city: 'Noida',
      bio: 'Fashion | Beauty | UGC Creator 🧿 Noida based. Crafting relatable skincare vlogs, styling guides, and high-fidelity video aesthetics.',
      intro_line: 'Verified Fashion, Beauty & UGC Creator from Noida with 34K followers, massive 7.2M monthly reach, and outstanding engagement 📸✨',
      collab_intro_line: 'Anamika creates exceptionally viral lifestyle aesthetics, skincare routines, and organic UGC product integrations.',
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
 
      // Demographic snapshot from Meta Creator Marketplace
      audience_gender_split: { women: 68.6, men: 31.4 }, // Strong female majority
      top_cities: ['Delhi', 'Mumbai', 'Gurugram', 'Bengaluru'],
      audience_age_range: '18-24 (49.1%)',
      primary_audience_language: 'Hindi / English',

      // System Trust Signals
      deal_score: 98,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true,
      past_brand_count: 0,
      collab_brands_count_override: 0,
      past_brands: [],

      // Marketplace Intel
      deal_intelligence: {
        hookRate: 52.4,
        interactionRate: 8.6,
        accountsReached30d: '7.2M', // Huge!
        accountsEngaged30d: '624.3K', // Phenomenal engagement!
        viralPotential: 'Extreme',
        demographicsRelevance: '99% India Concentrated, massive Gen Z female demographic'
      },
      collab_audience_fit_note: 'Remarkable 68.6% Female demographic split focused heavily in Delhi NCR and major metros—with a highly active youth audience (18-24 age tier representing 49.1%) that is perfectly optimized for beauty, cosmetics, local salon launches, staycations, fashion vlogs, and organic UGC integration.',
      collab_engagement_confidence_note: 'Phenomenal community interest with a massive 624.3K monthly engaged accounts showing stellar organic audience reach and high video replay frequency.',
      collab_delivery_reliability_note: 'Noida-based lifestyle and fashion creator with highly consistent post output and highly relatable storytelling style.',
      collab_cta_trust_note: 'Outstanding CTR and shopping intent for skincare, cosmetic tools, outdoor cafes, apparel, and lifestyle accessories.',

      // Custom Standardized Packages (Based on Rate Card)
      deal_templates: [
        {
          id: 'starter_collab',
          name: '🚀 Starter Collab',
          label: '🚀 Starter Collab',
          type: 'paid',
          price: 1500,
          budget: 1500,
          rate: 1500,
          description: 'Perfect for first-time brand awareness & organic reach.',
          deliverables: [
            '1 Reel',
            'Organic reach focus',
            '1 Revision included'
          ]
        },
        {
          id: 'growth_campaign',
          name: '⭐ Growth Campaign',
          label: '⭐ Growth Campaign',
          type: 'paid',
          price: 3000,
          budget: 3000,
          rate: 3000,
          isPopular: true,
          description: 'Best for brands wanting ads usage + conversions.',
          deliverables: [
            '1 Premium Reel (30-60s)',
            '30-day usage rights (for ads)',
            'Script + hook optimization',
            '2 Story shoutouts',
            '1 Revision included'
          ]
        },
        {
          id: 'barter_collab',
          name: '🎁 Product Exchange',
          label: '🎁 Product Exchange',
          type: 'barter',
          price: 0,
          budget: 0,
          rate: 0,
          barter_min_value: 2000,
          description: 'Barter collaboration - premium product or experience exchange (minimum value ₹2,000+).',
          deliverables: [
            '1 Reel or 2 Stories',
            'Product review focus'
          ]
        }
      ]
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate);

    if (profileError) throw profileError;
    console.log('✅ Profile updated in database.');

    // Phase 4: Link creators and social_accounts
    console.log('[4/8] Linking creators and social accounts tables...');
    const { data: creatorRecord } = await supabase
      .from('creators')
      .select('id')
      .eq('id', actualUserId)
      .maybeSingle();

    if (!creatorRecord) {
      await supabase.from('creators').insert({
        id: actualUserId,
        email: email,
        full_name: fullName,
      });
    }
    console.log('   ✅ Creators table link established.');

    const { data: existingSocial } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('username', username)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (!existingSocial) {
      await supabase.from('social_accounts').insert({
        creator_id: actualUserId,
        platform: 'instagram',
        username: username,
        followers: 34000,
        linked_at: new Date().toISOString()
      });
    } else {
      await supabase.from('social_accounts').update({
        followers: 34000,
        linked_at: new Date().toISOString()
      }).eq('id', existingSocial.id);
    }
    console.log('   ✅ Social account linked and synchronized.');

    // Phase 5: Upload Optimized Reel
    console.log('[5/8] Uploading optimized vertical Reel to Supabase storage...');
    const fileBuffer = fs.readFileSync(optimizedVideoPath);
    const videoFileName = `discovery-anamika-${Date.now()}.mp4`;
    const videoStoragePath = `${actualUserId}/${videoFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(videoStoragePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('creator-assets')
      .getPublicUrl(videoStoragePath);

    console.log(`✅ Video uploaded successfully: ${publicUrl}`);

    const { error: updateVideoError } = await supabase
      .from('profiles')
      .update({ 
        discovery_video_url: publicUrl,
        past_work_added: true
      })
      .eq('id', actualUserId);

    if (updateVideoError) throw updateVideoError;
    console.log(`✅ Profile updated in database with video URL.`);

    // Phase 6: Onboarding Invite Generation
    console.log('[6/8] Generating secure onboarding recovery invite link...');
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://creatorarmour.com/reset-password'
      }
    });

    if (linkError) throw linkError;
    const actionUrl = linkData.properties.action_link;
    console.log(`✅ Recovery link generated: ${actionUrl}`);

    // Phase 7: Send Onboarding Invitation Email
    console.log('[7/8] Sending professional email invitation via Resend API...');
    const ctaButton = `<a href="${actionUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">Set My Password</a>`;
    const htmlBody = getEmailLayout(ctaButton, 'Anamika');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Creator Armour <onboarding@creatorarmour.com>',
        to: email,
        subject: '🛡️ Welcome to Creator Armour — Secure Your Account',
        html: htmlBody
      })
    });

    if (emailResponse.ok) {
      const resData = await emailResponse.json() as any;
      console.log(`✅ Onboarding email successfully dispatched! (Resend ID: ${resData.id})`);
    } else {
      const errData = await emailResponse.json();
      console.error(`❌ Resend email failed:`, JSON.stringify(errData));
    }

    // Phase 8: Backup and sitemaps sync
    console.log('[8/8] Finalizing local backups and dynamic SEO sitemaps index...');
    try {
      const backupScript = path.join(process.cwd(), 'scratch', 'backup_supabase_data.mjs');
      if (fs.existsSync(backupScript)) {
        console.log(`   📡 Syncing updates to offline backups...`);
        execSync(`node ${backupScript}`, { stdio: 'inherit' });
      }
      
      console.log(`   📡 Regenerating dynamic XML sitemap index...`);
      execSync('npx tsx scripts/generate-sitemap.ts', { stdio: 'inherit' });
      console.log('✅ Backups and sitemaps generated successfully!');
    } catch (err: any) {
      console.warn('⚠️ Backup sync warnings (non-fatal):', err.message);
    }

    console.log(`\n🎉 COMPLETELY ONBOARDED @${username} SUCCESSFULLY! 🎉`);
    console.log(`🔗 Public Profile: https://creatorarmour.com/${username}`);

  } catch (err: any) {
    console.error('❌ Onboarding Pipeline Failed:', err.message);
    process.exit(1);
  }
}

main().catch(console.error);
