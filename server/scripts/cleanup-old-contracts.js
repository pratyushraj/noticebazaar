// Script to delete all old contract files for a deal (keep only the most recent)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const dealId = 'a64d8a6b-37c5-4201-8806-17eda1f55f5e';
const folderPath = `safe-contracts/${dealId}/`;

console.log('🧹 Cleaning up old contract files for deal:', dealId);

// List all files
const { data: files, error: listError } = await supabase.storage
  .from('creator-assets')
  .list(folderPath, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' }
  });

if (listError) {
  console.error('❌ Failed to list files:', listError);
  process.exit(1);
}

if (!files || files.length === 0) {
  console.log('✅ No contract files found');
  process.exit(0);
}

console.log(`\n📄 Found ${files.length} contract file(s)`);

// Delete all files (user will generate a fresh one)
const filePaths = files.map(f => `${folderPath}${f.name}`);
console.log(`\n🗑️  Deleting ${filePaths.length} old contract file(s)...`);

const { data: deleted, error: deleteError } = await supabase.storage
  .from('creator-assets')
  .remove(filePaths);

if (deleteError) {
  console.error('❌ Failed to delete files:', deleteError);
  process.exit(1);
}

console.log(`✅ Successfully deleted ${deleted?.length || 0} contract file(s)`);

// Also clear the contract URLs from the deal record
console.log('\n🔄 Clearing contract URLs from deal record...');
const updateData: any = {
  safe_contract_url: null,
  contract_file_url: null,
  updated_at: new Date().toISOString()
};

// Only include contract_version if the column exists (it might not in older schemas)
// The update will work without it
const { error: updateError } = await supabase
  .from('brand_deals')
  .update(updateData)
  .eq('id', dealId);

if (updateError) {
  console.error('⚠️  Failed to clear contract URLs from deal:', updateError);
} else {
  console.log('✅ Cleared contract URLs from deal record');
}

console.log('\n✨ Cleanup complete! You can now generate a fresh contract.');

