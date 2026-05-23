const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const username = 'prachisculinarycanvas';
const tempDir = path.join(__dirname, 'temp_prachi');

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
}

uploadAssets();
