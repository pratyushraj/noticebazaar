// Test script to diagnose contract ready token creation issues
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Testing Contract Ready Token Creation...\n');
console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET');
console.log('Service Role Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT SET\n');

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

async function testTokenCreation() {
  try {
    // Step 1: Check if table exists
    console.log('1️⃣ Checking if contract_ready_tokens table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('contract_ready_tokens')
      .select('id')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
        console.error('❌ Table contract_ready_tokens does not exist!');
        console.error('   Run the migration: supabase/migrations/2025_12_22_create_contract_ready_tokens.sql');
        return;
      } else {
        console.error('❌ Error checking table:', tableError);
        return;
      }
    }
    console.log('✅ Table exists\n');

    // Step 2: Get a test deal
    console.log('2️⃣ Finding a test deal...');
    const { data: deals, error: dealsError } = await supabase
      .from('brand_deals')
      .select('id, creator_id')
      .limit(1);
    
    if (dealsError || !deals || deals.length === 0) {
      console.error('❌ No deals found or error:', dealsError);
      console.log('   Using dummy IDs for test...');
      const testDealId = '00000000-0000-0000-0000-000000000001';
      const testCreatorId = '00000000-0000-0000-0000-000000000002';
      
      // Step 3: Try to create a token
      console.log('\n3️⃣ Attempting to create token...');
      const { data: token, error: tokenError } = await supabase
        .from('contract_ready_tokens')
        .insert({
          deal_id: testDealId,
          created_by: testCreatorId,
          expires_at: null,
          is_active: true,
        })
        .select()
        .single();
      
      if (tokenError) {
        console.error('❌ Token creation failed:', tokenError);
        console.error('   Code:', tokenError.code);
        console.error('   Message:', tokenError.message);
        console.error('   Details:', tokenError.details);
        console.error('   Hint:', tokenError.hint);
        return;
      }
      
      console.log('✅ Token created successfully!');
      console.log('   Token ID:', token.id);
      
      // Clean up
      await supabase
        .from('contract_ready_tokens')
        .delete()
        .eq('id', token.id);
      console.log('✅ Test token cleaned up');
      return;
    }
    
    const testDeal = deals[0];
    console.log('✅ Found deal:', testDeal.id);
    console.log('   Creator ID:', testDeal.creator_id, '\n');
    
    // Step 3: Try to create a token
    console.log('3️⃣ Attempting to create token...');
    const { data: token, error: tokenError } = await supabase
      .from('contract_ready_tokens')
      .insert({
        deal_id: testDeal.id,
        created_by: testDeal.creator_id,
        expires_at: null,
        is_active: true,
      })
      .select()
      .single();
    
    if (tokenError) {
      console.error('❌ Token creation failed:');
      console.error('   Code:', tokenError.code);
      console.error('   Message:', tokenError.message);
      console.error('   Details:', tokenError.details);
      console.error('   Hint:', tokenError.hint);
      
      // Check RLS policies
      if (tokenError.code === '42501' || tokenError.message?.includes('permission denied')) {
        console.error('\n⚠️  RLS Policy Issue Detected!');
        console.error('   The service role key should bypass RLS, but it seems blocked.');
        console.error('   Check:');
        console.error('   1. Service role key is correct');
        console.error('   2. RLS policies allow service role access');
        console.error('   3. Migration has been applied');
      }
      return;
    }
    
    console.log('✅ Token created successfully!');
    console.log('   Token ID:', token.id);
    console.log('   Deal ID:', token.deal_id);
    console.log('   Created By:', token.created_by, '\n');
    
    // Step 4: Clean up
    console.log('4️⃣ Cleaning up test token...');
    const { error: deleteError } = await supabase
      .from('contract_ready_tokens')
      .delete()
      .eq('id', token.id);
    
    if (deleteError) {
      console.warn('⚠️  Could not delete test token:', deleteError.message);
    } else {
      console.log('✅ Test token cleaned up');
    }
    
    console.log('\n✅ All tests passed! Token creation should work.');
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
  }
}

testTokenCreation();

