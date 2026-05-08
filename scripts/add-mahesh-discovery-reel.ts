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
  const reelUrl = 'https://www.instagram.com/reel/C0MdSWOpQ_m/';
  const username = 'photowalamusafir';
  const fileName = `discovery-${Date.now()}.mp4`;
  const tempDir = path.join(process.cwd(), 'temp');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const filePath = path.join(tempDir, fileName);

  console.log(`Downloading reel from ${reelUrl}...`);
  try {
    // Use yt-dlp to download the video. 
    // We specify format 'mp4' to ensure compatibility.
    execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${filePath}" "${reelUrl}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to download reel:', error);
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error('File not found after download');
    process.exit(1);
  }

  console.log(`Uploading to Supabase storage...`);
  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `0d1427e7-a9fe-46de-8ef1-8db9a390fb64/${fileName}`; // Using Mahesh's user ID if possible, but handle works too
  
  // First, find the user ID for photowalamusafir
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('instagram_handle', username)
    .single();
    
  const userId = profile?.id || 'manual-upload';

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('creator-assets')
    .upload(`${userId}/${fileName}`, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });

  if (uploadError) {
    console.error('Failed to upload to Supabase:', uploadError);
    process.exit(1);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('creator-assets')
    .getPublicUrl(`${userId}/${fileName}`);

  console.log(`Updating profile for ${username}...`);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ discovery_video_url: publicUrl })
    .eq('instagram_handle', username);

  if (updateError) {
    console.error('Failed to update profile:', updateError);
    process.exit(1);
  } else {
    console.log(`✅ Successfully added discovery reel for ${username}!`);
    console.log(`Public URL: ${publicUrl}`);
  }

  // Cleanup
  fs.unlinkSync(filePath);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
