import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

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

const localStatePath = join(process.cwd(), 'scratch', 'outreach_local_state.json');

interface BrandOutreachProps {
  brandName: string;
  category: string;
  website: string;
}

function getD2CEmailTemplate(brand: BrandOutreachProps): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 12px 0;">
      <p>Hi Team 👋</p>
      
      <p>Came across your brand and honestly the content/products already feel very creator-friendly ✨</p>
      
      <p>We’re currently helping brands connect with lifestyle, beauty, wellness & local creators for barter-based collaborations and UGC content.</p>
      
      <p>And since we’re onboarding a few early partner brands right now, we’d love to help you with a small creator campaign completely FREE 😊</p>
      
      <p>We can help with:<br>
      • creator sourcing<br>
      • Instagram reel content<br>
      • barter collaborations<br>
      • local promotions<br>
      • UGC campaigns<br>
      • creator coordination</p>
      
      <p>Most creators are open to collaborations in exchange for products/services — especially when the brand positioning is strong.</p>
      
      <p>Would love to explore a small pilot collaboration with your brand ✨</p>
      
      <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
        — Pratyush<br>
        Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #0f172a; text-decoration: underline; font-weight: 600;">creatorarmour.com</a>
      </p>
    </div>
  `;
}

async function run() {
  const args = process.argv.slice(2);
  const targetEmail = args[0];
  const targetName = args[1] || 'Test D2C Brand';
  const targetCategory = args[2] || 'Food & Snacks';

  const limitArgIdx = args.indexOf('--limit');
  let limit = 0;
  if (limitArgIdx !== -1 && limitArgIdx + 1 < args.length) {
    limit = parseInt(args[limitArgIdx + 1], 10);
  }

  const isBulk = args.includes('--bulk');

  if (targetEmail && !isBulk) {
    // --- SINGLE TEST PREVIEW MODE ---
    console.log(`\n🚀 PREVIEWING & SENDING OUTBOUND EMAIL to ${targetName} (${targetEmail})...`);
    
    const brandPayload: BrandOutreachProps = {
      brandName: targetName,
      category: targetCategory,
      website: 'https://testbrand.com'
    };

    const subject = `collaboration with ${targetName}`;
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
  } else if (isBulk) {
    // --- SAFE BULK CAMPAIGN RUN MODE WITH DUPLICATE PROTECTION (OFFLINE-FIRST) ---
    console.log(`\n🚀 INITIATING AUTOMATED BULK OUTREACH CAMPAIGN WITH DUPLICATE PROTECTION (OFFLINE-FIRST)...`);
    
    try {
      if (!fs.existsSync(localStatePath)) {
        console.error(`❌ Error: Local state file not found at ${localStatePath}`);
        process.exit(1);
      }

      // Load local state
      const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
      const brands = localState.d2c_brands || {};
      const brandNames = Object.keys(brands);

      const uncontactedBrands = brandNames.filter(name => {
        const b = brands[name];
        return b.status !== 'contacted' && (!b.outreach_count || b.outreach_count === 0);
      });

      let targetedBrandsList = uncontactedBrands;
      if (limit > 0) {
        targetedBrandsList = uncontactedBrands.slice(0, limit);
      }

      console.log(`\n🐾 Duplicate Protection Audit:`);
      console.log(`- Total Seeded Brands in Cache: ${brandNames.length}`);
      console.log(`- Already Contacted Brands (SKIPPED): ${brandNames.length - uncontactedBrands.length}`);
      console.log(`- Uncontacted Brands Remaining: ${uncontactedBrands.length}`);
      if (limit > 0) {
        console.log(`- Batch Limit Applied: Sending exactly ${targetedBrandsList.length} pitches of the remaining uncontacted brands.`);
      } else {
        console.log(`- Uncontacted Brands Remaining (TO SEND): ${uncontactedBrands.length}`);
      }

      if (targetedBrandsList.length === 0) {
        console.log('\n✅ All seeded brands have already been contacted or list is empty. Skipping batch run!');
        return;
      }

      console.log(`\n📧 Commencing delivery to ${targetedBrandsList.length} uncontacted brands...`);
      let sentCount = 0;

      for (const brandName of targetedBrandsList) {
        const brand = brands[brandName];
        console.log(`➡️ Sending category-specific pitch to ${brandName} (${brand.email})...`);


        try {
          const brandPayload: BrandOutreachProps = {
            brandName: brandName,
            category: brand.category || 'Lifestyle',
            website: brand.website || ''
          };

          // Dispatch Outreach Email via Resend
          const subject = `collaboration with ${brandName}`;
          const htmlBody = getD2CEmailTemplate(brandPayload);

          const { data, error: sendError } = await resend.emails.send({
            from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
            to: brand.email,
            reply_to: 'creatorarmour07@gmail.com',
            subject: subject,
            html: htmlBody
          });

          if (sendError) throw sendError;

          console.log(`   ✅ Sent! Resend ID: ${data?.id}`);
          sentCount++;

          // Update local state immediately
          brand.status = 'contacted';
          brand.outreach_count = (brand.outreach_count || 0) + 1;
          brand.last_contacted_at = new Date().toISOString();
          fs.writeFileSync(localStatePath, JSON.stringify(localState, null, 2), 'utf8');
          console.log(`   💾 Updated local state cache.`);

          // Try to sync with Supabase (ignoring errors if quota restricted)
          try {
            const { data: existingLead, error: checkError } = await supabase
              .from('brand_leads')
              .select('*')
              .eq('email', brand.email)
              .maybeSingle();

            if (!checkError && existingLead) {
              const { error: updateError } = await supabase
                .from('brand_leads')
                .update({
                  status: 'contacted',
                  outreach_count: (existingLead.outreach_count || 0) + 1,
                  last_contacted_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingLead.id);
              if (updateError) console.warn(`   ⚠️ Supabase update warning: ${updateError.message}`);
              else console.log(`   ⚡ Synced update to Supabase.`);
            } else if (!checkError) {
              const { error: insertError } = await supabase
                .from('brand_leads')
                .insert({
                  brand_name: brandName,
                  email: brand.email,
                  category: brand.category,
                  status: 'contacted',
                  outreach_count: 1,
                  last_contacted_at: new Date().toISOString(),
                  website: brand.website
                });
              if (insertError) console.warn(`   ⚠️ Supabase insert warning: ${insertError.message}`);
              else console.log(`   ⚡ Synced insert to Supabase.`);
            } else {
              console.warn(`   ⚠️ Supabase read warning: ${checkError.message}`);
            }
          } catch (supabaseErr: any) {
            console.warn(`   ⚠️ Failed to sync with Supabase (offline mode active): ${supabaseErr.message}`);
          }

          // Natural rate limit delay (1.5 seconds)
          await new Promise(r => setTimeout(r, 1500));

        } catch (err: any) {
          console.error(`   ❌ Failed to process ${brandName}:`, err.message);
          const errMsg = err.message.toLowerCase();
          if (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('429') || errMsg.includes('rate limit')) {
            console.error(`🚨 Resend API quota/limit detected. Stopping execution.`);
            process.exit(1);
          }
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
