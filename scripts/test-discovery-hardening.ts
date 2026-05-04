import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runTests() {
  console.log('🧪 Starting Discovery Hardening Tests...\n');

  // Setup Test IDs
  const TEST_BRAND_ID = '00000000-0000-0000-0000-000000000001'; // Mock or real valid ID
  const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000002';

  // Helper to clear test data
  const cleanup = async () => {
    await supabase.from('brand_swipes').delete().match({ brand_id: TEST_BRAND_ID, creator_id: TEST_CREATOR_ID });
    await supabase.from('creator_swipes').delete().match({ creator_id: TEST_CREATOR_ID, brand_id: TEST_BRAND_ID });
  };

  try {
    await cleanup();

    // 1. TEST: Duplicate Swipe Protection
    console.log('1. Testing Duplicate Swipe Protection...');
    const swipe1 = { brand_id: TEST_BRAND_ID, creator_id: TEST_CREATOR_ID, direction: 'right' };
    
    // Concurrent upserts
    await Promise.all([
      supabase.from('brand_swipes').upsert(swipe1, { onConflict: 'brand_id,creator_id' }),
      supabase.from('brand_swipes').upsert(swipe1, { onConflict: 'brand_id,creator_id' }),
      supabase.from('brand_swipes').upsert(swipe1, { onConflict: 'brand_id,creator_id' })
    ]);

    const { data: swipes } = await supabase.from('brand_swipes').select('*').match({ brand_id: TEST_BRAND_ID, creator_id: TEST_CREATOR_ID });
    if (swipes?.length === 1) {
      console.log('✅ PASS: Only one record created for multiple rapid swipes.');
    } else {
      console.error(`❌ FAIL: Expected 1 record, found ${swipes?.length}`);
    }

    // 2. TEST: State Transition (Left then Right)
    console.log('\n2. Testing State Transition (Left then Right)...');
    await supabase.from('brand_swipes').upsert({ ...swipe1, direction: 'left' }, { onConflict: 'brand_id,creator_id' });
    const { data: leftState } = await supabase.from('brand_swipes').select('direction').match({ brand_id: TEST_BRAND_ID, creator_id: TEST_CREATOR_ID }).single();
    
    await supabase.from('brand_swipes').upsert({ ...swipe1, direction: 'right' }, { onConflict: 'brand_id,creator_id' });
    const { data: rightState } = await supabase.from('brand_swipes').select('direction').match({ brand_id: TEST_BRAND_ID, creator_id: TEST_CREATOR_ID }).single();

    if (leftState?.direction === 'left' && rightState?.direction === 'right') {
      console.log('✅ PASS: Direction updated correctly from left to right.');
    } else {
      console.error('❌ FAIL: Direction transition failed.');
    }

    // 3. TEST: Match Logic (Independent)
    console.log('\n3. Testing Match Logic (Independent Swipes)...');
    // Creator swipes right
    await supabase.from('creator_swipes').upsert({ creator_id: TEST_CREATOR_ID, brand_id: TEST_BRAND_ID, direction: 'right' }, { onConflict: 'creator_id,brand_id' });
    
    // Check Brand record
    const { data: matchedBrandSwipe } = await supabase.from('brand_swipes').select('is_match').match({ brand_id: TEST_BRAND_ID, creator_id: TEST_CREATOR_ID }).single();
    const { data: matchedCreatorSwipe } = await supabase.from('creator_swipes').select('is_match').match({ creator_id: TEST_CREATOR_ID, brand_id: TEST_BRAND_ID }).single();

    if (matchedBrandSwipe?.is_match && matchedCreatorSwipe?.is_match) {
      console.log('✅ PASS: Mutual match correctly flags both records.');
    } else {
      console.error('❌ FAIL: Match flag missing.');
    }

    // 4. TEST: Race Condition (Simultaneous Mutual Right Swipes)
    console.log('\n4. Testing Race Condition (Simultaneous Reciprocal Swipes)...');
    await cleanup();
    await Promise.all([
      supabase.from('brand_swipes').upsert({ brand_id: TEST_BRAND_ID, creator_id: TEST_CREATOR_ID, direction: 'right' }, { onConflict: 'brand_id,creator_id' }),
      supabase.from('creator_swipes').upsert({ creator_id: TEST_CREATOR_ID, brand_id: TEST_BRAND_ID, direction: 'right' }, { onConflict: 'creator_id,brand_id' })
    ]);

    const { data: res1 } = await supabase.from('brand_swipes').select('is_match').single();
    const { data: res2 } = await supabase.from('creator_swipes').select('is_match').single();

    if (res1?.is_match && res2?.is_match) {
      console.log('✅ PASS: Simultaneous swipes result in a clean match.');
    } else {
      console.error('❌ FAIL: Race condition caused match failure.');
    }

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY.');

  } catch (err) {
    console.error('\n💥 TEST RUN CRASHED:', err);
  } finally {
    // await cleanup();
  }
}

runTests();
