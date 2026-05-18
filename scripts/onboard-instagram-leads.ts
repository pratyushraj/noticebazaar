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

function getInstagramPitchTemplate(brand: BrandOutreachProps): string {
  let categoryIntro = '';
  let creatorShortlistIntro = '';
  let portalUrl = 'https://creatorarmour.com';
  let buttonLabel = '👉 Explore Creator Armour OS';

  const catLower = brand.category.toLowerCase();
  
  if (catLower.includes('toy') || catLower.includes('kid') || catLower.includes('baby')) {
    categoryIntro = `We love the wonderful kids and family focused products you are building at <strong>${brand.brandName}</strong>! 🧸✨`;
    creatorShortlistIntro = `We have pre-vetted premium parenting, preschooler, and child-development lifestyle creators (like Sneha and Rohit) who are perfect for showcase unboxings, toy testing, and routine videos.`;
    portalUrl = 'https://creatorarmour.com/prateek_matoria';
    buttonLabel = `👉 View ${brand.brandName} Creator Shortlist`;
  } else if (catLower.includes('food') || catLower.includes('snack') || catLower.includes('millet')) {
    categoryIntro = `We love the nutritious, high-quality products you are crafting at <strong>${brand.brandName}</strong>! 🌾🍪`;
    creatorShortlistIntro = `We have verified top-tier healthy recipe, clean eating, and traditional family lifestyle creators (like Cookku with Chikku, 490K verified average views) who are perfect for creative recipe integrations and family tasting reels.`;
    portalUrl = 'https://creatorarmour.com/pitch/kiro-foods';
    buttonLabel = `👉 View ${brand.brandName} Food Creator Shortlist`;
  } else if (catLower.includes('home') || catLower.includes('kitchen') || catLower.includes('care') || catLower.includes('utility')) {
    categoryIntro = `We love the design-forward, functional solutions you are offering at <strong>${brand.brandName}</strong>! 🏡🛋️`;
    creatorShortlistIntro = `We have pre-vetted premium aesthetic home staging, organization, and daily utility lifestyle creators (like Monika and Rohit) who produce premium H.264 unboxing and routine integration reels.`;
    portalUrl = 'https://creatorarmour.com';
    buttonLabel = `👉 View ${brand.brandName} Aesthetic Shortlist`;
  } else {
    // General lifestyle/beauty/wellness
    categoryIntro = `We love the premium lifestyle products you are creating at <strong>${brand.brandName}</strong>! 🌟🛍️`;
    creatorShortlistIntro = `We have pre-vetted premium lifestyle, travel, and beauty creators (like Monika and Sneha) who produce highly aesthetic lifestyle integration reels with true verified demographics.`;
    portalUrl = 'https://creatorarmour.com';
    buttonLabel = `👉 Explore Creator Armour OS`;
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
      <div style="margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
        <span style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.025em;">CREATOR<span style="color: #10b981;">ARMOUR</span></span>
        <span style="float: right; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.05em;">Instagram Lead Followup</span>
      </div>

      <p>Hi Team,</p>
      
      <p>Hope you are having a productive week!</p>
      
      <p>We recently connected via Instagram direct messages under <strong>@creatorarmour</strong>, and wanted to share our complete custom creator partnerships proposal with you here.</p>
      
      <p>${categoryIntro}</p>
      
      <p>Influencer marketing is highly lucrative for premium D2C brands, but the operations are incredibly painful—chasing creators over Instagram DMs, tracking lost product samples, and manually validating if they fulfilled the brief.</p>
      
      <p><strong>Creator Armour is a SaaS operating system that manages the entire campaign lifecycle for you.</strong> We handle the heavy lifting so your brand can scale campaigns hands-off.</p>
      
      <p>${creatorShortlistIntro}</p>
      
      <div style="margin: 28px 0; text-align: center;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2); transition: all 0.3s ease;">
          ${buttonLabel}
        </a>
      </div>
      
      <p><strong>How we eliminate your operational burden ("Brands chill. We handle operations"):</strong></p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 40px; font-size: 20px;">📦</td>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            <strong style="color: #0f172a;">Sample Box Logistics:</strong> Automated shipping label generation and real-time tracking updates for sample deliveries.
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 40px; font-size: 20px;">💬</td>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            <strong style="color: #0f172a;">WhatsApp Campaign Engine:</strong> Briefs, schedule reminders, and draft approvals are sent automatically via WhatsApp (zero manual DM follow-ups).
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 40px; font-size: 20px;">🔒</td>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            <strong style="color: #0f172a;">Escrow-Protected Payouts:</strong> Payout is locked in escrow and only released after the reel goes live, containing the exact hashtags and tag requirements.
          </td>
        </tr>
      </table>
      
      <p><strong>Special Launch Offer:</strong> We will curate a custom list of <strong>10 pre-vetted, high-conversion creators</strong> for ${brand.brandName} within 24 hours. If you like the matches, we can kick off a small test campaign. If not, it costs you absolutely nothing.</p>
      
      <p>Do you have 10 minutes for a quick introductory demo sync this week? 😊</p>
      
      <p style="margin-top: 32px; border-top: 2px solid #f1f5f9; padding-top: 20px; font-size: 14px; color: #64748b;">
        Best regards,<br>
        <strong style="color: #0f172a; font-size: 15px;">Pratyush Raj</strong><br>
        Founder & CEO — Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #10b981; font-weight: 700; text-decoration: none;">creatorarmour.com</a>
      </p>
    </div>
  `;
}

// 10 Brands detected from the Instagram direct message screenshot
const instagramLeads = [
  { brand_name: 'Ariro Toys', website: 'https://arirotoys.com', category: 'Toys & Kids', email: 'growthmanager@arirotoys.com', contact_name: 'Marketing Team' },
  { brand_name: 'Vedas Kitchen', website: 'https://vedaskitchen.com', category: 'Home & Kitchen', email: 'support@vedaskitchen.in', contact_name: 'Brand Team' },
  { brand_name: 'The Millet Way', website: 'https://themilletway.com', category: 'Food & Snacks', email: 'themilletway@gmail.com', contact_name: 'Brand Team' },
  { brand_name: 'Nutrimum', website: 'https://nutrimum.in', category: 'Food & Snacks', email: 'nutrimumbabyfood@gmail.com', contact_name: 'Marketing Team' },
  { brand_name: 'The Artment', website: 'https://theartment.com', category: 'Home & Kitchen', email: 'hello@theartment.com', contact_name: 'Marketing Team' },
  { brand_name: 'Dcalcifer India', website: 'https://dcalcifer.com', category: 'Home Care', email: 's.gowthamsrinivash@gmail.com', contact_name: 'Brand Team' },
  { brand_name: 'Mr. Gulkand', website: 'https://mrgulkand.com', category: 'Food & Snacks', email: 'mrgulkandofficial@gmail.com', contact_name: 'Brand Team' },
  { brand_name: 'Newdru', website: 'https://newdru.com', category: 'Wellness & Utility', email: 'hello@newdru.com', contact_name: 'Marketing Team' },
  { brand_name: 'Cleevo', website: 'https://getcleevo.com', category: 'Home Care', email: 'info@getcleevo.com', contact_name: 'Brand Team' },
  { brand_name: 'VR Luxuries', website: 'https://vrluxuries.com', category: 'Beauty & Perfumes', email: 'vrluxuries@gmail.com', contact_name: 'Brand Team' }
];

async function main() {
  console.log(`🚀 Processing ${instagramLeads.length} Instagram DM Brand leads...`);

  const results: any[] = [];

  for (const lead of instagramLeads) {
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
        notes: 'Red-hot Instagram DM lead. Contacted via dynamic outreach email.'
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
  console.log('📊 INSTAGRAM DM CAMPAIGN DISPATCH RESULTS');
  console.log('============================================================');
  console.table(results);
}

main();
export { getInstagramPitchTemplate };
