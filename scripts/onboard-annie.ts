import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

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

async function main() {
  const email = 'Singhr929@gmail.com';
  const username = 'annie_pupstar';
  const fullName = 'Annie Goshal | The Golden Retriever 🐶';
  const password = 'CreatorArmour2026!'; // Temporary credential
  const reelUrl = 'https://www.instagram.com/reel/DYmVANmIdD5/?igsh=Z3MxZW53MHRzNzQ3';
  const liveAvatarUrl = 'https://scontent.cdninstagram.com/v/t51.2885-19/339822508_593678649474046_948231295044981649_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=110&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=kc32xY0lq-cQ7kNvwG4_KoZ&_nc_oc=AdqFI_R81sD6Q313293Q3I6mxrfAKU6ZwVaU165G-3_qdz9e6TAgI7D2GNQ5PV6uFwQFnkjEfk5gEcQnLzbj1vto&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_ss=7b6a8&oh=00_Af45vg2I1pToDSheE1lsS-htIjOAOIxWe2eDpoCb_ulQDA&oe=6A169079';

  console.log(`🚀 Starting Full Onboarding & Discovery Video Asset pipeline for Annie (@${username})...`);

  try {
    // Phase 1: Create Auth User
    console.log(`[1/8] Creating/resolving auth user for ${email}...`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Annie',
        last_name: 'Goshal',
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

    const avatarUrl = `https://sqqocqujxlgoxbcnfbfb.supabase.co/storage/v1/object/public/creator-assets/${username}/avatar_real.jpg`;

    // Phase 2: Register Profile Details
    console.log('[2/8] Registering creator profile parameters with official Meta Marketplace metrics...');
    const profileUpdate = {
      id: actualUserId,
      first_name: 'Annie',
      last_name: 'Goshal',
      avatar_url: avatarUrl,
      instagram_profile_photo: avatarUrl,
      username: username,
      instagram_handle: username,
      business_name: 'Annie Goshal | The Golden retriever 🐾',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Pet Care & Wholesomeness',
      instagram_followers: 122000,
      followers_count: 122000,
      engagement_rate: 7.6, // Exact official Meta Interaction Rate (7.6%)
      avg_views: 45000,      // Baseline conservative baseline views estimation
      avg_reel_views_manual: 45000,
      reel_price: 30000,     // From DM commercial rate (30k for reel)
      story_price: 2500,     // Estimated breakdown
      starting_price: 30000,
      open_to_collabs: true,
      collaboration_preference: 'paid',
      is_verified: true,
      is_elite_verified: true,
      location: 'Pune, Maharashtra',
      city: 'Pune',
      bio: '🐶 Just a baby Golden Retriever living her best life! Expression Queen spreading daily wholesomeness & puppy love. 🐾 Managed by hoomans. Pune, Maharashtra, India',
      intro_line: 'Premium Golden Retriever from Pune with 122K followers and 7.6% Interaction Rate 🐾💛',
      collab_intro_line: 'Annie Goshal the Golden Retriever features daily antics, high-energy pet product reviews, and premium dog lifestyle stories.',
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Audience Demographics Snapshot from Meta Creator Marketplace
      audience_gender_split: { women: 75.3, men: 24.7 },
      top_cities: ['Chennai', 'Bangalore', 'Delhi', 'Mumbai'],
      audience_age_range: '18-34 (75.4%)',
      primary_audience_language: 'English / Hindi',

      // System Trust Signals
      deal_score: 95,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true,
      past_brand_count: 1,
      collab_brands_count_override: 1,
      past_brands: ['Petcare by PIL'],
      brand_logos: [],

      // Marketplace Intel
      deal_intelligence: {
        hookRate: 54.6, // 54.6% from Marketplace
        interactionRate: 7.6, // 7.6% from Marketplace
        accountsReached30d: '3.6M', // 3.6M from Marketplace
        accountsEngaged30d: '213K', // 213K from Marketplace
        viralPotential: 'Extremely Active',
        demographicsRelevance: '96.2% India Concentrated'
      },
      collab_audience_fit_note: 'Exceptional 96.2% Indian concentration with heavy density in major metros and Pune.',
      collab_engagement_confidence_note: 'Strong 7.6% interaction rate combined with an excellent 54.6% video hook retention rate.',
      collab_delivery_reliability_note: 'Highly active creator with massive reach and consistent organic viewer retention.',
      collab_cta_trust_note: 'Outstanding conversion potential for premium pet food, grooming startups, pet accessories, and pet cafés.',

      // Deal Templates
      deal_templates: [
        {
          id: 'starter_collab',
          type: 'paid',
          label: '🚀 Starter Collab',
          price: 30000,
          budget: 30000,
          description: '1 Wholesome Collab Reel featuring Annie - Perfect for organic reach, awareness, and brand exposure.',
          deliverables: [
            '1 Reel (15-30s) featuring Annie',
            'Organic reach focus',
            '1 Revision included'
          ]
        },
        {
          id: 'growth_campaign',
          type: 'paid',
          label: '⭐ Growth Campaign',
          price: 35000,
          budget: 35000,
          isPopular: true,
          description: '1 Premium Reel + 2 Stories - Ideal for driving high-intent traffic, conversions, and direct link visits.',
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
    console.log('✅ Profile updated in database with all high-fidelity marketplace metrics.');

    // Phase 3: Creators table link
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
    console.log('✅ Creators table link established.');

    // Phase 4: Link social account
    console.log('📱 Linking social account...');
    const { data: existingSocial } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('username', username)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (!existingSocial) {
      const { error: socialError } = await supabase
        .from('social_accounts')
        .insert({
          creator_id: actualUserId,
          platform: 'instagram',
          username: username,
          followers: 122000,
          linked_at: new Date().toISOString()
        });

      if (socialError) console.warn('⚠️ Social account link warning:', socialError.message);
      else console.log('✅ Social account linked');
    } else {
      const { error: socialError } = await supabase
        .from('social_accounts')
        .update({
          followers: 122000,
          linked_at: new Date().toISOString()
        })
        .eq('id', existingSocial.id);

      if (socialError) console.warn('⚠️ Social account update warning:', socialError.message);
      else console.log('✅ Social account updated');
    }

    // Phase 5: Download & Upload Live Avatar
    console.log(`[5/8] Syncing live avatar image to Supabase Storage...`);
    const avatarResponse = await axios.get(liveAvatarUrl, { responseType: 'arraybuffer' });
    const avatarBuffer = Buffer.from(avatarResponse.data);
    const avatarStoragePath = `${username}/avatar_real.jpg`;

    const { error: avatarUploadError } = await supabase.storage
      .from('creator-assets')
      .upload(avatarStoragePath, avatarBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (avatarUploadError) throw avatarUploadError;
    console.log(`✅ Avatar image uploaded successfully to creator-assets/${avatarStoragePath}`);

    // Phase 6: Download Reel video
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const rawFileName = `raw-annie-${Date.now()}.mp4`;
    const rawFilePath = path.join(tempDir, rawFileName);
    
    const optFileName = `discovery-annie-${Date.now()}.mp4`;
    const optFilePath = path.join(tempDir, optFileName);

    console.log(`[6/8] Downloading discovery reel from ${reelUrl}...`);
    try {
      execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${rawFilePath}" "${reelUrl}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('⚠️ Failed to download reel:', error);
      throw error;
    }

    if (!fs.existsSync(rawFilePath)) {
      throw new Error('Raw downloaded file not found');
    }

    // Phase 7: Optimize & Upload Reel video
    console.log(`[7/8] Re-encoding video with FFmpeg for Safari/iOS compatibility...`);
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

    console.log(`📤 Uploading optimized video to Supabase Storage (creator-assets)...`);
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
    const htmlBody = getEmailLayout(ctaButton, 'Annie');

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
