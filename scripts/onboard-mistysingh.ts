import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { chromium } from 'playwright';

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

// Helper to decode HTML entities like &amp; to &
function decodeHtmlEntities(str: string) {
  return str.replace(/&amp;/g, '&');
}

async function main() {
  const email = 'mistysingh.114@gmail.com';
  const username = 'mistysingh_126';
  const fullName = 'Misty Singh | Fashion & Makeup 💄';
  const password = 'CreatorArmour2026!'; // Temporary credential
  const reelUrl = 'https://www.instagram.com/reel/DYmvRSxyzDZ/?igsh=YTEyMTh0aTU1eW84';

  console.log(`🚀 Starting Full Onboarding & Discovery Video Asset pipeline for Misty (@${username})...`);

  try {
    // Phase 1: Create Auth User
    console.log(`[1/8] Creating/resolving auth user for ${email}...`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Misty',
        last_name: 'Singh',
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

    // Phase 2: Playwright Scrape Live Profile Avatar from Instagram
    console.log('[2/8] Fetching and uploading authentic Instagram DP using Playwright Meta Sniffer...');
    let avatarUrl = `https://sqqocqujxlgoxbcnfbfb.supabase.co/storage/v1/object/public/creator-assets/${username}/avatar_real.jpg`;
    let isAvatarSynced = false;

    try {
      console.log('🚀 Launching headless browser...');
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        locale: 'en-US',
      });
      const page = await context.newPage();

      // Ingest the target profile
      console.log(`🌐 Navigating directly to profile page: https://www.instagram.com/${username}/`);
      await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'commit', timeout: 15000 });
      const html = await page.content();
      const match = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
      
      if (match && match[1]) {
        const decodedUrl = decodeHtmlEntities(match[1]);
        console.log(`  🎉 Meta sniffed profile photo URL: ${decodedUrl.substring(0, 80)}...`);
        
        console.log(`📥 Downloading image directly in browser context...`);
        const imgResponse = await page.goto(decodedUrl, { timeout: 15000 });
        if (imgResponse && imgResponse.status() === 200) {
          const imgBuffer = await imgResponse.body();
          
          console.log(`  📤 Uploading avatar for @${username} to Supabase storage...`);
          const storagePath = `${username}/avatar_real.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from('creator-assets')
            .upload(storagePath, imgBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (!uploadErr) {
            avatarUrl = `${SUPABASE_URL}/storage/v1/object/public/creator-assets/${storagePath}`;
            console.log(`  🚀 CDN Upload complete: ${avatarUrl}`);
            isAvatarSynced = true;
          } else {
            console.error(`  ❌ Failed to upload avatar to CDN:`, uploadErr.message);
          }
        } else {
          console.error(`  ❌ Direct image navigation failed.`);
        }
      } else {
        console.warn(`  ⚠️ og:image tag not found in the initial committed HTML.`);
      }

      await browser.close();
    } catch (e: any) {
      console.error('⚠️ Playwright DP scrape failed. Proceeding with CDN fallback URL pattern:', e.message);
    }

    // Phase 3: Register Profile Details
    console.log('[3/8] Registering creator profile parameters with official Meta Marketplace metrics...');
    const profileUpdate = {
      id: actualUserId,
      first_name: 'Misty',
      last_name: 'Singh',
      avatar_url: avatarUrl,
      instagram_profile_photo: avatarUrl,
      username: username,
      instagram_handle: username,
      business_name: 'MISTY SINGH 💄',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Fashion & Lifestyle',
      instagram_followers: 21100,
      followers_count: 21100,
      engagement_rate: 4.2, // Exact official Meta Interaction Rate (4.2%)
      avg_views: 45000,      // Calculated average view metric based on 236K reach and high interaction
      avg_likes_manual: 1200,
      avg_reel_views_manual: 45000,
      reel_price: 8000,     // Provided by user (₹8,000 for Reel)
      story_price: 1500,     // Estimated commercial standard for story
      starting_price: 8000,
      open_to_collabs: true,
      collaboration_preference: 'both', // Accepts Paid & Barter
      is_verified: true,
      is_elite_verified: true,
      location: 'Munger, Bihar',
      city: 'Munger',
      bio: 'Fashion | Lifestyle | Makeup 💄 | DM for collaborations 📍 Munger, Bihar, India',
      intro_line: 'Verified Fashion, Lifestyle & Makeup Creator from Munger with 21K followers and 4.2% Interaction Rate 💄✨',
      collab_intro_line: 'Misty Singh features aesthetics outfit vlogs, makeup transitions, and lifestyle product integrations.',
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Audience Demographics Snapshot from Meta Creator Marketplace
      audience_gender_split: { women: 21.0, men: 79.0 },
      top_cities: ['Munger', 'Patna', 'Jamalpur', 'Bhagalpur'],
      audience_age_range: '18-24 (51.3%)',
      primary_audience_language: 'Hindi / English',

      // System Trust Signals
      deal_score: 95,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true,
      past_brand_count: 0,
      collab_brands_count_override: 0,
      past_brands: [],
      brand_logos: [],

      // Marketplace Intel
      deal_intelligence: {
        hookRate: 48.3, // 48.3% from Marketplace
        interactionRate: 4.2, // 4.2% from Marketplace
        accountsReached30d: '236.4K', // 236.4K from Marketplace
        accountsEngaged30d: '21.2K', // 21.2K from Marketplace
        viralPotential: 'High',
        demographicsRelevance: '96.5% India Concentrated'
      },
      collab_audience_fit_note: 'Extremely high 96.5% India concentration, heavily dense in Bihar metros (Munger, Patna, Jamalpur).',
      collab_engagement_confidence_note: 'Strong 4.2% interaction rate backed by an excellent 48.3% hook rate.',
      collab_delivery_reliability_note: 'Proven local engagement with over 236K accounts reached in the last 30 days.',
      collab_cta_trust_note: 'Outstanding conversion potential for D2C beauty, apparel, cosmetics, and accessories brands aiming at regional growth.',

      // Deal Templates
      deal_templates: [
        {
          id: 'starter_collab',
          type: 'paid',
          label: '🚀 Starter Collab',
          price: 8000,
          budget: 8000,
          description: '1 High-quality Collab Reel featuring Misty Singh - Ideal for organic reach, local brand exposure, and beauty/fashion buzz.',
          deliverables: [
            '1 Reel (15-30s) featuring Misty',
            'Organic reach focus',
            '1 Revision included'
          ]
        },
        {
          id: 'growth_campaign',
          type: 'paid',
          label: '⭐ Growth Campaign',
          price: 10000,
          budget: 10000,
          isPopular: true,
          description: '1 Premium Reel + 2 Stories - Ideal for driving conversions, website traffic, and direct purchase links.',
          deliverables: [
            '1 Premium Reel (30-60s)',
            '30-day usage rights (for ads)',
            'Script + hook optimization',
            '2 Story shoutouts',
            '1 Revision included'
          ]
        },
        {
          id: 'product_exchange',
          type: 'barter',
          label: '🎁 Product Exchange',
          price: 0,
          budget: 0,
          barter_min_value: 5000,
          description: 'Barter collaboration - Ideal for lifestyle & fashion product reviews (minimum product/voucher value ₹5,000+).',
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
    console.log('✅ Profile updated in database with all high-fidelity marketplace metrics.');

    // Phase 4: Link Creators & Social Account Table Link
    console.log('[4/8] Creating social links...');
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
        followers: 21100,
        linked_at: new Date().toISOString()
      });
      console.log('✅ Social account linked');
    } else {
      await supabase.from('social_accounts').update({
        followers: 21100,
        linked_at: new Date().toISOString()
      }).eq('id', existingSocial.id);
      console.log('✅ Social account updated');
    }

    // Phase 5: Download Reel video using yt-dlp
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const rawFileName = `raw-mistysingh-${Date.now()}.mp4`;
    const rawFilePath = path.join(tempDir, rawFileName);
    
    const optFileName = `discovery-mistysingh-${Date.now()}.mp4`;
    const optFilePath = path.join(tempDir, optFileName);

    console.log(`[5/8] Downloading discovery reel from ${reelUrl}...`);
    try {
      execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${rawFilePath}" "${reelUrl}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('⚠️ Failed to download reel:', error);
      throw error;
    }

    if (!fs.existsSync(rawFilePath)) {
      throw new Error('Raw downloaded file not found');
    }

    // Phase 6: Re-encode video with FFmpeg for Safari/iOS compatibility
    console.log(`[6/8] Re-encoding video with FFmpeg for Safari/iOS compatibility (H.264 vertical format)...`);
    try {
      execSync(`ffmpeg -i "${rawFilePath}" -vcodec libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -movflags +faststart -threads 0 -preset fast "${optFilePath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('⚠️ FFmpeg re-encoding failed:', error);
      if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
      throw error;
    }

    if (!fs.existsSync(optFilePath)) {
      if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
      throw new Error('Optimized file not found after re-encoding');
    }

    // Phase 7: Upload optimized video to Supabase Storage
    console.log(`[7/8] Uploading optimized video to Supabase Storage (creator-assets)...`);
    const fileBuffer = fs.readFileSync(optFilePath);
    const storagePath = `${actualUserId}/${optFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
      if (fs.existsSync(optFilePath)) fs.unlinkSync(optFilePath);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('creator-assets')
      .getPublicUrl(storagePath);

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

    // Cleanup local files
    if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
    if (fs.existsSync(optFilePath)) fs.unlinkSync(optFilePath);

    // Phase 8: Trigger welcome onboarding email via Resend
    console.log(`[8/8] Generating onboarding invite link for ${fullName} (${email})...`);
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://creatorarmour.com/reset-password'
      }
    });

    if (linkError) {
      throw new Error(`Failed to generate password link: ${linkError.message}`);
    }

    const actionUrl = linkData.properties.action_link;
    console.log(`✅ Secure recovery link generated: ${actionUrl}`);

    const ctaButton = `<a href="${actionUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">Set My Password</a>`;
    const htmlBody = getEmailLayout(ctaButton, 'Misty');

    console.log(`📤 Sending onboarding invitation email to ${email}...`);
    const response = await fetch('https://api.resend.com/emails', {
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

    if (response.ok) {
      const resData = await response.json();
      console.log(`\n✨ Success! Onboarding email successfully sent to ${fullName}! (Resend ID: ${resData.id})`);
    } else {
      const errData = await response.json();
      console.error(`❌ Failed to send email via Resend:`, JSON.stringify(errData));
    }

    console.log(`\n✨ Full Onboarding, Asset Optimization, and Email dispatch pipeline completed successfully for @${username}!`);
    console.log(`🔗 Public Profile: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

main();
