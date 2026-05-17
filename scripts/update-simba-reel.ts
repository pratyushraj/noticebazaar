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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const username = 'simba_bhimavaram_bullodu';
  const originalVideoPath = '/Users/pratyushraj/Downloads/Video-613.mp4';
  const optimizedVideoPath = join(process.cwd(), 'simba_reel_insta_optimized_613.mp4');

  console.log(`🚀 Starting update of Simba & Sara's reel using Video-613.mp4...`);

  try {
    if (!existsSync(originalVideoPath)) {
      throw new Error(`Original downloaded video not found at: ${originalVideoPath}`);
    }

    // 1. Transcode using FFmpeg
    console.log(`🎬 Transcoding Video-613.mp4 via FFmpeg...`);
    const ffmpegCmd = `ffmpeg -y -i "${originalVideoPath}" -vf "scale=480:854" -c:v libx264 -preset fast -crf 28 -maxrate 600k -bufsize 1200k -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 64k "${optimizedVideoPath}"`;
    execSync(ffmpegCmd, { stdio: 'ignore' });
    console.log(`✅ Transcoding complete. Optimized file generated.`);

    // 2. Upload to Supabase Storage
    const storagePath = `discovery-reels/${username}-reel.mp4`;
    console.log(`📤 Uploading optimized video to creator-discovery bucket...`);
    const fileBuffer = readFileSync(optimizedVideoPath);

    const { error: uploadError } = await supabase.storage
      .from('creator-discovery')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log('✅ Video uploaded to storage successfully.');

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-discovery')
      .getPublicUrl(storagePath);
    console.log(`✅ Public Video URL: ${publicUrl}`);

    // 4. Update Profile in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ discovery_video_url: publicUrl })
      .eq('username', username);

    if (updateError) throw updateError;
    console.log('✅ Profile updated in database with the new discovery_video_url.');

    console.log('\n✨ Integration Complete! Simba & Sara is now live with Video-613.mp4.');

  } catch (error: any) {
    console.error('❌ Integration failed:', error.message);
  }
}

main();
