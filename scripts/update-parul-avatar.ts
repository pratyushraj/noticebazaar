import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

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
  const username = 'parulsinghrajputt';
  const avatarUrl = 'https://scontent.cdninstagram.com/v/t51.82787-19/701409413_18099934910088210_2625049194873110040_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=104&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=KEjyuTZRjxoQ7kNvwH3Fq9u&_nc_oc=Adp5TnVbs_N9PkDM_J0c8rXPlpqEiRzi2yyRoz4bHKbnznF_zOybnNP2Xxw2LeSIQmpQuE0oo5OFkGm8_Lfr-Tj_&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_gid=9njvsIlQFfoYFnyIqLqd-w&_nc_ss=7b6a8&oh=00_Af7R_w1sm7aJjM051gDPJ0KWzcD-apRw_eRsObuZYI-mTQ&oe=6A1F208C';

  console.log(`📥 Downloading live unedited avatar for @${username}...`);
  const fetchRes = await fetch(avatarUrl);
  if (!fetchRes.ok) {
    throw new Error(`Failed to download avatar: ${fetchRes.statusText}`);
  }
  const downloadedBuffer = await fetchRes.buffer();
  console.log('✅ Successfully downloaded avatar buffer!');

  console.log('📤 Uploading original high-res avatar to creator-assets bucket...');
  const avatarStoragePath = `${username}/avatar_perfect_final_${Date.now()}.png`;
  
  const { error: uploadError } = await supabase.storage
    .from('creator-assets')
    .upload(avatarStoragePath, downloadedBuffer, {
      contentType: 'image/png',
      upsert: true
    });
    
  if (uploadError) throw uploadError;
  const avatarPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/creator-assets/${avatarStoragePath}`;
  console.log(`✅ Avatar CDN URL generated: ${avatarPublicUrl}`);
  
  // Update profiles table in Supabase
  console.log('📡 Updating database profiles table...');
  const { error: dbError } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarPublicUrl,
      instagram_profile_photo: avatarPublicUrl
    })
    .eq('username', username);
    
  if (dbError) throw dbError;
  console.log('✅ Database profile avatar updated successfully!');
  
  // Sync local sitemaps and backups
  try {
    const backupScript = path.join(process.cwd(), 'scratch', 'backup_supabase_data.mjs');
    if (fs.existsSync(backupScript)) {
      console.log(`   📡 Syncing updates to offline backups...`);
      execSync(`node ${backupScript}`, { stdio: 'inherit' });
    }
    console.log(`   📡 Regenerating dynamic XML sitemap index...`);
    execSync('npx tsx scripts/generate-sitemap.ts', { stdio: 'inherit' });
    console.log('✅ Local backups and sitemaps updated successfully!');
  } catch (syncErr: any) {
    console.warn('⚠️ Backup sync warning (non-fatal):', syncErr.message);
  }
  
  console.log(`\n🎉 @${username} RAW HIGH-RESOLUTION UNEDITED INSTAGRAM AVATAR SUCCESSFULLY RESTORED AND SYNCED! 🎉`);
}

main().catch(console.error);
