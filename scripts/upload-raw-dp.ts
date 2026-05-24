import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const username = 'nikh_l_martolia';
  const avatarPath = path.join(process.cwd(), 'scratch', 'test_crops', 'raw', 'nikhil_avatar_pure_raw.png');

  console.log(`🚀 Uploading unedited original 44x44 avatar for @${username}...`);

  if (!fs.existsSync(avatarPath)) {
    throw new Error(`Raw avatar file not found at ${avatarPath}`);
  }

  const avatarBuffer = fs.readFileSync(avatarPath);
  const avatarStoragePath = `${username}/avatar_ultra.png`;

  console.log('📤 Uploading original unedited avatar to creator-assets bucket...');
  const { error: uploadError } = await supabase.storage
    .from('creator-assets')
    .upload(avatarStoragePath, avatarBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) throw uploadError;
  const avatarPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/creator-assets/${avatarStoragePath}`;
  console.log(`✅ Avatar CDN URL: ${avatarPublicUrl}`);

  // Update profiles table in Supabase
  console.log('📡 Updating database profile URL...');
  const { error: dbError } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarPublicUrl,
      instagram_profile_photo: avatarPublicUrl
    })
    .eq('username', username);

  if (dbError) throw dbError;
  console.log('✅ Database profile avatar updated successfully!');

  // Sync backups
  console.log('📡 Finalizing local backups and dynamic SEO sitemaps index...');
  try {
    const backupScript = path.join(process.cwd(), 'scratch', 'backup_supabase_data.mjs');
    if (fs.existsSync(backupScript)) {
      console.log(`   📡 Syncing updates to offline backups...`);
      execSync(`node ${backupScript}`, { stdio: 'inherit' });
    }
    
    console.log(`   📡 Regenerating dynamic XML sitemap index...`);
    execSync('npx tsx scripts/generate-sitemap.ts', { stdio: 'inherit' });
    console.log('✅ Backups and sitemaps generated successfully!');
  } catch (err: any) {
    console.warn('⚠️ Backup sync warnings (non-fatal):', err.message);
  }

  console.log(`\n🎉 @${username} RAW UNEDITED AVATAR FULLY RESTORED AND INSTALLED! 🎉`);
}

main().catch(console.error);
