import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMaheshProfile() {
  const username = 'photowalamusafir';
  console.log(`Updating profile for ${username}...`);

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (fetchError || !profile) {
    console.error('Creator not found or error fetching:', fetchError);
    return;
  }

  const updateData = {
    reel_price: 1500,
    story_price: 500,
    avg_rate_reel: 1500,
    barter_min_value: 2000,
    avg_reel_views_manual: 12000,
    engagement_rate: 4.8,
    response_hours: 2,
    reliability_score: 99,
    is_verified: true,
    is_elite_verified: true,
    onboarding_complete: true,
    past_brands: ['Samsung', 'Sony', 'Canon', 'GoPro'],
    deal_templates: [],
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData as any)
    .eq('id', profile.id);

  if (updateError) {
    console.error('Error updating profile:', updateError);
  } else {
    console.log('✅ Mahesh profile updated successfully with Elite metrics and specific rates!');
  }
}

updateMaheshProfile();
