import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedInterests() {
  console.log('🚀 Seeding Creator Interests...');

  // 1. Get the Brand ID (Try different markers)
  let brandId: string | null = null;
  
  // Try by business name from the script
  const { data: byName } = await supabase
    .from('profiles')
    .select('id, business_name')
    .eq('business_name', 'Demo Brand Co')
    .eq('role', 'brand')
    .limit(1);

  if (byName && byName.length > 0) {
    brandId = byName[0].id;
    console.log(`📍 Found Brand by business name: ${byName[0].business_name} (${brandId})`);
  } else {
    // Try any brand
    const { data: anyBrand } = await supabase
      .from('profiles')
      .select('id, first_name')
      .eq('role', 'brand')
      .limit(1);
    
    if (anyBrand && anyBrand.length > 0) {
      brandId = anyBrand[0].id;
      console.log(`📍 Found alternative Brand: ${anyBrand[0].first_name} (${brandId})`);
    }
  }

  if (!brandId) {
    console.error('❌ Could not find any brand profile to seed interests for.');
    return;
  }

  // 2. Get the Seeded Vibe Creators
  const creatorUsernames = ['aria_tech', 'kaelan_fitness', 'maya_travels', 'marcus_style', 'elara_beauty'];
  const { data: creators, error: creatorError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', creatorUsernames);

  if (creatorError || !creators || creators.length === 0) {
    console.error('❌ Could not find seeded creators:', creatorError?.message);
    return;
  }

  console.log(`📍 Found ${creators.length} creators to seed interests from.`);

  // 3. Seed Right Swipes from Creators to the Brand
  for (const creator of creators) {
    console.log(`✍️ Seeding interest from @${creator.username}...`);
    const { error: swipeError } = await supabase
      .from('creator_swipes')
      .upsert({
        creator_id: creator.id,
        brand_id: brandId,
        direction: 'right',
        is_match: false
      }, { onConflict: 'creator_id, brand_id' });

    if (swipeError) {
      console.error(`❌ Error swiping for @${creator.username}:`, swipeError.message);
    } else {
      console.log(`✅ @${creator.username} swiped RIGHT on brand ${brandId}`);
    }
  }

  console.log('✨ Creator interests seeded successfully!');
}

seedInterests().catch(console.error);
