import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// The exact list of 13 Indian pet brands for @jimmyandgypsy
const jimmyOnlyBrands = [
  "Rav's Pet Kitchen",
  "Tell Tails",
  "Blep World",
  "Nimyle",
  "Boltz Petcare",
  "Lickies Pet Munchies",
  "Furlicks",
  "Indihop Shop",
  "The Barkery Nagpur",
  "Whole Woofs",
  "Fresh Waggs",
  "Sol & Sky Petcare",
  "Heads Up For Tails"
];

const jimmyOnlyLogos = [
  "https://logo.clearbit.com/ravspetkitchen.com",
  "https://logo.clearbit.com/telltails.in",
  "https://logo.clearbit.com/blep.world",
  "https://logo.clearbit.com/itcportal.com", // Nimyle / ITC
  "https://logo.clearbit.com/boltz.in",
  "https://logo.clearbit.com/lickies.in",
  "https://logo.clearbit.com/furlicks.in",
  "https://logo.clearbit.com/indihop.in",
  "https://logo.clearbit.com/barkery.in",
  "https://logo.clearbit.com/wholewoofs.com",
  "https://logo.clearbit.com/freshwaggs.com",
  "https://logo.clearbit.com/solandsky.com",
  "https://logo.clearbit.com/headsupfortails.com"
];

async function main() {
  console.log('🔄 Adjusting pet creator profiles based on corrected specifications...');

  // 1. Revert @phiphi.theshihtzu to original (0 past brands)
  console.log('🐕 Reverting @phiphi.theshihtzu past brands to original...');
  const { error: errorPhiPhi } = await supabase
    .from('profiles')
    .update({
      past_brands: [],
      brand_logos: [],
      past_brand_count: 0,
      collab_brands_count_override: 0
    })
    .eq('username', 'phiphi.theshihtzu');

  if (errorPhiPhi) {
    console.error('❌ Failed to revert PhiPhi:', errorPhiPhi.message);
  } else {
    console.log('✅ PhiPhi successfully reverted.');
  }

  // 2. Revert @dr.shree.in to original (1 past brand: Sheba)
  console.log('🩺 Reverting @dr.shree.in past brands to original (Sheba only)...');
  const { error: errorShree } = await supabase
    .from('profiles')
    .update({
      past_brands: ['Sheba'],
      brand_logos: [],
      past_brand_count: 1,
      collab_brands_count_override: 1
    })
    .eq('username', 'dr.shree.in');

  if (errorShree) {
    console.error('❌ Failed to revert Dr. Shree:', errorShree.message);
  } else {
    console.log('✅ Dr. Shree successfully reverted.');
  }

  // 3. Update @jimmyandgypsy to have ONLY the 13 specified brands
  console.log('🐾 Updating @jimmyandgypsy to have ONLY the 13 specified brand collaborations...');
  const { error: errorJimmy } = await supabase
    .from('profiles')
    .update({
      past_brands: jimmyOnlyBrands,
      brand_logos: jimmyOnlyLogos,
      past_brand_count: jimmyOnlyBrands.length,
      collab_brands_count_override: jimmyOnlyBrands.length
    })
    .eq('username', 'jimmyandgypsy');

  if (errorJimmy) {
    console.error('❌ Failed to update @jimmyandgypsy:', errorJimmy.message);
  } else {
    console.log('✅ @jimmyandgypsy successfully updated with exactly 13 brand collaborations.');
  }

  console.log('\n✨ Pet creator profile brand configurations updated perfectly!');
}

main().catch(err => {
  console.error('Unhandled error in script:', err);
  process.exit(1);
});
