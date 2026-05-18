import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Use verified active Resend API key
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

interface BrandOutreachProps {
  brandName: string;
  category: string;
  website: string;
}

// Reuse dynamic pitch template generator
import { getInstagramPitchTemplate } from './onboard-instagram-leads';

// 15 Brands detected from the second Instagram direct message screenshot
const instagramLeadsBatch2 = [
  { brand_name: 'Drama Llama', website: 'https://dramallamabev.com', category: 'Food & Coffee', email: 'info@dramallamabev.com', contact_name: 'Brand Team' },
  { brand_name: 'Dancing Cow | Oatish', website: 'https://dancingcow.in', category: 'Food & Wellness', email: 'support@dancingcow.in', contact_name: 'Partnership Team' },
  { brand_name: 'Real Thai India', website: 'https://ramavisionltd.com', category: 'Food & Snacks', email: 'info@ramavisionltd.com', contact_name: 'Marketing Team' },
  { brand_name: 'Gusto India', website: 'https://gustoindia.in', category: 'Lifestyle Accessories', email: 'info@gustoindia.in', contact_name: 'Support Team' },
  { brand_name: 'APH Spices', website: 'https://aphspices.com', category: 'Food & Snacks', email: 'info@aphspices.com', contact_name: 'Partnership Team' },
  { brand_name: 'Helembari Tea', website: 'https://helembaritea.com', category: 'Food & Coffee', email: 'helembaritea@gmail.com', contact_name: 'Brand Team' },
  { brand_name: 'Dry Gravy', website: 'https://drygravy.in', category: 'Food & Snacks', email: 'info@drygravy.in', contact_name: 'Brand Team' },
  { brand_name: 'The Gourmet Jar', website: 'https://thegourmetjar.com', category: 'Food & Snacks', email: 'hello@thegourmetjar.com', contact_name: 'Marketing Team' },
  { brand_name: 'Nestasia', website: 'https://nestasia.in', category: 'Home & Kitchen', email: 'info@nestasia.in', contact_name: 'Growth Team' },
  { brand_name: 'Beyond the Bean', website: 'https://beyondthebean.com', category: 'Food & Coffee', email: 'beyondthebean@gmail.com', contact_name: 'Brand Team' },
  { brand_name: 'The Good Leaf', website: 'https://thegoodleaf.in', category: 'Food & Wellness', email: 'sales@thegoodleaf.in', contact_name: 'Partnership Team' },
  { brand_name: 'Chutnefy', website: 'https://chutnefy.com', category: 'Food & Snacks', email: 'feedback@chutnefy.com', contact_name: 'Growth Team' },
  { brand_name: 'Nongshim India', website: 'https://ramavisionltd.com', category: 'Food & Snacks', email: 'info@ramavisionltd.com', contact_name: 'Marketing Team' },
  { brand_name: 'Jackpot India', website: 'https://jackpotindia.com', category: 'Lifestyle Accessories', email: 'info@jackpotindia.com', contact_name: 'Brand Team' },
  { brand_name: 'St Dalfour India', website: 'https://skco.in', category: 'Food & Snacks', email: 'info@skco.in', contact_name: 'Importer Team' }
];

async function main() {
  console.log(`🚀 Processing ${instagramLeadsBatch2.length} Instagram DM Brand leads (Batch 2)...`);

  const results: any[] = [];

  for (const lead of instagramLeadsBatch2) {
    console.log(`➡️ Ingesting and pitching ${lead.brand_name} (${lead.email})...`);

    try {
      // 1. Ingest brand lead into DB with duplicate protection
      const { data: existingLead, error: checkError } = await supabase
        .from('brand_leads')
        .select('*')
        .eq('brand_name', lead.brand_name)
        .maybeSingle();

      if (checkError) throw checkError;

      const leadPayload = {
        brand_name: lead.brand_name,
        website: lead.website,
        email: lead.email,
        category: lead.category,
        status: 'contacted',
        outreach_count: existingLead ? (existingLead.outreach_count || 0) + 1 : 1,
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        contact_name: lead.contact_name,
        notes: 'Red-hot Batch 2 Instagram DM lead. Contacted via dynamic outreach email.'
      };

      if (existingLead) {
        console.log(`   - Lead already exists. Updating records...`);
        const { error: updateError } = await supabase
          .from('brand_leads')
          .update(leadPayload)
          .eq('id', existingLead.id);

        if (updateError) throw updateError;
      } else {
        console.log(`   - New Lead. Inserting to database...`);
        const { error: insertError } = await supabase
          .from('brand_leads')
          .insert(leadPayload);

        if (insertError) throw insertError;
      }

      // 2. Dispatch customized outbound email via Resend
      const brandPayload: BrandOutreachProps = {
        brandName: lead.brand_name,
        category: lead.category,
        website: lead.website
      };

      const subject = `Zero-Ops Creator Campaigns & Custom Proposal for ${lead.brand_name} 🚀📦`;
      const htmlBody = getInstagramPitchTemplate(brandPayload);

      const { data: resData, error: sendError } = await resend.emails.send({
        from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
        to: lead.email,
        reply_to: 'creatorarmour07@gmail.com',
        subject: subject,
        html: htmlBody
      });

      if (sendError) throw sendError;

      console.log(`   ✅ Sent! Resend ID: ${resData?.id}`);

      results.push({
        brandName: lead.brand_name,
        email: lead.email,
        category: lead.category,
        resendId: resData?.id
      });

    } catch (err: any) {
      console.error(`   ❌ Failed to process ${lead.brand_name}:`, err.message);
      results.push({
        brandName: lead.brand_name,
        email: lead.email,
        category: lead.category,
        resendId: 'FAILED'
      });
    }

    // Delay between sends to respect rate limits
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n============================================================');
  console.log('📊 INSTAGRAM DM CAMPAIGN BATCH 2 RESULTS');
  console.log('============================================================');
  console.table(results);
}

main();
