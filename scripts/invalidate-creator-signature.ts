/**
 * Invalidate Creator Signature Script
 * 
 * This script invalidates a creator signature for testing purposes.
 * It can either delete the signature or mark it as unsigned.
 * 
 * Usage:
 *   npx tsx scripts/invalidate-creator-signature.ts [deal-id]
 * 
 * Or with environment variables:
 *   SUPABASE_URL=your_url SUPABASE_SERVICE_KEY=your_key npx tsx scripts/invalidate-creator-signature.ts [deal-id]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Get deal ID from command line argument or use default from logs
const dealId = process.argv[2] || 'f57086bd-d53c-4223-a370-923bc85181b9';

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function invalidateCreatorSignature() {
  console.log('🔧 Invalidating creator signature for testing...\n');
  console.log(`📋 Deal ID: ${dealId}\n`);

  try {
    // Step 1: Find the creator signature
    console.log('🔍 Searching for creator signature...');
    const { data: signatures, error: fetchError } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('deal_id', dealId)
      .eq('signer_role', 'creator');

    if (fetchError) {
      console.error('❌ Error fetching signatures:', fetchError);
      process.exit(1);
    }

    if (!signatures || signatures.length === 0) {
      console.log('ℹ️  No creator signature found for this deal.');
      console.log('   The "Sign as Creator" button should already be visible.\n');
      process.exit(0);
    }

    const signature = signatures[0];
    console.log(`✅ Found creator signature:`);
    console.log(`   ID: ${signature.id}`);
    console.log(`   Signer: ${signature.signer_name} (${signature.signer_email})`);
    console.log(`   Signed: ${signature.signed}`);
    console.log(`   Signed At: ${signature.signed_at || 'N/A'}\n`);

    // Step 2: Ask what to do (for now, we'll delete it)
    console.log('🗑️  Deleting creator signature...');
    const { error: deleteError } = await supabase
      .from('contract_signatures')
      .delete()
      .eq('id', signature.id);

    if (deleteError) {
      console.error('❌ Error deleting signature:', deleteError);
      
      // If delete fails, try to mark as unsigned instead
      console.log('\n🔄 Attempting to mark signature as unsigned instead...');
      const { error: updateError } = await supabase
        .from('contract_signatures')
        .update({ 
          signed: false,
          signed_at: null,
          otp_verified: false,
          otp_verified_at: null
        })
        .eq('id', signature.id);

      if (updateError) {
        console.error('❌ Error updating signature:', updateError);
        process.exit(1);
      }

      console.log('✅ Signature marked as unsigned (signed = false)');
    } else {
      console.log('✅ Creator signature deleted successfully');
    }

    console.log('\n✨ Done! The "Sign as Creator" button should now be visible.');
    console.log('   Refresh the page to see the changes.\n');

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script
invalidateCreatorSignature();

