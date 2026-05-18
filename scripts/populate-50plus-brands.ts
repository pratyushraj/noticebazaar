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

const brands = [
  // FOOD, COFFEE, & SNACKS
  { brand_name: 'Beyond Snack', website: 'https://beyondsnack.in', category: 'Food & Snacks', email: 'marketing@beyondsnack.in', contact_name: 'Marketing Team' },
  { brand_name: 'The Whole Truth', website: 'https://thewholetruthfoods.com', category: 'Food & Wellness', email: 'hello@thewholetruthfoods.com', contact_name: 'Partnerships Team' },
  { brand_name: 'Open Secret', website: 'https://opensecret.in', category: 'Food & Snacks', email: 'care@opensecret.in', contact_name: 'Marketing Team' },
  { brand_name: 'Slurrp Farm', website: 'https://slurrpfarm.com', category: 'Kids Food', email: 'hello@slurrpfarm.com', contact_name: 'Partnerships Team' },
  { brand_name: 'TagZ Foods', website: 'https://tagzfoods.com', category: 'Food & Snacks', email: 'hello@tagzfoods.com', contact_name: 'Brand Team' },
  { brand_name: 'To Be Honest (TBH)', website: 'https://tobehonest.in', category: 'Food & Snacks', email: 'hello@tobehonest.in', contact_name: 'Partnerships Team' },
  { brand_name: 'Snackible', website: 'https://snackible.com', category: 'Food & Snacks', email: 'support@snackible.com', contact_name: 'Marketing Team' },
  { brand_name: 'Happilo', website: 'https://happilo.com', category: 'Food & Snacks', email: 'support@happilo.com', contact_name: 'Partnerships Team' },
  { brand_name: 'Beanly', website: 'https://beanlycoffee.com', category: 'Food & Coffee', email: 'hello@beanlycoffee.com', contact_name: 'Brand Team' },
  { brand_name: 'Rage Coffee', website: 'https://ragecoffee.com', category: 'Food & Coffee', email: 'hello@ragecoffee.com', contact_name: 'Marketing Team' },
  { brand_name: 'Sleepy Owl', website: 'https://sleepyowl.co', category: 'Food & Coffee', email: 'hello@sleepyowl.co', contact_name: 'Marketing Team' },
  { brand_name: 'Blue Tokai', website: 'https://bluetokaicoffee.com', category: 'Food & Coffee', email: 'partnerships@bluetokaicoffee.com', contact_name: 'Marketing Team' },
  { brand_name: 'Country Delight', website: 'https://countrydelight.in', category: 'Dairy & F&B', email: 'info@countrydelight.in', contact_name: 'Marketing Team' },
  { brand_name: 'True Elements', website: 'https://trueelements.com', category: 'Food & Snacks', email: 'care@trueelements.com', contact_name: 'Partnerships Team' },
  { brand_name: 'FarmDidi', website: 'https://farmdidi.co', category: 'Food & Beverage', email: 'support@farmdidi.co', contact_name: 'Marketing Team' },
  { brand_name: 'Naturally Yours', website: 'https://naturallyyours.in', category: 'Food & Beverage', email: 'support@naturallyyours.in', contact_name: 'Marketing Team' },
  { brand_name: 'Healthy Master', website: 'https://healthymaster.in', category: 'Food & Beverage', email: 'support@healthymaster.in', contact_name: 'Marketing Team' },
  { brand_name: 'Makhana Break', website: 'https://makhanabreak.com', category: 'Food & Beverage', email: 'info@makhanabreak.com', contact_name: 'Marketing Team' },
  { brand_name: 'Crispy Makhana', website: 'https://crispymakhana.com', category: 'Food & Beverage', email: 'sales@crispymakhana.com', contact_name: 'Marketing Team' },
  { brand_name: 'Makhanix', website: 'https://makhanix.com', category: 'Food & Beverage', email: 'hello@makhanix.com', contact_name: 'Marketing Team' },
  { brand_name: 'Widour', website: 'https://widour.com', category: 'Food & Beverage', email: 'info@widour.com', contact_name: 'Marketing Team' },
  { brand_name: 'Beyond Food', website: 'https://beyondfood.in', category: 'Food & Beverage', email: 'hello@beyondfood.in', contact_name: 'Marketing Team' },

  // WELLNESS & AYURVEDA
  { brand_name: 'Kapiva', website: 'https://kapiva.in', category: 'Wellness/Ayurveda', email: 'info@kapiva.in', contact_name: 'Partnerships Team' },
  { brand_name: 'Nirogam', website: 'https://nirogam.com', category: 'Wellness/Ayurveda', email: 'info@nirogam.com', contact_name: 'Marketing Team' },
  { brand_name: 'Oziva', website: 'https://oziva.in', category: 'Wellness/Nutrition', email: 'care@oziva.in', contact_name: 'Marketing Team' },
  { brand_name: 'Bold Care', website: 'https://boldcare.in', category: 'Wellness/Personal Care', email: 'support@boldcare.in', contact_name: 'Partnerships Team' },
  { brand_name: 'Man Matters', website: 'https://manmatters.com', category: 'Wellness/Personal Care', email: 'support@manmatters.com', contact_name: 'Marketing Team' },
  { brand_name: 'Gynoveda', website: 'https://gynoveda.com', category: 'Wellness/Ayurveda', email: 'care@gynoveda.com', contact_name: 'Marketing Team' },
  { brand_name: 'Cosmix', website: 'https://cosmix.in', category: 'Wellness', email: 'hello@cosmix.in', contact_name: 'Brand Team' },
  { brand_name: 'Auric', website: 'https://theauric.com', category: 'Wellness/Beverage', email: 'care@theauric.com', contact_name: 'Marketing Team' },

  // SKINCARE & BEAUTY
  { brand_name: 'Minimalist', website: 'https://beminimalist.co', category: 'Skincare', email: 'marketing@beminimalist.co', contact_name: 'Marketing Team' },
  { brand_name: 'Plum Goodness', website: 'https://plumgoodness.com', category: 'Beauty', email: 'hello@plumgoodness.com', contact_name: 'Marketing Team' },
  { brand_name: 'Dot & Key', website: 'https://dotandkey.com', category: 'Skincare', email: 'care@dotandkey.com', contact_name: 'Marketing Team' },
  { brand_name: 'Earth Rhythm', website: 'https://earthrhythm.com', category: 'Skincare', email: 'support@earthrhythm.com', contact_name: 'Marketing Team' },
  { brand_name: 'Juicy Chemistry', website: 'https://juicychemistry.com', category: 'Skincare', email: 'support@juicychemistry.com', contact_name: 'Partnerships Team' },
  { brand_name: 'Pilgrim', website: 'https://discoverpilgrim.com', category: 'Skincare', email: 'hello@discoverpilgrim.com', contact_name: 'Marketing Team' },
  { brand_name: 'Chemist at Play', website: 'https://chemistatplay.com', category: 'Skincare', email: 'care@chemistatplay.com', contact_name: 'Partnerships Team' },
  { brand_name: 'Foxtale', website: 'https://foxtale.in', category: 'Skincare', email: 'info@foxtale.in', contact_name: 'Marketing Team' },
  { brand_name: 'Suganda', website: 'https://suganda.co', category: 'Skincare', email: 'support@suganda.co', contact_name: 'Marketing Team' },
  { brand_name: 'WishCare', website: 'https://mywishcare.com', category: 'Skincare', email: 'info@mywishcare.com', contact_name: 'Marketing Team' },
  { brand_name: 'Conscious Chemist', website: 'https://consciouschemist.com', category: 'Skincare', email: 'support@consciouschemist.com', contact_name: 'Partnerships Team' },
  { brand_name: 'Deconstruct', website: 'https://thedeconstruct.in', category: 'Skincare', email: 'care@thedeconstruct.in', contact_name: 'Marketing Team' },

  // PET CARE
  { brand_name: 'TailBlaze', website: 'https://tailblaze.com', category: 'Pet Care', email: 'hello@tailblaze.com', contact_name: 'Marketing Team' },
  { brand_name: 'Pawpeye', website: 'https://pawpeye.com', category: 'Pet Care', email: 'pawpeye@gmail.com', contact_name: 'Marketing Team' },
  { brand_name: 'Dogkart', website: 'https://dogkart.in', category: 'Pet Care', email: 'support@dogkart.in', contact_name: 'Marketing Team' },
  { brand_name: "Ollie's Paw", website: 'https://olliespaw.com', category: 'Pet Care', email: 'hello@olliespaw.com', contact_name: 'Marketing Team' },
  { brand_name: 'RayTails', website: 'https://raytails.com', category: 'Pet Care', email: 'hello@raytails.com', contact_name: 'Marketing Team' },
  { brand_name: 'Venttura', website: 'https://venttura.in', category: 'Pet Care', email: 'info@venttura.in', contact_name: 'Marketing Team' },

  // HOME CARE & APPAREL
  { brand_name: 'Koparo', website: 'https://koparoclean.com', category: 'Home Care', email: 'info@koparoclean.com', contact_name: 'Marketing Team' },
  { brand_name: 'The Better Home', website: 'https://thebetterhome.com', category: 'Home Care', email: 'care@thebetterhome.com', contact_name: 'Marketing Team' },
  { brand_name: 'Sleepycat', website: 'https://sleepycat.in', category: 'Home/Lifestyle', email: 'support@sleepycat.in', contact_name: 'Marketing Team' },
  { brand_name: 'Snitch', website: 'https://snitch.co.in', category: 'Apparel', email: 'support@snitch.co.in', contact_name: 'Partnerships Team' }
];

async function main() {
  console.log('🚀 Clearing existing brand leads to avoid duplicates...');
  
  try {
    const { error: deleteError } = await supabase
      .from('brand_leads')
      .delete()
      .neq('brand_name', 'TEST_LEAD_NEVER_DELETE'); // Keep structured schema intact

    if (deleteError) throw deleteError;
    console.log('✅ Cleaned up old leads.');

    console.log(`🚀 Seeding ${brands.length} real-world D2C brand leads...`);
    const { error: insertError } = await supabase
      .from('brand_leads')
      .insert(brands);

    if (insertError) throw insertError;
    console.log(`\n✨ Successfully inserted all ${brands.length} brand leads into the database!`);

    // Verify row count
    const { count, error: countError } = await supabase
      .from('brand_leads')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    console.log(`🐾 Database verified: ${count} total active brand leads loaded successfully.`);

  } catch (err: any) {
    console.error('❌ Error during brand seed:', err.message);
  }
}

main();
