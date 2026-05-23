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
        description: 'Barter collaboration for product review/feature (minimum product value ₹10,000+).',
        deliverables: [
          '1 Reel or 2 Stories',
          'Product review focus'
        ]
      }
    ];

    console.log('\n🎥 Updating database with standardized packages and exact marketplace metrics...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        deal_templates: updatedDealTemplates,
        reel_price: 15000,
        starting_price: 15000,
        story_price: 4000,
        barter_min_value: 10000,
        instagram_followers: 230700,
        followers_count: 230700,
        engagement_rate: 10.1,
        interaction_rate: 10.1,
        accounts_reached_30d: 2400000,
        accounts_engaged_30d: 359000,
        audience_gender_split: { women: 44.6, men: 55.4 },
        audience_age_range: '18-24 (48.8%), 25-34 (39.7%)',
        top_cities: ['Patna', 'Delhi', 'Mumbai', 'Gopalganj', 'Bengaluru'],
        deal_intelligence: {
          hookRate: 54.8, // Match the 54.8% Reach rate
          interactionRate: 10.1,
          accountsReached30d: '2.4M',
          accountsEngaged30d: '359K',
          viralPotential: 'Extremely High',
          demographicsRelevance: '93% India Concentrated',
          specialties: ['Engaging hooks', 'Strong hooks', 'Partnership ads']
        },
        collab_audience_fit_note: 'High concentration of audience in Patna (11.8%) and metro cities across India.',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) throw updateError;
    console.log('✅ Database profiles table updated successfully!');

    // Final verification
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('username, deal_templates, starting_price, reel_price, story_price, instagram_followers, engagement_rate, interaction_rate, accounts_reached_30d, accounts_engaged_30d, audience_gender_split, top_cities')
      .eq('id', profile.id)
      .single();

    if (verifyError || !updatedProfile) {
      throw new Error(`Verification select failed: ${verifyError?.message}`);
    }

    console.log('\n🎥 Updated Verification:');
    console.log(`- Username: @${updatedProfile.username}`);
    console.log(`- Followers: ${updatedProfile.instagram_followers}`);
    console.log(`- Engagement Rate: ${updatedProfile.engagement_rate}%`);
    console.log(`- Interaction Rate: ${updatedProfile.interaction_rate}%`);
    console.log(`- Accounts Reached (30d): ${updatedProfile.accounts_reached_30d}`);
    console.log(`- Accounts Engaged (30d): ${updatedProfile.accounts_engaged_30d}`);
    console.log(`- Gender Split:`, JSON.stringify(updatedProfile.audience_gender_split));
    console.log(`- Top Cities:`, JSON.stringify(updatedProfile.top_cities));
    console.log(`- Deal Templates:`, JSON.stringify(updatedProfile.deal_templates, null, 2));
    console.log('\n✨ Pricing, deliverables, and official marketplace metrics alignment completed successfully!');

  } catch (error: any) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

main();
