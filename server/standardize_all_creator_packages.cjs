const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STANDARD_TEMPLATES = {
  starter: {
    id: 'starter_reel',
    label: '🚀 Starter Collab',
    description: 'Perfect for first-time brand awareness & organic reach.',
    deliverables: [
      '1 Reel (15-30s)',
      'Organic reach focus',
      '1 Revision included'
    ]
  },
  growth: {
    id: 'growth_package',
    label: '⭐ Growth Campaign',
    description: 'Best for brands wanting ads usage + conversions.',
    deliverables: [
      '1 Premium Reel (30-60s)',
      '30-day usage rights (for ads)',
      'Script + hook optimization',
      '2 Story shoutouts',
      '1 Revision included'
    ],
    isPopular: true
  },
  barter: {
    id: 'product_barter',
    label: '🎁 Product Exchange',
    description: 'Barter collaboration for product review/feature.',
    deliverables: [
      '1 Reel or 2 Stories',
      'Product review focus'
    ]
  }
};

async function standardizeAll() {
  console.log('Starting global package standardization...');

  // 1. Fetch all creators with templates
  const { data: creators, error: fetchError } = await supabase
    .from('profiles')
    .select('id, username, deal_templates')
    .not('deal_templates', 'is', null);

  if (fetchError) {
    console.error('Error fetching creators:', fetchError);
    return;
  }

  console.log(`Auditing ${creators.length} creators...`);

  for (const creator of creators) {
    if (!creator.deal_templates || !Array.isArray(creator.deal_templates)) continue;

    let updated = false;
    const newTemplates = creator.deal_templates.map(t => {
      const label = String(t.label || t.name || '').toLowerCase();
      
      // Match and Replace
      if (label.includes('starter')) {
        updated = true;
        return { ...t, ...STANDARD_TEMPLATES.starter, budget: t.budget || t.price || 0, type: 'paid' };
      }
      if (label.includes('growth')) {
        updated = true;
        return { ...t, ...STANDARD_TEMPLATES.growth, budget: t.budget || t.price || 0, type: 'paid' };
      }
      if (label.includes('barter') || label.includes('product') || label.includes('exchange')) {
        updated = true;
        return { ...t, ...STANDARD_TEMPLATES.barter, budget: 0, type: 'barter' };
      }
      return t;
    });

    if (updated) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ deal_templates: newTemplates })
        .eq('id', creator.id);

      if (updateError) {
        console.error(`Failed to update ${creator.username}:`, updateError);
      } else {
        console.log(`✅ Standardized packages for ${creator.username}`);
      }
    }
  }

  console.log('Global standardization complete!');
}

standardizeAll();
