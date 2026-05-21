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

// Define brand info cataloging (Name and Domain/Logo)
const brandCatalog = {
  ravspetkitchen: { name: "Rav's Pet Kitchen", logo: 'https://logo.clearbit.com/ravspetkitchen.com' },
  tell_tails_: { name: 'Tell Tails', logo: 'https://logo.clearbit.com/telltails.in' },
  blep_world: { name: 'Blep World', logo: 'https://logo.clearbit.com/blep.world' },
  nimyleofficial: { name: 'Nimyle', logo: 'https://logo.clearbit.com/itcportal.com' }, // ITC brand
  boltzpetcare: { name: 'Boltz Petcare', logo: 'https://logo.clearbit.com/boltz.in' },
  lickies_petmunchies: { name: 'Lickies Pet Munchies', logo: 'https://logo.clearbit.com/lickies.in' },
  furlicks: { name: 'Furlicks', logo: 'https://logo.clearbit.com/furlicks.in' },
  indihopshop: { name: 'Indihop Shop', logo: 'https://logo.clearbit.com/indihop.in' },
  barkery_ngp: { name: 'The Barkery Nagpur', logo: 'https://logo.clearbit.com/barkery.in' },
  wholewoofsofficial: { name: 'Whole Woofs', logo: 'https://logo.clearbit.com/wholewoofs.com' },
  freshwaggs: { name: 'Fresh Waggs', logo: 'https://logo.clearbit.com/freshwaggs.com' },
  solandsky_petcare: { name: 'Sol & Sky Petcare', logo: 'https://logo.clearbit.com/solandsky.com' },
  headsupfortails: { name: 'Heads Up For Tails', logo: 'https://logo.clearbit.com/headsupfortails.com' }
};

async function main() {
  console.log('🚀 Synchronizing past brand collaborations for pet creators...');

  // 1. PhiPhi the Shih Tzu Updates
  const phiphiBrands = [
    brandCatalog.headsupfortails.name,
    brandCatalog.furlicks.name,
    brandCatalog.blep_world.name,
    brandCatalog.lickies_petmunchies.name,
    brandCatalog.tell_tails_.name,
    brandCatalog.ravspetkitchen.name,
    brandCatalog.solandsky_petcare.name
  ];
  const phiphiLogos = [
    brandCatalog.headsupfortails.logo,
    brandCatalog.furlicks.logo,
    brandCatalog.blep_world.logo,
    brandCatalog.lickies_petmunchies.logo,
    brandCatalog.tell_tails_.logo
  ];

  console.log('🐕 Updating @phiphi.theshihtzu past collaborations...');
  const { error: errorPhiPhi } = await supabase
    .from('profiles')
    .update({
      past_brands: phiphiBrands,
      brand_logos: phiphiLogos,
      past_brand_count: phiphiBrands.length,
      collab_brands_count_override: phiphiBrands.length
    })
    .eq('username', 'phiphi.theshihtzu');

  if (errorPhiPhi) console.error('❌ Failed to update PhiPhi:', errorPhiPhi.message);
  else console.log('✅ PhiPhi successfully updated.');

  // 2. Dr. Shree Updates
  const shreeBrands = [
    brandCatalog.headsupfortails.name,
    brandCatalog.furlicks.name,
    brandCatalog.boltzpetcare.name,
    brandCatalog.nimyleofficial.name,
    brandCatalog.barkery_ngp.name,
    brandCatalog.tell_tails_.name,
    'Sheba' // Pre-existing
  ];
  const shreeLogos = [
    brandCatalog.headsupfortails.logo,
    brandCatalog.furlicks.logo,
    brandCatalog.boltzpetcare.logo,
    'https://logo.clearbit.com/sheba.com'
  ];

  console.log('🩺 Updating @dr.shree.in past collaborations...');
  const { error: errorShree } = await supabase
    .from('profiles')
    .update({
      past_brands: shreeBrands,
      brand_logos: shreeLogos,
      past_brand_count: shreeBrands.length,
      collab_brands_count_override: shreeBrands.length
    })
    .eq('username', 'dr.shree.in');

  if (errorShree) console.error('❌ Failed to update Dr. Shree:', errorShree.message);
  else console.log('✅ Dr. Shree successfully updated.');

  // 3. Jimmy Andgypsy Updates
  const jimmyBrands = [
    brandCatalog.headsupfortails.name,
    'Supertails',
    'Barkbox',
    'Royal Canin',
    brandCatalog.wholewoofsofficial.name,
    brandCatalog.freshwaggs.name,
    brandCatalog.indihopshop.name,
    brandCatalog.blep_world.name
  ];
  const jimmyLogos = [
    brandCatalog.headsupfortails.logo,
    'https://logo.clearbit.com/supertails.com',
    'https://logo.clearbit.com/barkbox.com',
    'https://logo.clearbit.com/royalcanin.com',
    brandCatalog.blep_world.logo
  ];

  console.log('🐾 Updating @jimmyandgypsy past collaborations...');
  const { error: errorJimmy } = await supabase
    .from('profiles')
    .update({
      past_brands: jimmyBrands,
      brand_logos: jimmyLogos,
      past_brand_count: jimmyBrands.length,
      collab_brands_count_override: jimmyBrands.length
    })
    .eq('username', 'jimmyandgypsy');

  if (errorJimmy) console.error('❌ Failed to update Jimmy Andgypsy:', errorJimmy.message);
  else console.log('✅ Jimmy Andgypsy successfully updated.');

  console.log('\n🎉 Past brand collaborations updated cleanly!');
}

main().catch(err => {
  console.error('Unhandled error in script:', err);
  process.exit(1);
});
