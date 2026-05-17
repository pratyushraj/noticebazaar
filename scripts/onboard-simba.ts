import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

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

async function main() {
  const email = 'srisatya367@gmail.com';
  const username = 'simba_bhimavaram_bullodu';
  const fullName = 'Ponnapalli Divya Sri Satya';
  const password = 'CreatorArmour2026!'; // Temporary password

  console.log(`🚀 Starting Onboarding for Simba & Sara (@${username})...`);

  try {
    // 1. Transcode the funny dog video from Downloads using FFmpeg
    const originalVideoPath = `/Users/pratyushraj/Downloads/तुम खुद देखो मेरे से स्मार्ट कोई है इस दुनिया में.. ❤️#dog #funny 😂#viral #doglover #shortvideo.mp4`;
    const optimizedVideoPath = join(process.cwd(), 'simba_reel_optimized.mp4');

    if (!existsSync(originalVideoPath)) {
      throw new Error(`Original video file not found at: ${originalVideoPath}`);
    }

    console.log(`🎬 Transcoding original pet video using FFmpeg...`);
    const ffmpegCmd = `ffmpeg -y -i "${originalVideoPath}" -vf "scale=480:854" -c:v libx264 -preset fast -crf 28 -maxrate 600k -bufsize 1200k -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 64k "${optimizedVideoPath}"`;
    execSync(ffmpegCmd, { stdio: 'ignore' });
    console.log(`✅ Transcoding complete. Optimized video generated.`);

    // 2. Create Auth User
    console.log('📧 Creating auth user for srisatya367@gmail.com...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Satya',
        last_name: 'Ponnapalli',
      }
    });

    if (userError) {
      if (userError.message.includes('already registered')) {
        console.log('⚠️ User already exists, proceeding to update profile...');
      } else {
        throw userError;
      }
    }

    const userId = userData.user?.id;
    if (!userId) {
      // Fetch existing user ID if creation failed due to conflict
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email);
      if (!existingUser) throw new Error('Could not find or create user');
      var actualUserId = existingUser.id;
    } else {
      var actualUserId = userId;
    }

    console.log(`✅ User ID resolved: ${actualUserId}`);

    // 3. Upload Transcoded video to Supabase Storage
    const storagePath = `discovery-reels/${username}-reel.mp4`;
    console.log(`📤 Uploading optimized discovery reel to creator-discovery bucket...`);
    const fileBuffer = readFileSync(optimizedVideoPath);

    const { error: uploadError } = await supabase.storage
      .from('creator-discovery')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log('✅ Video uploaded successfully.');

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-discovery')
      .getPublicUrl(storagePath);
    console.log(`✅ Public Video URL: ${publicUrl}`);

    // 4. Update Profile
    console.log('📝 Registering creator profile parameters...');
    const avatarUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200&h=200'; // Cute dog portrait placeholder

    const profileUpdate = {
      id: actualUserId,
      first_name: 'Satya',
      last_name: 'Ponnapalli',
      avatar_url: avatarUrl,
      username: username,
      instagram_handle: username,
      business_name: 'Simba & Sara Bhimavaram',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Pet & Lifestyle',
      instagram_followers: 34400,
      followers_count: 34400,
      engagement_rate: 3.8,
      avg_views: 42000,
      avg_reel_views_manual: 42000,
      reel_price: 3000,
      story_price: 1000,
      starting_price: 3000,
      open_to_collabs: true,
      collaboration_preference: 'both',
      barter_min_value: 1500,
      is_verified: true,
      is_elite_verified: true,
      location: 'Bhimavaram, India',
      city: 'Bhimavaram',
      bio: '🐾 First Pet Influencer in Bhimavaram | Simba & Sara | Daily cute, funny, and beautiful pet adventures',
      intro_line: "Bhimavaram's First Pet Influencers - Simba & Sara 🐕✨",
      collab_intro_line: 'Simba & Sara share premium pet lifestyle, nutrition, and organic wellness routines.',
      discovery_video_url: publicUrl,
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate);

    if (profileError) throw profileError;
    console.log('✅ Profile updated in database with all metrics and video URL.');

    // 5. Check and create creator table link
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

    console.log('\n✨ Onboarding Successful! Simba & Sara is now 100% Elite Verified.');
    console.log(`🔗 Profile Link: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Onboarding failed:', error.message);
  }
}

main();
