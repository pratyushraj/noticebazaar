// Script to list all contract files for a deal
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

console.log('📋 Listing contract files for deal:', dealId);
console.log('   Folder:', folderPath);

const { data: files, error } = await supabase.storage
  .from('creator-assets')
  .list(folderPath, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' }
  });

if (error) {
  console.error('❌ Failed to list files:', error);
  process.exit(1);
}

if (!files || files.length === 0) {
  console.log('✅ No contract files found in this folder');
} else {
  console.log(`\n📄 Found ${files.length} contract file(s):\n`);
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   Created: ${file.created_at}`);
    console.log(`   Size: ${file.metadata?.size || 'unknown'} bytes`);
    console.log('');
  });
}

