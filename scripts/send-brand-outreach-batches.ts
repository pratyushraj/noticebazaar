import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

const batches = {
  B6: {
    category: 'Pet Care',
    brands: [
      { name: 'TailBlaze', email: 'hello@tailblaze.com', website: 'https://tailblaze.com' },
      { name: 'Pawpeye', email: 'pawpeye@gmail.com', website: 'https://pawpeye.com' },
      { name: 'RayTails', email: 'hello@raytails.com', website: 'https://raytails.com' },
      { name: 'Venttura', email: 'info@venttura.in', website: 'https://venttura.in' },
      { name: 'Dogkart', email: 'support@dogkart.in', website: 'https://dogkart.in' },
      { name: "Ollie's Paw", email: 'hello@olliespaw.com', website: 'https://olliespaw.com' }
    ]
  },
  B7: {
    category: 'Food & Beverage',
    brands: [
      { name: 'Healthy Master', email: 'support@healthymaster.in', website: 'https://healthymaster.in' },
      { name: 'Makhana Break', email: 'info@makhanabreak.com', website: 'https://makhanabreak.com' },
      { name: 'Crispy Makhana', email: 'sales@crispymakhana.com', website: 'https://crispymakhana.com' },
      { name: 'Makhanix', email: 'hello@makhanix.com', website: 'https://makhanix.com' },
      { name: 'Widour', email: 'info@widour.com', website: 'https://widour.com' },
      { name: 'Beyond Food', email: 'hello@beyondfood.in', website: 'https://beyondfood.in' }
    ]
  },
  B8: {
    category: 'Wellness/Ayurveda',
    brands: [
      { name: 'Shivya Ayurveda', email: 'info@shivyaayurveda.com', website: 'https://shivyaayurveda.com' },
      { name: 'Aarogya Jeevanam', email: 'care@aarogyajeevanam.com', website: 'https://aarogyajeevanam.com' },
      { name: '365veda', email: 'hello@365veda.com', website: 'https://365veda.com' },
      { name: 'Chetan Herbals', email: 'info@chetanherbals.com', website: 'https://chetanherbals.com' },
      { name: 'Vaghveda', email: 'care@vaghveda.com', website: 'https://vaghveda.com' },
      { name: 'Nirogam', email: 'info@nirogam.com', website: 'https://nirogam.com' }
    ]
  }
};

function getD2CEmailTemplate(brandName: string, category: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 12px 0;">
      <p>Hi Team 👋</p>
      
      <p>Came across your brand and honestly the products/content already feel very creator-friendly ✨</p>
      
      <p>We’re currently helping brands connect with lifestyle, beauty, wellness & local creators for:<br>
      • barter collaborations<br>
      • UGC content<br>
      • Instagram reel campaigns<br>
      • creator-led product promotions</p>
      
      <p>The goal is simple:<br>
      help brands get authentic creator content without handling everything manually on DMs & spreadsheets.</p>
      
      <p>We’d love to explore a small barter collaboration campaign with your brand 😊</p>
      
      <p>No setup cost involved for the initial pilot.</p>
      
      <p>Would love to connect if relevant.</p>
      
      <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
        — Pratyush<br>
        Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #0f172a; text-decoration: underline; font-weight: 600;">creatorarmour.com</a>
      </p>
    </div>
  `;
}

async function main() {
  console.log('🚀 Initiating automated outreach campaign for Batches B6, B7, and B8...');

  const results: any[] = [];

  for (const [batchName, data] of Object.entries(batches)) {
    console.log(`\n============================================================`);
    console.log(`📦 Processing ${batchName} (${data.category})`);
    console.log(`============================================================`);

    for (const b of data.brands) {
      console.log(`➡️ Processing ${b.name} (${b.email})...`);

      try {
        // Find if brand lead already exists
        const { data: existingLead, error: checkError } = await supabase
          .from('brand_leads')
          .select('*')
          .eq('brand_name', b.name)
          .maybeSingle();

        if (checkError) throw checkError;

        const leadPayload = {
          brand_name: b.name,
          website: b.website,
          email: b.email,
          category: data.category,
          status: 'contacted',
          outreach_count: existingLead ? (existingLead.outreach_count || 0) + 1 : 1,
          last_contacted_at: new Date().toISOString(),
          contact_name: 'Marketing Team'
        };

        if (existingLead) {
          console.log(`   Lead exists. Updating lead records...`);
          const { error: updateError } = await supabase
            .from('brand_leads')
            .update(leadPayload)
            .eq('id', existingLead.id);

          if (updateError) throw updateError;
        } else {
          console.log(`   New Lead. Inserting lead records...`);
          const { error: insertError } = await supabase
            .from('brand_leads')
            .insert(leadPayload);

          if (insertError) throw insertError;
        }

        // Dispatch Outreach Email via Resend API
        const { data: resData, error: resError } = await resend.emails.send({
          from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
          to: b.email,
          reply_to: 'creatorarmour07@gmail.com',
          subject: `collaboration with ${b.name}`,
          html: getD2CEmailTemplate(b.name, data.category)
        });

        if (resError) throw resError;

        console.log(`   ✅ Sent! Resend ID: ${resData?.id}`);

        results.push({
          batch: batchName,
          category: data.category,
          brandName: b.name,
          email: b.email,
          resendId: resData?.id
        });

      } catch (err: any) {
        console.error(`   ❌ Failed to process ${b.name}:`, err.message);
        results.push({
          batch: batchName,
          category: data.category,
          brandName: b.name,
          email: b.email,
          resendId: 'FAILED'
        });
      }

      // Small natural delay between sends to respect rate limits
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log('\n============================================================');
  console.log('📊 OUTREACH CAMPAIGN RESULTS TABLE');
  console.log('============================================================');
  console.table(results);
}

main();
