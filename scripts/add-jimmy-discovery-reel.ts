import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const reelUrl = 'https://www.instagram.com/reel/DQQJ08KjLKC/?igsh=MWsyd2I3MWJnbDNuZQ==';
  const username = 'jimmyandgypsy';
  const userId = '784630ff-2b8c-45ff-a9ac-79c1c5f64066'; // Resolved User ID from database onboarding
  
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const rawFileName = `raw-${Date.now()}.mp4`;
  const rawFilePath = path.join(tempDir, rawFileName);
  
  const optFileName = `discovery-${Date.now()}.mp4`;
  const optFilePath = path.join(tempDir, optFileName);

  console.log(`[1/5] Downloading reel from ${reelUrl}...`);
  try {
    // Download using yt-dlp
    execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${rawFilePath}" "${reelUrl}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to download reel:', error);
    process.exit(1);
  }

  if (!fs.existsSync(rawFilePath)) {
    console.error('Raw downloaded file not found');
    process.exit(1);
  }

  console.log(`[2/5] Re-encoding video with FFmpeg for Safari/iOS compatibility...`);
  try {
    // Standardize using FFmpeg settings from video asset guidelines:
    // ffmpeg -i input.mp4 -vcodec libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -movflags +faststart -threads 0 -preset fast output.mp4
    execSync(`ffmpeg -i "${rawFilePath}" -vcodec libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -movflags +faststart -threads 0 -preset fast "${optFilePath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('FFmpeg re-encoding failed:', error);
    // Cleanup raw file before exit
    if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
    process.exit(1);
  }

  if (!fs.existsSync(optFilePath)) {
    console.error('Optimized file not found after re-encoding');
    if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
    process.exit(1);
  }

  console.log(`[3/5] Uploading optimized video to Supabase storage (creator-assets)...`);
  const fileBuffer = fs.readFileSync(optFilePath);
  const storagePath = `${userId}/${optFileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('creator-assets')
    .upload(storagePath, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });

  if (uploadError) {
    console.error('Failed to upload to Supabase storage:', uploadError);
    // Cleanup before exit
    if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
    if (fs.existsSync(optFilePath)) fs.unlinkSync(optFilePath);
    process.exit(1);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('creator-assets')
    .getPublicUrl(storagePath);

  console.log(`[4/5] Updating profile for ${username} with new video URL...`);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      discovery_video_url: publicUrl,
      past_work_added: true
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update profile database row:', updateError);
  } else {
    console.log(`\n✅ [5/5] Successfully added discovery reel for ${username}!`);
    console.log(`Public URL: ${publicUrl}`);
  }

  // Cleanup local files
  console.log('Cleaning up temporary files...');
  if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
  if (fs.existsSync(optFilePath)) fs.unlinkSync(optFilePath);
  console.log('Done!');
}

main().catch(err => {
  console.error('Unhandled error in script:', err);
  process.exit(1);
});
