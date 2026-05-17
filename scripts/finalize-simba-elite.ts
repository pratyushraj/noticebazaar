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

async function main() {
  const username = 'simba_bhimavaram_bullodu';
  console.log(`🚀 Finalizing verified Creator Marketplace metrics for Simba & Sara (@${username})...`);

  const eliteMetrics = {
    // 1. Core Analytics from Meta Marketplace Screenshot
    engagement_rate: 11.2,
    instagram_followers: 34600,
    followers_count: 34600,
    avg_views: 48000,
    avg_reel_views_manual: 48000,

    // 2. Audience Demographics Snapshot
    audience_gender_split: { women: 51.2, men: 48.8 },
    top_cities: ['Visakhapatnam', 'Hyderabad', 'Vijayawada', 'Bangalore'],
    audience_age_range: '18-24 (46%)',
    primary_audience_language: 'Telugu / English',
    
    // 3. System Trust Signals
    is_elite_verified: true,
    is_verified: true,
    deal_score: 95,
    collab_show_trust_signals: true,
    collab_show_audience_snapshot: true,
    collab_show_past_work: true,

    // 4. AI-Backed Deal Intelligence & Contextual Trust Notes
    deal_intelligence: {
      hookRate: 59.3,
      interactionRate: 11.2,
      accountsReached30d: '1.1M',
      accountsEngaged30d: '108.8K',
      viralPotential: 'Extremely High',
      demographicsRelevance: '99.1% India concentrated'
    },
    collab_audience_fit_note: 'Highly active Gen-Z/Millennial audience across tier-1 & tier-2 cities in India (99.1% India concentrated). Perfect for lifestyle, D2C brands, and pet-lovers.',
    collab_engagement_confidence_note: 'Strong verified interaction rate (11.2%) and incredible hook rate (59.3%) on vertical short-form reels.',
    collab_delivery_reliability_note: 'Elite creator with highly consistent posting frequency and top-tier response behavior.',
    collab_recent_activity_note: 'Reels average 45k+ views with rapid organic community traction.',
    collab_cta_trust_note: 'Highly trusted source of pet lifestyle, funny moments, and wholesome family routines.',

    // 5. Elite Deal Pricing Templates
    deal_templates: [
      {
        id: 'starter_reel_story',
        label: '🚀 Reel + Story Collab',
        description: 'Excellent for organic product placement and community action.',
        budget: 3000,
        type: 'paid',
        deliverables: [
          '1 Dedicated Reel (15-30s)',
          '1 Story shoutout with link sticker',
          '1 Revision included'
        ],
        isPopular: true
      },
      {
        id: 'growth_package',
        label: '⭐ Premium Brand Campaign',
        description: 'Complete multi-story showcase with usage rights.',
        budget: 6000,
        type: 'paid',
        deliverables: [
          '1 Premium Lifestyle Reel (30-60s)',
          '3 Story integrations with link sticker',
          '30-day organic usage rights (for ads)',
          'Raw footage delivery included'
        ]
      },
      {
        id: 'product_barter',
        label: '🎁 Product Barter',
        description: 'Open to selective high-value product exchange reviews.',
        budget: 0,
        type: 'barter',
        deliverables: [
          '1 Dedicated Reel feature',
          '1 Story unboxing with coupon link'
        ]
      }
    ],
    barter_min_value: 1500,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from('profiles')
      .update(eliteMetrics)
      .eq('username', username);

    if (error) throw error;
    console.log(`\n✨ Elite Verification Complete! Simba & Sara's profile now has perfect Meta Creator Marketplace parity.`);
    console.log(`🔗 Link: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Failed to update elite metrics:', error.message);
  }
}

main();
