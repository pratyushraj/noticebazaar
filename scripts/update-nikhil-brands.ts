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
  console.log(`🚀 Starting past brands update for @${username}...`);

  // Resolve profile ID by username
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (fetchError || !profile) {
    console.error('❌ Profile not found:', fetchError?.message || 'Profile is null');
    process.exit(1);
  }

  const userId = profile.id;
  console.log(`✅ Profile resolved. ID: ${userId}`);

  const pastBrands = [
    'Portronics',
    'Healthy Hey Nutrition',
    'Vastrado',
    'Warrior World',
    'Ankit V Kapoor',
    'The Men Thing',
    'Cove And Lane',
    'EUME',
    'Superkicks',
    'Subtle',
    'Rain Streetwear',
    'Paradyes',
    'Living Room by Kalsang',
    'ik0h0',
    'Nu Republic',
    'XTCY India',
    'The Timber Tribe',
    'CHRN',
    'Aquaminder'
  ];

  const brandCount = pastBrands.length;

  console.log(`📡 Updating past brands in Supabase profiles table for ${username}...`);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      past_brands: pastBrands,
      past_brand_count: brandCount,
      collab_brands_count_override: brandCount,
      past_work_added: true
    })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  console.log(`✅ Database profile successfully updated with ${brandCount} past brands!`);

  // Synchronize local backups and SEO sitemaps
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

  console.log(`\n🎉 @${username} PROFILE PAST BRANDS FULLY SYNCHRONIZED! 🎉`);
}

main().catch(console.error);
