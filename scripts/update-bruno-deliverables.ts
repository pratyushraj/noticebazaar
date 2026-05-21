import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const username = 'bruno_thegoldenretriever_';

  console.log(`🐾 Fetching profile for @${username}...`);

  try {
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('id, username, deal_templates, starting_price, reel_price')
      .eq('username', username)
      .single();

    if (selectError || !profile) {
      throw new Error(`Profile not found: ${selectError?.message}`);
    }

    console.log('🐾 Current Database State:');
    console.log(`- ID: ${profile.id}`);
    console.log(`- Starting Price: ${profile.starting_price}`);
    console.log(`- Reel Price: ${profile.reel_price}`);
    console.log(`- Deal Templates:`, JSON.stringify(profile.deal_templates, null, 2));

    const updatedDealTemplates = [
      {
        id: 'starter_reel',
        type: 'paid',
        label: '🚀 Collab Reel',
        budget: 1500,
        isPopular: true,
        description: '1 Wholesome Collab Reel featuring Bruno - Perfect for brand awareness and active organic reach.',
        deliverables: [
          '1 Reel (15-30s) featuring Bruno the Golden Retriever',
          'Full organic rights',
          'Authentic product integration'
        ]
      },
      {
        id: 'reel_stories_combo',
        type: 'paid',
        label: '⭐ Bruno\'s Combo Package',
        budget: 2000,
        isPopular: false,
        description: '1 Wholesome Reel + 3-4 Stories - Best for driving high conversions, traffic, and engagement.',
        deliverables: [
          '1 Collab Reel (15-30s) featuring Bruno',
          '3-4 Story shoutouts with direct product links',
          '30-day digital usage rights'
        ]
      }
    ];

    console.log('\n🐾 Updating database...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        deal_templates: updatedDealTemplates,
        reel_price: 1500,
        starting_price: 1500,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) throw updateError;
    console.log('✅ Database profiles table updated successfully!');

    // Final verification
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('username, deal_templates, starting_price, reel_price')
      .eq('id', profile.id)
      .single();

    if (verifyError || !updatedProfile) {
      throw new Error(`Verification select failed: ${verifyError?.message}`);
    }

    console.log('\n🐾 Updated Verification:');
    console.log(`- Username: @${updatedProfile.username}`);
    console.log(`- Starting Price: ${updatedProfile.starting_price}`);
    console.log(`- Reel Price: ${updatedProfile.reel_price}`);
    console.log(`- Deal Templates:`, JSON.stringify(updatedProfile.deal_templates, null, 2));
    console.log('\n✨ Pricing and deliverables correction completed successfully!');

  } catch (error: any) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

main();
