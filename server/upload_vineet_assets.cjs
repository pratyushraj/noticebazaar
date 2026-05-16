const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const username = '_cookingwithvineet';
const tempDir = path.join(__dirname, 'temp_vineet');

async function uploadAssets() {
  console.log(`Uploading assets for ${username}...`);

  const discoveryPath = path.join(tempDir, 'discovery.mp4');
  
  if (!fs.existsSync(discoveryPath)) {
    console.error('Discovery reel not found!');
    return;
  }

  // 1. Upload Discovery Reel
  const discoveryFile = fs.readFileSync(discoveryPath);
  const { error: discoveryError } = await supabase.storage
    .from('creator-assets')
    .upload(`${username}/discovery.mp4`, discoveryFile, {
      contentType: 'video/mp4',
      upsert: true
    });

  if (discoveryError) {
    console.error('Error uploading discovery reel:', discoveryError);
  } else {
    console.log('✅ Discovery reel uploaded.');
  }

  // 2. Upload Avatar
  const avatarPath = path.join(tempDir, 'real_dp_vineet_v2.jpg');
  if (fs.existsSync(avatarPath)) {
    const avatarFile = fs.readFileSync(avatarPath);
    const { error: avatarError } = await supabase.storage
      .from('creator-assets')
      .upload(`${username}/avatar.jpg`, avatarFile, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (avatarError) {
      console.error('Error uploading avatar:', avatarError);
    } else {
      console.log('✅ Real Instagram DP uploaded.');
    }
  } else {
    console.error('Avatar file not found at path:', avatarPath);
  }
}

uploadAssets();
