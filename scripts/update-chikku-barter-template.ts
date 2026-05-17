import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const username = 'cookku_with_chikku';

  const updatedDealTemplates = [
    {
      "id": "starter_reel",
      "name": "🚀 Starter Collab",
      "type": "paid",
      "label": "🚀 Starter Collab",
      "price": 3000,
      "budget": 3000,
      "description": "Perfect for first-time brand awareness & organic reach.",
      "deliverables": [
        "1 Reel (15-30s)",
        "Organic reach focus",
        "1 Revision included"
      ]
    },
    {
      "id": "growth_package",
      "name": "⭐ Growth Campaign",
      "type": "paid",
      "label": "⭐ Growth Campaign",
      "price": 4800,
      "budget": 4800,
      "isPopular": true,
      "description": "Best for brands wanting ads usage + conversions.",
      "deliverables": [
        "1 Premium Reel (30-60s)",
        "30-day usage rights (for ads)",
        "Script + hook optimization",
        "2 Story shoutouts",
        "1 Revision included"
      ]
    },
    {
      "id": "product_barter",
      "name": "🎁 Product Exchange",
      "type": "barter",
      "label": "🎁 Product Exchange",
      "price": 0,
      "budget": 0,
      "description": "Product unboxing or review. Min product value: ₹3,000.",
      "deliverables": [
        "1 Reel or 2 Stories",
        "Product review focus",
        "Product value must exceed ₹3,000"
      ],
      "notes": "Product value must exceed ₹3,000."
    }
  ];

  console.log(`🐾 Updating verified barter deal templates for @${username}...`);

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        deal_templates: updatedDealTemplates,
        barter_min_value: 3000,
        updated_at: new Date().toISOString()
      })
      .eq('username', username);

    if (updateError) throw updateError;
    console.log(`✅ Database profiles table updated successfully for @${username}!`);

    // Verify
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('username, deal_templates, barter_min_value')
      .eq('username', username)
      .single();

    if (selectError) throw selectError;
    console.log('\n🐾 Verification audit:');
    console.log(`- Username: @${profile.username}`);
    console.log(`- barter_min_value: ${profile.barter_min_value}`);
    console.log(`- deal_templates:`, JSON.stringify(profile.deal_templates, null, 2));
    console.log('\n✨ Database Barter Template Sync Completed Successfully!');

  } catch (error: any) {
    console.error('❌ Database update failed:', error.message);
  }
}

main();
