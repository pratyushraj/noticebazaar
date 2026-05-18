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

function getD2CEmailTemplate(brand: BrandOutreachProps): string {
  let categoryIntro = '';
  let creatorShortlistIntro = '';
  let portalUrl = 'https://creatorarmour.com';
  let buttonLabel = '👉 Explore Creator Armour OS';

  const catLower = brand.category.toLowerCase();
  
  if (catLower.includes('pet')) {
    categoryIntro = `We love the premium pet care products you are crafting at <strong>${brand.brandName}</strong>! 🐾`;
    creatorShortlistIntro = `We have built a dedicated Pet Care portal and shortlisted verified goldens, huskies, and lifestyle pet creators (like Simba, Oreo, and Sparkle) who are perfect for video reviews and grooming tests.`;
    portalUrl = 'https://creatorarmour.com/pet-care';
    buttonLabel = `👉 View ${brand.brandName} Pet Creator Shortlist`;
  } else if (catLower.includes('food') || catLower.includes('coffee') || catLower.includes('snack') || catLower.includes('beverage') || catLower.includes('dairy')) {
    categoryIntro = `We love the delicious products you are offering at <strong>${brand.brandName}</strong>! 🧑‍🍳🍪`;
    creatorShortlistIntro = `We have verified top-tier healthy recipes, cooking, and clean-eating creators (like Cookku with Chikku, 490K verified average views) who are perfect for creative food vlogs or snack tasting reels.`;
    portalUrl = 'https://creatorarmour.com/pitch/kiro-foods';
    buttonLabel = `👉 View ${brand.brandName} Food Creator Shortlist`;
  } else if (catLower.includes('skin') || catLower.includes('beauty') || catLower.includes('personal') || catLower.includes('groom')) {
    categoryIntro = `We love the amazing personal care formulations you are crafting at <strong>${brand.brandName}</strong>! ✨🧴`;
    creatorShortlistIntro = `We have pre-vetted premium beauty, aesthetic skincare, and grooming creators (like Sneha @blogsbysnehaaa) who produce premium H.264 unboxing and routine integration reels with verified engagement metrics.`;
    portalUrl = 'https://creatorarmour.com/prateek_matoria';
    buttonLabel = `👉 View ${brand.brandName} Beauty Shortlist`;
  } else {
    // General lifestyle/wellness/apparel
    categoryIntro = `We love the premium products you are creating at <strong>${brand.brandName}</strong>! 🌟🛍️`;
    creatorShortlistIntro = `We have pre-vetted premium lifestyle, travel, and fashion creators (like Monika and Rohit) who produce highly aesthetic lifestyle integration reels with true demographic data.`;
    portalUrl = 'https://creatorarmour.com';
    buttonLabel = `👉 Explore Creator Armour OS`;
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
      <div style="margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
        <span style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.025em;">CREATOR<span style="color: #10b981;">ARMOUR</span></span>
        <span style="float: right; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.05em;">Campaign Infrastructure</span>
      </div>

      <p>Hi Team,</p>
      
      <p>Hope you are having a productive week!</p>
      
      <p>${categoryIntro}</p>
      
      <p>Influencer marketing is highly lucrative for D2C brands, but the operations are incredibly painful—chasing creators over Instagram DMs, tracking lost product samples, and manually validating if they fulfilled the brief.</p>
      
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

async function run() {
  const args = process.argv.slice(2);
  const targetEmail = args[0];
  const targetName = args[1] || 'Test D2C Brand';
  const targetCategory = args[2] || 'Food & Snacks';

  if (targetEmail && targetEmail !== '--bulk') {
    // --- SINGLE TEST PREVIEW MODE ---
    console.log(`\n🚀 PREVIEWING & SENDING OUTBOUND EMAIL to ${targetName} (${targetEmail})...`);
    
    const brandPayload: BrandOutreachProps = {
      brandName: targetName,
      category: targetCategory,
      website: 'https://testbrand.com'
    };

    const subject = `Zero-Ops Creator Campaigns & Custom Portal for ${targetName} 🚀📦`;
    const htmlBody = getD2CEmailTemplate(brandPayload);

    try {
      const { data, error } = await resend.emails.send({
        from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
        to: targetEmail,
        reply_to: 'creatorarmour07@gmail.com',
        subject: subject,
        html: htmlBody
      });

      if (error) throw error;
      console.log(`✅ Success! Resend Email ID: ${data?.id}`);
      console.log(`\n📄 Generated Email Subject: "${subject}"`);

    } catch (err: any) {
      console.error(`❌ Failed to send preview email:`, err.message);
    }
  } else if (targetEmail === '--bulk') {
    // --- SAFE BULK CAMPAIGN RUN MODE WITH DUPLICATE PROTECTION ---
    console.log(`\n🚀 INITIATING AUTOMATED BULK OUTREACH CAMPAIGN WITH DUPLICATE PROTECTION...`);
    
    try {
      // 1. Query all brand leads
      const { data: leads, error: leadsError } = await supabase
        .from('brand_leads')
        .select('*');

      if (leadsError) throw leadsError;

      if (!leads || leads.length === 0) {
        console.log('⚠️ No brand leads found in the database. Please run populate-50plus-brands.ts first.');
        return;
      }

      // 2. Strict Filter: Skip already contacted brands
      const uncontactedLeads = leads.filter(l => {
        const isContacted = l.status === 'contacted' || (l.outreach_count && l.outreach_count > 0) || l.last_contacted_at !== null;
        return !isContacted;
      });

      const contactedCount = leads.length - uncontactedLeads.length;

      console.log(`\n🐾 Duplicate Protection Audit:`);
      console.log(`- Total Seeded Leads in DB: ${leads.length}`);
      console.log(`- Already Contacted Brands (SKIPPED): ${contactedCount}`);
      console.log(`- Uncontacted Brands Remaining (TO SEND): ${uncontactedLeads.length}`);
      
      if (uncontactedLeads.length === 0) {
        console.log('\n✅ All seeded brands have already been contacted. Skipping batch run to prevent duplicates!');
        return;
      }

      console.log(`\n📧 Commencing delivery to ${uncontactedLeads.length} uncontacted brands...`);
      let sentCount = 0;

      for (const lead of uncontactedLeads) {
        console.log(`➡️ Sending category-specific pitch to ${lead.brand_name} (${lead.email})...`);
        
        try {
          const brandPayload: BrandOutreachProps = {
            brandName: lead.brand_name,
            category: lead.category || 'Lifestyle',
            website: lead.website || ''
          };

          // Update database BEFORE sending to lock state & absolutely prevent parallel race duplicate sends
          const { error: updateError } = await supabase
            .from('brand_leads')
            .update({
              status: 'contacted',
              outreach_count: (lead.outreach_count || 0) + 1,
              last_contacted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);

          if (updateError) throw updateError;

          // Dispatch Outreach Email via Resend
          const subject = `Zero-Ops Creator Campaigns & Custom Portal for ${lead.brand_name} 🚀📦`;
          const htmlBody = getD2CEmailTemplate(brandPayload);

          const { data, error: sendError } = await resend.emails.send({
            from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
            to: lead.email,
            reply_to: 'creatorarmour07@gmail.com',
            subject: subject,
            html: htmlBody
          });

          if (sendError) throw sendError;

          console.log(`   ✅ Sent! Resend ID: ${data?.id}`);
          sentCount++;

          // Natural rate limit delay (1.5 seconds)
          await new Promise(r => setTimeout(r, 1500));

        } catch (err: any) {
          console.error(`   ❌ Failed to process ${lead.brand_name}:`, err.message);
        }
      }

      console.log(`\n🎉 Bulk Campaign Complete! Successfully sent ${sentCount} outbound pitches with absolute duplicate protection.`);

    } catch (err: any) {
      console.error('❌ Bulk campaign failed:', err.message);
    }
  } else {
    // --- DATABASE BATCH GENERATION REPORT ---
    console.log(`\n🐾 Outbound Outreach Script initialized.`);
    console.log(`- Loaded Resend credentials successfully.`);
    console.log(`- To run a bulk campaign with strict duplicate protection, run:`);
    console.log(`  npx tsx scripts/send-d2c-brand-outreach.ts --bulk`);
    console.log(`- To send a single test email, run:`);
    console.log(`  npx tsx scripts/send-d2c-brand-outreach.ts [your-email] "[Brand Name]" "[Category]"`);
  }
}

run();
export { getD2CEmailTemplate };
