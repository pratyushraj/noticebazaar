import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';

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
  const username = 'lilboxoffashion';
  console.log(`🚀 Updating past brands for Tanya Narang (@${username})...`);

  // Target brands: RUHE, Frido, and Sansi Mayo
  const updates = {
    past_brands: ['RUHE', 'Frido', 'Sansi Mayo'],
    past_brand_count: 3,
    collab_brands_count_override: 3
  };

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('username', username);

    if (error) throw error;
    console.log(`\n✨ Past Brands Successfully Updated for Tanya Narang!`);
    console.log(`Brands: ${updates.past_brands.join(', ')}`);
    console.log(`🔗 Link: https://creatorarmour.com/${username}`);

    // Sync sitemaps and database backup offline
    try {
      const backupScript = join(process.cwd(), 'scratch', 'backup_supabase_data.mjs');
      if (fs.existsSync(backupScript)) {
        console.log(`   📡 Syncing updates to offline backups...`);
        execSync(`node ${backupScript}`, { stdio: 'inherit' });
      }
      
      console.log(`   📡 Regenerating dynamic XML sitemap index...`);
      execSync('npx tsx scripts/generate-sitemap.ts', { stdio: 'inherit' });
      console.log('✅ Backups and sitemaps generated successfully!');
    } catch (syncErr: any) {
      console.warn('⚠️ Backup sync warnings (non-fatal):', syncErr.message);
    }

  } catch (error: any) {
    console.error('❌ Failed to update past brands:', error.message);
  }
}

main();
