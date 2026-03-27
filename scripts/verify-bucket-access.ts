/**
 * Script to verify Supabase Storage bucket configuration
 * Run with: npx tsx scripts/verify-bucket-access.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyBucket() {
  console.log('🔍 Verifying creator-assets bucket configuration...\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    const bucket = buckets?.find(b => b.id === 'creator-assets');
    
    if (!bucket) {
      console.error('❌ Bucket "creator-assets" not found!');
      console.log('\nAvailable buckets:');
      buckets?.forEach(b => console.log(`  - ${b.id} (public: ${b.public})`));
      return;
    }

    console.log('✅ Bucket "creator-assets" exists');
    console.log(`   Public: ${bucket.public ? '✅ Yes' : '❌ No (needs to be public!)'}`);
    console.log(`   File size limit: ${bucket.file_size_limit ? `${bucket.file_size_limit / 1024 / 1024}MB` : 'Unlimited'}`);

    // Check if bucket is public
    if (!bucket.public) {
      console.log('\n⚠️  WARNING: Bucket is not public!');
      console.log('   Fix: Go to Supabase Dashboard → Storage → Buckets → creator-assets');
      console.log('   Check "Public bucket" and save.');
    }

    // Try to list files (requires proper RLS)
    const { data: files, error: filesError } = await supabase.storage
      .from('creator-assets')
      .list('', { limit: 1 });

    if (filesError) {
      console.log('\n⚠️  Could not list files:', filesError.message);
      console.log('   This might be due to RLS policies. Check policies in Supabase Dashboard.');
    } else {
      console.log(`\n✅ Can access bucket (found ${files?.length || 0} files in root)`);
    }

    // Check RLS policies (requires service role key)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n📋 Checking RLS policies...');
      // Note: Direct policy queries require admin access
      console.log('   (Check policies manually in Supabase Dashboard → Storage → Policies)');
      console.log('   Required policies:');
      console.log('   1. "Users can upload their own files" (INSERT)');
      console.log('   2. "Users can read their own files" (SELECT)');
      console.log('   3. "Users can update their own files" (UPDATE)');
      console.log('   4. "Users can delete their own files" (DELETE)');
      console.log('   5. "Public can read files" (SELECT) ← Critical for public URLs!');
    }

    console.log('\n✅ Verification complete!');
    
    if (!bucket.public) {
      console.log('\n🔧 Action required: Make bucket public in Supabase Dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyBucket();

