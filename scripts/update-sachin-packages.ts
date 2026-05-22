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
  const username = 'patnawalebhiya';

  console.log(`🎥 Fetching profile for @${username}...`);

  try {
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('id, username, deal_templates, starting_price, reel_price, story_price')
      .eq('username', username)
      .single();

    if (selectError || !profile) {
      throw new Error(`Profile not found: ${selectError?.message}`);
    }

    console.log('🎥 Current Database State:');
    console.log(`- ID: ${profile.id}`);
    console.log(`- Starting Price: ${profile.starting_price}`);
    console.log(`- Reel Price: ${profile.reel_price}`);
    console.log(`- Story Price: ${profile.story_price}`);
    console.log(`- Deal Templates:`, JSON.stringify(profile.deal_templates, null, 2));

    const updatedDealTemplates = [
      {
        id: 'starter_reel',
        name: '🚀 Starter Collab',
        type: 'paid',
        label: '🚀 Starter Collab',
        price: 15000,
        budget: 15000,
        description: 'Perfect for first-time brand awareness & organic reach.',
        deliverables: [
          '1 Reel (15-30s)',
          'Organic reach focus',
          '1 Revision included'
        ]
      },
      {
        id: 'growth_package',
        name: '⭐ Growth Campaign',
        type: 'paid',
        label: '⭐ Growth Campaign',
        price: 20000,
        budget: 20000,
        isPopular: true,
        description: 'Best for brands wanting ads usage + conversions.',
        deliverables: [
          '1 Premium Reel (30-60s)',
          '30-day usage rights (for ads)',
          'Script + hook optimization',
          '2 Story shoutouts',
          '1 Revision included'
        ]
      },
      {
        id: 'product_barter',
        name: '🎁 Product Exchange',
        type: 'barter',
        label: '🎁 Product Exchange',
        price: 0,
        budget: 0,
        description: 'Barter collaboration for product review/feature.',
        deliverables: [
          '1 Reel or 2 Stories',
          'Product review focus'
        ]
      }
    ];

    console.log('\n🎥 Updating database...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        deal_templates: updatedDealTemplates,
        reel_price: 15000,
        starting_price: 15000,
        story_price: 4000,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) throw updateError;
    console.log('✅ Database profiles table updated successfully!');

    // Final verification
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('username, deal_templates, starting_price, reel_price, story_price')
      .eq('id', profile.id)
      .single();

    if (verifyError || !updatedProfile) {
      throw new Error(`Verification select failed: ${verifyError?.message}`);
    }

    console.log('\n🎥 Updated Verification:');
    console.log(`- Username: @${updatedProfile.username}`);
    console.log(`- Starting Price: ${updatedProfile.starting_price}`);
    console.log(`- Reel Price: ${updatedProfile.reel_price}`);
    console.log(`- Story Price: ${updatedProfile.story_price}`);
    console.log(`- Deal Templates:`, JSON.stringify(updatedProfile.deal_templates, null, 2));
    console.log('\n✨ Pricing and deliverables alignment completed successfully!');

  } catch (error: any) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

main();
