import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

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
    console.log('🧪 Starting Hardened Discovery Tests...');

    try {
        // 1. Setup Test Data
        const { data: brand } = await supabase.from('profiles').select('id').eq('role', 'brand').limit(1).single();
        const { data: creator } = await supabase.from('profiles').select('id').eq('role', 'creator').limit(1).single();

        if (!brand || !creator) {
            console.error('❌ Could not find test users. Please ensure database has at least 1 brand and 1 creator.');
            return;
        }

        console.log(`Using users: Brand(${brand.id}), Creator(${creator.id})`);

        // Cleanup before tests
        await supabase.from('brand_swipes').delete().eq('brand_id', brand.id).eq('creator_id', creator.id);
        await supabase.from('creator_swipes').delete().eq('creator_id', creator.id).eq('brand_id', brand.id);
        await supabase.from('matches').delete().eq('brand_id', brand.id).eq('creator_id', creator.id);

        // --- TEST 1: Duplicate Swipe Deduplication ---
        console.log('\n[TEST 1] Duplicate Swipe Deduplication...');
        for (let i = 0; i < 5; i++) {
            await supabase.from('brand_swipes').upsert(
                { brand_id: brand.id, creator_id: creator.id, direction: 'right' },
                { onConflict: 'brand_id,creator_id' }
            );
        }
        const { data: bSwipes } = await supabase.from('brand_swipes').select('id').eq('brand_id', brand.id).eq('creator_id', creator.id);
        if (bSwipes?.length === 1) {
            console.log('✅ PASS: Only 1 record created for 5 swipes.');
        } else {
            console.error(`❌ FAIL: Created ${bSwipes?.length} records.`);
        }

        // --- TEST 2: Bidirectional Match ---
        console.log('\n[TEST 2] Bidirectional Match...');
        await supabase.from('creator_swipes').upsert(
            { creator_id: creator.id, brand_id: brand.id, direction: 'right' },
            { onConflict: 'creator_id,brand_id' }
        );
        const { data: match } = await supabase.from('matches').select('id').eq('brand_id', brand.id).eq('creator_id', creator.id).single();
        if (match) {
            console.log('✅ PASS: Match record created automatically.');
        } else {
            console.error('❌ FAIL: Match record not created.');
        }

        // --- TEST 3: Exactly Once Match ---
        console.log('\n[TEST 3] Exactly Once Match...');
        // Try creating another swipe which might trigger trigger again
        await supabase.from('brand_swipes').upsert(
            { brand_id: brand.id, creator_id: creator.id, direction: 'right' },
            { onConflict: 'brand_id,creator_id' }
        );
        const { data: allMatches } = await supabase.from('matches').select('id').eq('brand_id', brand.id).eq('creator_id', creator.id);
        if (allMatches?.length === 1) {
            console.log('✅ PASS: Still only 1 match record.');
        } else {
            console.error(`❌ FAIL: Found ${allMatches?.length} match records.`);
        }

        // --- TEST 4: Left Swipe State Correctness ---
        console.log('\n[TEST 4] Left Sweep State Persistence...');
        // Clean up
        await supabase.from('brand_swipes').delete().eq('brand_id', brand.id).eq('creator_id', creator.id);
        await supabase.from('brand_swipes').upsert({ brand_id: brand.id, creator_id: creator.id, direction: 'left' });
        const { data: leftResult } = await supabase.from('brand_swipes').select('direction').eq('brand_id', brand.id).single();
        if (leftResult?.direction === 'left') {
            console.log('✅ PASS: Left swipe persisted correctly.');
        } else {
            console.error('❌ FAIL: Direction mismatch.');
        }

        // --- TEST 5: Race Condition Simulation ---
        console.log('\n[TEST 5] Race Condition Check...');
        await supabase.from('matches').delete().eq('brand_id', brand.id).eq('creator_id', creator.id);
        
        // Rapid fire both sides
        await Promise.all([
            supabase.from('brand_swipes').upsert({ brand_id: brand.id, creator_id: creator.id, direction: 'right' }, { onConflict: 'brand_id,creator_id' }),
            supabase.from('creator_swipes').upsert({ creator_id: creator.id, brand_id: brand.id, direction: 'right' }, { onConflict: 'creator_id,brand_id' })
        ]);

        const { data: raceMatch } = await supabase.from('matches').select('id').eq('brand_id', brand.id).eq('creator_id', creator.id);
        if (raceMatch?.length === 1) {
            console.log('✅ PASS: Atomic match creation successful under race condition.');
        } else {
            console.error(`❌ FAIL: Found ${raceMatch?.length} matches after race.`);
        }

        console.log('\n🎉 ALL TESTS COMPLETED.');

    } catch (err) {
        console.error('❌ TEST RUNCRASHED:', err);
    }
}

runTests();
