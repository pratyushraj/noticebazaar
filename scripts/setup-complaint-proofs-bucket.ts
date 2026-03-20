#!/usr/bin/env tsx
/**
 * Setup complaint-proofs storage bucket and policies via Supabase Management API
 * 
 * Usage:
 *   tsx scripts/setup-complaint-proofs-bucket.ts
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('');
  console.error('Please set these in .env.local or .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createBucket() {
  console.log('📦 Creating complaint-proofs bucket...');

  try {
    // Create bucket via Storage API
    const { data, error } = await supabase.storage.createBucket('complaint-proofs', {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('✅ Bucket already exists, skipping creation');
        return true;
      }
      throw error;
    }

    console.log('✅ Bucket created successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to create bucket:', error.message);
    
    // Try alternative: Create via SQL
    console.log('🔄 Trying alternative method via SQL...');
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
          VALUES (
            'complaint-proofs',
            'complaint-proofs',
            false,
            5242880,
            ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[]
          )
          ON CONFLICT (id) DO UPDATE
          SET 
            public = false,
            file_size_limit = 5242880,
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[];
        `,
      });

      if (sqlError) {
        console.error('❌ SQL method also failed:', sqlError.message);
        console.log('');
        console.log('💡 Please create the bucket manually via Supabase Dashboard:');
        console.log('   1. Go to Storage → Buckets → New bucket');
        console.log('   2. Name: complaint-proofs');
        console.log('   3. Public: Unchecked');
        console.log('   4. File size limit: 5MB');
        console.log('   5. Allowed MIME types: image/jpeg, image/png, image/jpg, application/pdf');
        return false;
      }

      console.log('✅ Bucket created via SQL');
      return true;
    } catch (sqlErr: any) {
      console.error('❌ All methods failed');
      return false;
    }
  }
}

async function createPolicies() {
  console.log('');
  console.log('🔒 Creating storage policies...');

  const policies = [
    {
      name: 'Users can upload complaint proofs',
      operation: 'INSERT',
      check: `bucket_id = 'complaint-proofs' AND (storage.foldername(name))[1] = auth.uid()::text`,
    },
    {
      name: 'Users can read their own complaint proofs',
      operation: 'SELECT',
      using: `bucket_id = 'complaint-proofs' AND (storage.foldername(name))[1] = auth.uid()::text`,
    },
    {
      name: 'Lawyers can read all complaint proofs',
      operation: 'SELECT',
      using: `bucket_id = 'complaint-proofs' AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('lawyer', 'admin')
      )`,
    },
  ];

  console.log('');
  console.log('⚠️  Storage policies cannot be created via API (permissions required)');
  console.log('   Please create them manually via Supabase Dashboard or SQL Editor');
  console.log('');
  console.log('📋 Policy SQL to run in Supabase Dashboard SQL Editor:');
  console.log('');
  
  for (const policy of policies) {
    // Build SQL for policy
    let sql = `-- Policy: ${policy.name}\n`;
    sql += `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;\n`;
    sql += `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.operation} TO authenticated`;
    
    if (policy.using) {
      sql += `\n  USING (${policy.using})`;
    }
    
    if (policy.check) {
      sql += `\n  WITH CHECK (${policy.check})`;
    }
    sql += ';';
    
    console.log(sql);
    console.log('');
  }
  
  console.log('💡 Copy the SQL above and run it in:');
  console.log('   Supabase Dashboard → SQL Editor → New Query');
}

async function main() {
  console.log('🚀 Setting up complaint-proofs storage bucket...');
  console.log('');

  const bucketCreated = await createBucket();
  
  if (bucketCreated) {
    await createPolicies();
  }

  console.log('');
  console.log('✅ Setup complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Verify bucket exists: Supabase Dashboard → Storage → Buckets');
  console.log('   2. Verify policies: Storage → Buckets → complaint-proofs → Policies');
  console.log('   3. Test upload via complaint form');
  console.log('');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

