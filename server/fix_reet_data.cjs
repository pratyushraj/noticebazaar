const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixReetData() {
  const username = 'chroniclesofffoods';
  
  console.log(`Fixing data for ${username}...`);

  // 1. Fetch current profile
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, deal_templates')
    .eq('username', username)
    .single();

  if (fetchError || !profile) {
    console.error('Error fetching profile:', fetchError);
    return;
  }

  // 2. Define proper deal templates with IDs
  const correctedTemplates = [
    {
      id: 'starter_reel',
      label: '🚀 Starter Collab',
      description: 'Perfect for first-time brand awareness & organic reach.',
      budget: 2000,
      type: 'paid',
      deliverables: [
        '1 Reel (15-30s)',
        'Organic reach focus',
        '1 Revision included'
      ],
      is_active: true
    },
    {
      id: 'growth_package',
      label: '⭐ Growth Campaign',
      description: 'Best for brands wanting ads usage + conversions.',
      budget: 5000,
      type: 'paid',
      deliverables: [
        '1 Premium Reel (30-60s)',
        '30-day usage rights (for ads)',
        'Script + hook optimization',
        '2 Story shoutouts',
        '1 Revision included'
      ],
      is_active: true,
      isPopular: true
    },
    {
        id: 'product_barter',
        label: '🎁 Product Exchange',
        description: 'Barter collaboration for product review/feature.',
        budget: 0,
        type: 'barter',
        deliverables: ['1 Reel or 2 Stories', 'Product review focus'],
        is_active: true
    }
  ];

  // 3. Update Profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
        deal_templates: correctedTemplates,
        barter_min_value: 1500 // Adding a fallback barter value
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Error updating profile:', updateError);
  } else {
    console.log('Profile templates and barter value updated successfully!');
  }
}

fixReetData();
