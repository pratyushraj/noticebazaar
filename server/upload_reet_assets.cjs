const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const username = 'chroniclesofffoods';

async function uploadToSupabase(filePath, bucket, storagePath) {
  const fileContent = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileContent, {
      contentType: filePath.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
      upsert: true
    });
  if (error) {
    console.error(`Error uploading ${filePath}:`, error);
    throw error;
  }
  console.log(`Uploaded ${filePath} to ${storagePath}`);
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

async function run() {
  try {
    const avatarPath = path.join(__dirname, 'temp_reels', 'reet_avatar.jpg');
    const videoPath = path.join(__dirname, 'temp_reels', 'reet_discovery.mp4');

    console.log('Uploading assets to Supabase...');
    await uploadToSupabase(avatarPath, 'creator-assets', `${username}/avatar.jpg`);
    await uploadToSupabase(videoPath, 'creator-assets', `${username}/discovery.mp4`);

    console.log('Successfully uploaded Reet Sharma assets!');
  } catch (err) {
    console.error('Finalization Error:', err);
  }
}

run();
