import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

async function main() {
  const username = 'dr.shree.in';
  const userId = '44df4787-f056-4f6d-8210-cc0802e91ba5';

  console.log(`🚀 Updating Meta Creator Marketplace metrics for Dr. Shree (@${username})...`);

  try {
    // 1. Update Profile table
    const profileUpdate = {
      instagram_followers: 13600,
      followers_count: 13600,
      engagement_rate: 5.2,
      avg_views: 184300, // Derived from 921.7K monthly reach (average ~184K views per reel)
      avg_reel_views_manual: 184300,
      bio: 'Attempting adulthood through fitness 💪 food 😋 and travel ✈️ Dentist...',
      past_brands: ['Sheba'],
      past_brand_count: 1,
      collab_brands_count_override: 1,
      
      // Demographics from native Marketplace screenshots
      audience_gender_split: { women: 45.0, men: 55.0 },
      top_cities: ['Chennai', 'Bangalore', 'Coimbatore', 'Kochi'],
      audience_age_range: '18-34 (80.4%)',
      
      // Native Marketplace Intel
      deal_score: 98,
      deal_intelligence: {
        hookRate: 52.4,
        interactionRate: 5.2,
        accountsReached30d: '921.7K',
        accountsEngaged30d: '62.7K',
        viralPotential: 'Top 1% Viral reach',
        demographicsRelevance: '80.4% Young Adult Concentrated'
      },
      collab_audience_fit_note: 'Highly engaged young adult audience (80.4% aged 18-34) with strong urban South India concentration (Chennai, Bangalore, Coimbatore, Kochi) and premium balanced demographics.',
      collab_engagement_confidence_note: 'Exceptional 52.4% hook rate combined with an active 5.2% interaction rate and 921K+ monthly reach, reflecting extreme organic viral potential.',
      collab_delivery_reliability_note: 'Professional dentist and brand-vetted creator. Successfully executed campaigns with global premium brands like Sheba.',
      collab_cta_trust_note: 'High converting voice for wellness, lifestyle, fitness, and premium pet nutrition (Sheba cat food) campaigns.'
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (profileError) throw profileError;
    console.log('✅ Profile table updated with native Meta Creator Marketplace data.');

    // 2. Update Social Accounts table
    const { error: socialError } = await supabase
      .from('social_accounts')
      .update({
        followers: 13600,
        linked_at: new Date().toISOString()
      })
      .eq('creator_id', userId)
      .eq('platform', 'instagram');

    if (socialError) {
      console.warn('⚠️ Social account update warning:', socialError.message);
    } else {
      console.log('✅ Social account followers updated to 13.6K in social_accounts table.');
    }

    console.log(`\n✨ Successfully synchronized Dr. Shree with Meta Creator Marketplace source of truth!`);

  } catch (error: any) {
    console.error('❌ Failed to update Marketplace metrics:', error.message);
  }
}

main();
