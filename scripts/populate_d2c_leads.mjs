import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const brands = [
  {
    brand_name: 'Minimalist',
    website: 'https://beminimalist.co',
    category: 'Skincare',
    email: 'creatorarmour07@gmail.com', // Using your email for the first test batch
    contact_name: 'Team Minimalist'
  },
  {
    brand_name: 'Sugar Cosmetics',
    website: 'https://sugarcosmetics.com',
    category: 'Beauty',
    email: 'creatorarmour07@gmail.com',
    contact_name: 'Partnerships Team'
  },
  {
    brand_name: 'The Derma Co.',
    website: 'https://thedermaco.com',
    category: 'Skincare',
    email: 'creatorarmour07@gmail.com',
    contact_name: 'Marketing Team'
  },
  {
    brand_name: 'mCaffeine',
    website: 'https://mcaffeine.com',
    category: 'Wellness',
    email: 'creatorarmour07@gmail.com',
    contact_name: 'UGC Manager'
  },
  {
    brand_name: 'Blue Tokai',
    website: 'https://bluetokaicoffee.com',
    category: 'Food & Coffee',
    email: 'creatorarmour07@gmail.com',
    contact_name: 'Brand Team'
  }
];

async function populateLeads() {
    console.log('🚀 Populating brand leads...');
    
    // Check if table exists
    const { error: tableError } = await supabase.from('brand_leads').select('id').limit(1);
    if (tableError) {
        console.error('❌ Table "brand_leads" not found. Did you run the SQL in Supabase?');
        return;
    }

    const { data, error } = await supabase
        .from('brand_leads')
        .insert(brands);

    if (error) {
        console.error('❌ Error inserting leads:', error.message);
        return;
    }

    console.log('✅ Successfully added 5 test leads to brand_leads table.');
}

populateLeads();
