import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Active verified Resend API key
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

// Generate high-converting premium email pitches referencing our Instagram thread
export function getInstagramBatch4PitchTemplate(brand: BrandOutreachProps): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
        .features { margin: 24px 0; background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #f1f5f9; }
        .features ul { margin: 0; padding-left: 20px; }
        .features li { margin-bottom: 8px; font-size: 14px; }
        .cta-button { display: block; width: 100%; text-align: center; background: #6366f1; color: #ffffff !important; text-decoration: none; padding: 14px 20px; font-weight: 700; border-radius: 8px; margin: 28px 0 16px 0; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2); }
        .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Creator Armour 🛡️🚀</div>
        </div>
        
        <div class="greeting">Hey ${brand.brandName} Team! 👋</div>
        
        <p>We saw your active thread on our Instagram DMs under <strong>@creatorarmour</strong>! Because authentic lifestyle and high-fidelity content is the absolute premium driver for modern D2C sales in India, we wanted to share something special with you.</p>
        
        <p>At <strong>Creator Armour</strong>, we run premium, zero-operations creator matched campaigns. We've hand-picked elite creators who match perfectly with ${brand.brandName}'s unique product category (<strong>${brand.category}</strong>).</p>
        
        <div class="features">
          <strong>Here's the Creator Armour Difference:</strong>
          <ul>
            <li>🔒 <strong>100% Zero-Operations Moat:</strong> You approve the campaign proposal, we handle everything from physical shipping logistics to high-performance asset delivery.</li>
            <li>✨ <strong>Authentic verified engagement:</strong> Content produced with elite creators that speaks to real, premium buyers.</li>
            <li>⚡ <strong>Matched Proposal Ready:</strong> We've created a custom matchmaking dashboard for your brand.</li>
          </ul>
        </div>
        
        <p>We've already assembled a curated creator matching list and package suggestions for you!</p>
        
        <a href="https://www.creatorarmour.com/cookku_with_chikku" class="cta-button">View Matched Creators & Proposal ➔</a>
        
        <p>Let's make some amazing content together. Just reply directly to this email or ping us back on Instagram to schedule a quick 10-minute setup call!</p>
        
        <p>Best regards,<br><strong>Pratyush Raj</strong><br>Founder, Creator Armour</p>
        
        <div class="footer">
          Sent to partnership desk at ${brand.brandName} • 7,000+ Premium D2C Brands Trust Creator Armour.
        </div>
      </div>
    </body>
    </html>
  `;
}

// 12 Brands detected from the fourth Instagram direct message screenshot
const instagramLeadsBatch4 = [
  { brand_name: 'Barni Flavours', website: 'https://amazon.in', category: 'Food & Snacks', email: 'barniflavours@gmail.com', contact_name: 'Partnership Team' },
  { brand_name: 'Ramam Group', website: 'https://ramamgroup.com', category: 'Food & Snacks', email: 'help@ramamgroup.com', contact_name: 'Marketing Team' },
  { brand_name: 'Arvita Life', website: 'https://arvitalife.com', category: 'Food & Wellness', email: 'support@arvitalife.com', contact_name: 'Support Team' },
  { brand_name: 'Natures Bridge', website: 'https://flipkart.com', category: 'Food & Snacks', email: 'naturesbridgeindia@gmail.com', contact_name: 'Brand Team' },
  { brand_name: 'Palika Herbal', website: 'https://indiamart.com', category: 'Food & Wellness', email: 'palikaherbal@gmail.com', contact_name: 'Brand Team' },
  { brand_name: 'Farmveda', website: 'https://farmveda.in', category: 'Food & Snacks', email: 'online@farmveda.in', contact_name: 'Growth Team' },
  { brand_name: 'Elco Cosmetics', website: 'https://elcocosmetics.com', category: 'Lifestyle Accessories', email: 'ashokarora1@hotmail.com', contact_name: 'Marketing Team' },
  { brand_name: 'Eat Atlas', website: 'https://eatatlas.in', category: 'Food & Snacks', email: 'atlasfoods.info@gmail.com', contact_name: 'Partnership Team' },
  { brand_name: 'Chocolate and White', website: 'https://chocolateandwhite.com', category: 'Food & Snacks', email: 'customerservices@chocolateandwhite.com', contact_name: 'Growth Team' },
  { brand_name: 'Trinkets by Shanties', website: 'https://trinketsbyshanties.dm2buy.com', category: 'Lifestyle Accessories', email: 'trinketsbyshanties@gmail.com', contact_name: 'Founding Team' },
  { brand_name: 'Prafino Foods', website: 'https://indiamart.com', category: 'Food & Wellness', email: 'prafinofoods@gmail.com', contact_name: 'Support Team' },
  { brand_name: 'Dr T Formulaa', website: 'https://drtformulaa.com', category: 'Lifestyle Accessories', email: 'info@drtformulaa.com', contact_name: 'Partnership Team' }
];

async function main() {
  console.log(`🚀 Processing ${instagramLeadsBatch4.length} Instagram DM Brand leads (Batch 4)...`);

  const results: any[] = [];

  for (const lead of instagramLeadsBatch4) {
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
        notes: 'Red-hot Batch 4 Instagram DM lead. Contacted via dynamic outreach email.'
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
      const htmlBody = getInstagramBatch4PitchTemplate(brandPayload);

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
  console.log('📊 INSTAGRAM DM CAMPAIGN BATCH 4 RESULTS');
  console.log('============================================================');
  console.table(results);
}

main();
