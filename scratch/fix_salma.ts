
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      first_name: 'Salma',
      last_name: 'Khan',
      is_elite_verified: true,
      is_verified: true,
      past_brands: ['kbeauty', 'MARS', 'SWISS beauty', 'womancart', 'Mamaearth'],
      avg_rate_reel: 7000,
      story_price: 2000,
      suggested_reel_rate: 7000,
      suggested_paid_range_min: 7000,
      suggested_paid_range_max: 10500,
      avg_reel_views_manual: 60000,
      engagement_rate: 5.5,
      response_hours: 24,
      reliability_score: 98,
      collab_brands_count_override: 5,
      onboarding_complete: true
    })
    .eq('username', 'salma_stylebudget');
  
  if (error) console.error(error);
  else console.log('Successfully updated salma_stylebudget');

  // Also fix the other one to avoid confusion
  await supabase
    .from('profiles')
    .update({
      first_name: 'Salma',
      last_name: 'Khan',
      is_elite_verified: false
    })
    .eq('username', 'salmastyle');
}

update();
