
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function uploadReel() {
  const username = '_small_home_kitchen_';
  const filePath = join(process.cwd(), 'shikha_reel.mp4');
  const bucketName = 'creator-assets';
  const storagePath = `discovery-reels/${username}.mp4`;

  console.log(`🎬 Uploading reel for @${username}...`);

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);

    // 1. Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log('✅ Video uploaded to storage');

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    console.log(`🔗 Public URL: ${publicUrl}`);

    // 3. Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ discovery_video_url: publicUrl })
      .eq('username', username);

    if (profileError) throw profileError;
    console.log('✅ Profile updated with video URL');

    console.log('\n✨ Asset Integration Complete!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

uploadReel();
