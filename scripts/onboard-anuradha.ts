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
const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';

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
  const email = 'anuradhakumari4955@gmail.com';
  const username = 'anuradha.kumari___';
  const fullName = 'Anuradha Kumari';
  const password = 'CreatorArmour2026!'; // Temporary password
  const optimizedVideoPath = path.join(process.cwd(), 'scratch', 'anuradha_optimized.mp4');

  console.log(`🚀 Starting Onboarding & Asset synchronization pipeline for Anuradha (@${username})...`);

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
        first_name: 'Anuradha',
        last_name: 'Kumari',
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

    // Phase 2: Placeholder Avatar (will be overwritten instantly by DP Sniffer)
    console.log('[2/8] Setting placeholder avatar...');
    const placeholderUrl = `https://sqqocqujxlgoxbcnfbfb.supabase.co/storage/v1/object/public/creator-assets/default_avatar.png`;

    // Phase 3: Register Profile Details
    console.log('[3/8] Registering creator profile parameters with official Meta Marketplace metrics...');
    
    const profileUpdate = {
      id: actualUserId,
      first_name: 'Anuradha',
      last_name: 'Kumari',
      avatar_url: placeholderUrl,
      instagram_profile_photo: placeholderUrl,
      username: username,
      instagram_handle: username,
      business_name: 'Anuradha Kumari | Actor & Creator 🎬👗',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Fashion & Beauty',
      instagram_followers: 125500,
      followers_count: 125500,
      engagement_rate: 7.6, // Exact official Meta Interaction Rate from screenshot
      avg_views: 150000,    // High engagement views based on 5.4M reach
      avg_reel_views_manual: 150000,
      reel_price: 75000,    // ₹75,000 starting reel rate
      story_price: 15000,   // Standard story price (20%)
      starting_price: 75000,
      open_to_collabs: true,
      collaboration_preference: 'both',
      is_verified: true,
      is_elite_verified: true,
      location: 'Delhi, India',
      city: 'Delhi',
      bio: '🎬 Actor & Creator | Delhi based. Sharing my aesthetic fashion lookbooks, lifestyle vlogs, and behind-the-scenes sets. Believer in authentic storytelling and creative art ✨',
      intro_line: 'Verified Actor & Lifestyle Creator with 125.5K followers and 7.6% Interaction Rate 🎬👗',
      collab_intro_line: 'Anuradha Kumari features premium aesthetic personal styling lookbooks, acting vlogs, and high-fidelity lifestyle product partnerships.',
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Demographic snapshot from Meta Creator Marketplace
      audience_gender_split: { women: 81.0, men: 19.0 }, // Massive 81.0% Female split!
      top_cities: ['Delhi', 'Patna', 'Kolkata', 'Mumbai'],
      audience_age_range: '18-24 (52.2%)',
      primary_audience_language: 'Hindi / English',

      // System Trust Signals
      deal_score: 98,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true,
      past_brand_count: 1, // Meta Marketplace partnership lists "Partnered with Cute & Elite Cosmetics"
      collab_brands_count_override: 1,

      // Marketplace Intel
      deal_intelligence: {
        hookRate: 53.5, // Exact Hook Rate from marketplace screenshot
        interactionRate: 7.6,
        accountsReached30d: '5.4M', // Exact from marketplace screenshot
        accountsEngaged30d: '513.4K', // Exact from marketplace screenshot
        viralPotential: 'Extreme',
        demographicsRelevance: '92.6% India Concentrated'
      },
      collab_audience_fit_note: 'Spectacular 81.0% Female audience split—highly optimal for aesthetic skincare, wellness, luxury apparel, and cosmetics.',
      collab_engagement_confidence_note: 'Strong 7.6% interaction rate combined with high 5.4M accounts reached and 513.4K accounts engaged.',
      collab_delivery_reliability_note: 'Delhi-based actor prompt with brief execution and professional content timelines.',
      collab_cta_trust_note: 'Extremely high conversions for premium cosmetics, luxury personal care, female styling apparel, and lifestyle brands.',

      // Custom Standardized Packages (Starting from 75k)
      deal_templates: [
        {
          id: 'starter_collab',
          name: '🚀 Starter Collab',
          label: '🚀 Starter Collab',
          type: 'paid',
          price: 75000,
          budget: 75000,
          rate: 75000,
          description: 'Perfect for first-time brand awareness & organic reach.',
          deliverables: [
            '1 Reel (15-30s)',
            'Organic reach focus',
            '1 Revision included'
          ]
        },
        {
          id: 'growth_campaign',
          name: '⭐ Growth Campaign',
          label: '⭐ Growth Campaign',
          type: 'paid',
          price: 95000,
          budget: 95000,
          rate: 95000,
          isPopular: true,
          description: 'Best for brands wanting ads usage + conversions.',
          deliverables: [
            '1 Premium Reel (30-60s)',
            '30-day usage rights (for ads)',
            'Script + hook optimization',
            '2 Story shoutouts',
            '1 Revision included'
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
        followers: 125500,
        linked_at: new Date().toISOString()
      });
    } else {
      await supabase.from('social_accounts').update({
        followers: 125500,
        linked_at: new Date().toISOString()
      }).eq('id', existingSocial.id);
    }
    console.log('   ✅ Social account linked and synchronized.');

    // Phase 5: Upload Optimized Reel
    console.log('[5/8] Uploading optimized vertical Reel to Supabase storage...');
    const fileBuffer = fs.readFileSync(optimizedVideoPath);
    const videoFileName = `discovery-anuradha-${Date.now()}.mp4`;
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
    const htmlBody = getEmailLayout(ctaButton, 'Anuradha');

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
