import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const allLeads = [
  { brand_name: 'Minimalist', website: 'https://beminimalist.co', category: 'Skincare', email: 'marketing@beminimalist.co', contact_name: 'Marketing Team' },
  { brand_name: 'Sugar Cosmetics', website: 'https://sugarcosmetics.com', category: 'Beauty', email: 'hello@sugarcosmetics.com', contact_name: 'Partnerships Team' },
  { brand_name: 'The Derma Co.', website: 'https://thedermaco.com', category: 'Skincare', email: 'care@thedermaco.com', contact_name: 'Marketing Team' },
  { brand_name: 'mCaffeine', website: 'https://mcaffeine.com', category: 'Wellness', email: 'partnerships@mcaffeine.com', contact_name: 'Brand Team' },
  { brand_name: 'Blue Tokai', website: 'https://bluetokaicoffee.com', category: 'Food & Coffee', email: 'partnerships@bluetokaicoffee.com', contact_name: 'Marketing Team' },
  { brand_name: 'Plum Goodness', website: 'https://plumgoodness.com', category: 'Beauty', email: 'hello@plumgoodness.com', contact_name: 'Marketing Team' },
  { brand_name: 'Mamaearth', website: 'https://mamaearth.in', category: 'Wellness', email: 'care@mamaearth.in', contact_name: 'Marketing Team' },
  { brand_name: 'Bombay Shaving Co.', website: 'https://bombayshavingcompany.com', category: 'Grooming', email: 'care@bombayshavingcompany.com', contact_name: 'Brand Team' },
  { brand_name: 'Sleepy Owl', website: 'https://sleepyowl.co', category: 'Food & Coffee', email: 'hello@sleepyowl.co', contact_name: 'Marketing Team' },
  { brand_name: 'Dot & Key', website: 'https://dotandkey.com', category: 'Skincare', email: 'care@dotandkey.com', contact_name: 'Marketing Team' }
];

async function updateAndPopulate() {
    console.log('🚀 Updating leads to REAL emails and adding new brands...');
    
    // 1. Delete the test leads (using brand names as identifiers for safety)
    const brandNames = allLeads.map(l => l.brand_name);
    await supabase.from('brand_leads').delete().in('brand_name', brandNames);
    
    // 2. Insert all 10 real leads
    const { data, error } = await supabase
        .from('brand_leads')
        .insert(allLeads);

    if (error) {
        console.error('❌ Error updating leads:', error.message);
        return;
    }

    console.log('✅ Successfully populated 10 LIVE leads with real brand emails.');
}

updateAndPopulate();
