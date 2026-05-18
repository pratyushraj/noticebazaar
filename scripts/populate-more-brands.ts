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

const newBrands = [
  // APPAREL & FOOTWEAR
  { brand_name: 'Almo Wear', website: 'https://almowear.com', category: 'Apparel', email: 'hello@almowear.com', contact_name: 'Marketing Team' },
  { brand_name: 'Andamen', website: 'https://andamen.com', category: 'Apparel', email: 'care@andamen.com', contact_name: 'Marketing Team' },
  { brand_name: 'Flatheads', website: 'https://flatheads.in', category: 'Footwear/Apparel', email: 'hello@flatheads.in', contact_name: 'Partnerships Team' },
  { brand_name: "Neeman's", website: 'https://neemans.com', category: 'Footwear/Apparel', email: 'care@neemans.com', contact_name: 'Marketing Team' },
  { brand_name: 'Clovia', website: 'https://clovia.com', category: 'Apparel', email: 'care@clovia.com', contact_name: 'Marketing Team' },
  { brand_name: 'Zivame', website: 'https://zivame.com', category: 'Apparel', email: 'customercare@zivame.com', contact_name: 'Marketing Team' },
  { brand_name: 'Kaveri', website: 'https://bykaveri.com', category: 'Apparel', email: 'info@bykaveri.com', contact_name: 'Brand Team' },

  // FOOD, COFFEE, & DRINKS
  { brand_name: 'Bira 91', website: 'https://bira91.com', category: 'Food & Beverage', email: 'info@bira91.com', contact_name: 'Brand Team' },
  { brand_name: 'Chaayos', website: 'https://chaayos.com', category: 'Food & Beverage', email: 'care@chaayos.com', contact_name: 'Marketing Team' },
  { brand_name: 'Country Bean', website: 'https://countrybean.in', category: 'Food & Coffee', email: 'hello@countrybean.in', contact_name: 'Marketing Team' },
  { brand_name: 'Vahdam Teas', website: 'https://vahdam.com', category: 'Food & Beverage', email: 'support@vahdam.com', contact_name: 'Partnerships Team' },
  { brand_name: 'Gaurik Foods', website: 'https://gaurikfoods.com', category: 'Food & Beverage', email: 'info@gaurikfoods.com', contact_name: 'Marketing Team' },
  { brand_name: 'Gladful', website: 'https://gladful.in', category: 'Food & Snacks', email: 'hello@gladful.in', contact_name: 'Marketing Team' },
  { brand_name: 'Hesthetic', website: 'https://hesthetic.in', category: 'Food & Beverage', email: 'care@hesthetic.in', contact_name: 'Marketing Team' },

  // LIFESTYLE & HOME DECOR
  { brand_name: 'Daily Objects', website: 'https://dailyobjects.com', category: 'Lifestyle', email: 'support@dailyobjects.com', contact_name: 'Marketing Team' },
  { brand_name: 'Furtados', website: 'https://furtadosonline.com', category: 'Lifestyle', email: 'response@furtadosonline.com', contact_name: 'Marketing Team' },
  { brand_name: 'Chumbak', website: 'https://chumbak.com', category: 'Home/Lifestyle', email: 'help@chumbak.com', contact_name: 'Marketing Team' },
  { brand_name: 'Nicobar', website: 'https://nicobar.com', category: 'Home/Lifestyle', email: 'care@nicobar.com', contact_name: 'Marketing Team' },
  { brand_name: 'Sleepyhead', website: 'https://mysleepyhead.com', category: 'Home/Lifestyle', email: 'support@mysleepyhead.com', contact_name: 'Marketing Team' },
  { brand_name: 'Wakefit', website: 'https://wakefit.co', category: 'Home/Lifestyle', email: 'support@wakefit.co', contact_name: 'Marketing Team' },

  // PET CARE
  { brand_name: 'Heads Up For Tails', website: 'https://headsupfortails.com', category: 'Pet Care', email: 'hello@headsupfortails.com', contact_name: 'Marketing Team' },
  { brand_name: 'Wiggles', website: 'https://wiggles.in', category: 'Pet Care', email: 'support@wiggles.in', contact_name: 'Marketing Team' },
  { brand_name: 'Supertails', website: 'https://supertails.com', category: 'Pet Care', email: 'support@supertails.com', contact_name: 'Marketing Team' },
  { brand_name: 'Captain Zack', website: 'https://captainzack.in', category: 'Pet Care', email: 'info@captainzack.in', contact_name: 'Marketing Team' },

  // WELLNESS & HYGIENE
  { brand_name: 'Nua Woman', website: 'https://nuawoman.com', category: 'Wellness/Hygiene', email: 'care@nuawoman.com', contact_name: 'Marketing Team' },
  { brand_name: 'Traya Health', website: 'https://traya.health', category: 'Wellness/Health', email: 'customercare@traya.health', contact_name: 'Marketing Team' },
  { brand_name: 'The Man Company', website: 'https://themancompany.com', category: 'Grooming/Wellness', email: 'care@themancompany.com', contact_name: 'Marketing Team' },
  { brand_name: 'Ustraa', website: 'https://ustraa.com', category: 'Grooming/Wellness', email: 'help@ustraa.com', contact_name: 'Marketing Team' },

  // BEAUTY & SKINCARE
  { brand_name: 'Arata', website: 'https://arata.in', category: 'Skincare/Beauty', email: 'info@arata.in', contact_name: 'Marketing Team' },
  { brand_name: 'PureSense', website: 'https://puresense.co.in', category: 'Beauty/Skincare', email: 'support@puresense.co.in', contact_name: 'Marketing Team' },
  { brand_name: 'Kimirica', website: 'https://kimirica.shop', category: 'Beauty/Skincare', email: 'info@kimirica.shop', contact_name: 'Marketing Team' },
  { brand_name: 'Just Herbs', website: 'https://justherbs.in', category: 'Skincare/Beauty', email: 'support@justherbs.in', contact_name: 'Marketing Team' },
  { brand_name: 'Biobloom', website: 'https://biobloomonline.com', category: 'Skincare/Beauty', email: 'info@biobloomonline.com', contact_name: 'Marketing Team' },
  { brand_name: 'SoulTree', website: 'https://soultree.in', category: 'Skincare/Beauty', email: 'care@soultree.in', contact_name: 'Marketing Team' },
  { brand_name: 'Aroma Magic', website: 'https://aromamagic.com', category: 'Skincare/Beauty', email: 'support@aromamagic.com', contact_name: 'Marketing Team' },
  { brand_name: 'Organic Harvest', website: 'https://organicharvest.in', category: 'Skincare/Beauty', email: 'info@organicharvest.in', contact_name: 'Marketing Team' },
  { brand_name: 'Lotus Botanicals', website: 'https://lotusbotanicals.com', category: 'Skincare/Beauty', email: 'care@lotusbotanicals.com', contact_name: 'Marketing Team' },
  { brand_name: 'Ayuga', website: 'https://ayuga.in', category: 'Skincare/Beauty', email: 'care@ayuga.in', contact_name: 'Marketing Team' },
  { brand_name: 'Aqualogica', website: 'https://aqualogica.in', category: 'Skincare/Beauty', email: 'care@aqualogica.in', contact_name: 'Marketing Team' },
  { brand_name: 'BBlunt', website: 'https://bblunt.com', category: 'Haircare/Beauty', email: 'care@bblunt.com', contact_name: 'Marketing Team' },
  { brand_name: 'Bare Anatomy', website: 'https://bareanatomy.in', category: 'Haircare/Beauty', email: 'hello@bareanatomy.in', contact_name: 'Marketing Team' },
  { brand_name: 'The Moms Co', website: 'https://themomsco.com', category: 'Skincare/Baby Care', email: 'care@themomsco.com', contact_name: 'Marketing Team' },
  { brand_name: 'BabyChakra', website: 'https://babychakra.com', category: 'Skincare/Baby Care', email: 'care@babychakra.com', contact_name: 'Marketing Team' },
  { brand_name: "Dr. Sheth's", website: 'https://drsheths.com', category: 'Skincare/Beauty', email: 'support@drsheths.com', contact_name: 'Marketing Team' },
  { brand_name: 'Fixderma', website: 'https://fixderma.com', category: 'Skincare/Beauty', email: 'support@fixderma.com', contact_name: 'Marketing Team' },
  { brand_name: 'Derma Essentia', website: 'https://dermaessentia.com', category: 'Skincare/Beauty', email: 'info@dermaessentia.com', contact_name: 'Marketing Team' },
  { brand_name: "Re'equil", website: 'https://reequil.com', category: 'Skincare/Beauty', email: 'care@reequil.com', contact_name: 'Marketing Team' },
  { brand_name: 'St. Botanica', website: 'https://stbotanica.com', category: 'Skincare/Beauty', email: 'care@stbotanica.com', contact_name: 'Marketing Team' },
  { brand_name: 'Wow Skin Science', website: 'https://buywow.in', category: 'Skincare/Beauty', email: 'support@buywow.in', contact_name: 'Marketing Team' }
];

async function main() {
  console.log(`🚀 Seeding an additional ${newBrands.length} emerging D2C brand leads to the directory...`);
  
  try {
    // We insert the new brands directly to build a massive target list
    const { error: insertError } = await supabase
      .from('brand_leads')
      .insert(newBrands);

    if (insertError) throw insertError;
    console.log(`✅ Successfully appended all ${newBrands.length} new brand leads!`);

    // Verify row count
    const { count, error: countError } = await supabase
      .from('brand_leads')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    console.log(`\n🐾 Directory Audit:`);
    console.log(`- Seeded brand leads total count: ${count}`);
    console.log(`✨ Full Premium D2C Portfolio initialized successfully!`);

  } catch (err: any) {
    console.error('❌ Error during append seed:', err.message);
  }
}

main();
