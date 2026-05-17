import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function uploadReel() {
  const username = 'storiesbyseema';
  const filePath = join(process.cwd(), 'seema_reel_final.mp4');
  const storagePath = `discovery-reels/${username}-reel.mp4`;

  console.log(`📤 Uploading transcoded reel for @${username}...`);

  try {
    const fileBuffer = readFileSync(filePath);

    // 1. Upload to Storage
    const { data, error: uploadError } = await supabase.storage
      .from('creator-discovery')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log('✅ Video uploaded to storage successfully.');

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-discovery')
      .getPublicUrl(storagePath);

    console.log(`✅ Public URL generated: ${publicUrl}`);

    // 3. Update Profile Table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ discovery_video_url: publicUrl })
      .eq('username', username);

    if (updateError) throw updateError;
    console.log('✅ Profile updated in database with new discovery_video_url.');

    console.log('\n✨ Integration Successful! Seema is now 100% verified with discovery content.');
    console.log(`🔗 Profile Link: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Integration failed with error:', error.message);
  }
}

uploadReel();
