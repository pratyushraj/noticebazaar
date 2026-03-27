// Script to delete old contract from Supabase storage
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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

// Extract file path from URL
const contractUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/safe-contracts/a64d8a6b-37c5-4201-8806-17eda1f55f5e/1766402464404_mellowprints_Rahul_Contract_v2_1766402464404.pdf';

// Parse the storage path
const urlMatch = contractUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
if (!urlMatch) {
  console.error('❌ Invalid contract URL format');
  process.exit(1);
}

const bucketName = urlMatch[1]; // 'creator-assets'
const filePath = decodeURIComponent(urlMatch[2].split('?')[0]); // 'safe-contracts/a64d8a6b-37c5-4201-8806-17eda1f55f5e/1766402464404_mellowprints_Rahul_Contract_v2_1766402464404.pdf'

console.log('🗑️  Deleting old contract file...');
console.log('   Bucket:', bucketName);
console.log('   Path:', filePath);

// Delete the file
const { data, error } = await supabase.storage
  .from(bucketName)
  .remove([filePath]);

if (error) {
  console.error('❌ Failed to delete file:', error);
  process.exit(1);
}

console.log('✅ Successfully deleted old contract file');
console.log('   Deleted files:', data);

