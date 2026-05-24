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

interface StandardTemplatesInput {
  starterPrice: number;
  growthPrice: number;
  barterMinValue: number;
}

function getStandardDealTemplates(input: StandardTemplatesInput) {
  return [
    {
      id: 'starter_collab',
      name: '🚀 Starter Collab',
      label: '🚀 Starter Collab',
      type: 'paid',
      price: input.starterPrice,
      budget: input.starterPrice,
      rate: input.starterPrice,
      description: 'Perfect for first-time brand awareness & organic reach.',
      deliverables: [
        '1 Reel (15-30s)',
        'Organic reach focus',
        '1 Revision included'
      ]
    },
    {
      id: 'growth_campaign',
      name: '⭐ Growth Campaign',
      label: '⭐ Growth Campaign',
      type: 'paid',
      price: input.growthPrice,
      budget: input.growthPrice,
      rate: input.growthPrice,
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
      id: 'product_exchange',
      name: '🎁 Product Exchange',
      label: '🎁 Product Exchange',
      type: 'barter',
      price: 0,
      budget: 0,
      rate: 0,
      barter_min_value: input.barterMinValue,
      description: `Barter collaboration - premium product or experience exchange (minimum value ₹${input.barterMinValue.toLocaleString()}+).`,
      deliverables: [
        '1 Reel or 2 Stories',
        'Product review focus'
      ]
    }
  ];
}

async function main() {
  const creators = [
    {
      username: 'nikh_l_martolia',
      starterPrice: 80000,
      growthPrice: 100000,
      barterMinValue: 30000
    },
    {
      username: 'ianuragvermaa',
      starterPrice: 25000,
      growthPrice: 30000,
      barterMinValue: 10000
    },
    {
      username: 'lilboxoffashion',
      starterPrice: 15000,
      growthPrice: 18000,
      barterMinValue: 20000
    },
    {
      username: 'explorewithmanni',
      starterPrice: 10000,
      growthPrice: 13500,
      barterMinValue: 15000
    }
  ];

  console.log('🚀 Standardizing deal templates for 4 creators in Supabase...');

  for (const creator of creators) {
    const templates = getStandardDealTemplates({
      starterPrice: creator.starterPrice,
      growthPrice: creator.growthPrice,
      barterMinValue: creator.barterMinValue
    });

    console.log(`\nUpdating @${creator.username}...`);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        deal_templates: templates
      })
      .eq('username', creator.username)
      .select('username, deal_templates');

    if (error) {
      console.error(`❌ Failed to update @${creator.username}:`, error.message);
    } else {
      console.log(`✅ Successfully standardized templates for @${creator.username}`);
      console.log(JSON.stringify(data[0]?.deal_templates, null, 2));
    }
  }

  console.log('\n🎉 Finished updating database profiles!');
}

main().catch(console.error);
