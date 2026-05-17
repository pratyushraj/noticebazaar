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

const targetBrands = [
  { name: 'TailBlaze', email: 'hello@tailblaze.com', website: 'https://tailblaze.com' },
  { name: 'Pawpeye', email: 'pawpeye@gmail.com', website: 'https://pawpeye.com' },
  { name: 'Dogkart', email: 'support@dogkart.in', website: 'https://dogkart.in' },
  { name: "Ollie's Paw", email: 'hello@olliespaw.com', website: 'https://olliespaw.com' }
];

function getPetEmailTemplate(brandName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>Hi Team,</p>
      
      <p>Hope you and your furry clients are having a fantastic week! 🐾</p>
      
      <p>To showcase how Creator Armour can help scale <strong>${brandName}</strong>, we created a custom, pre-vetted pet-creator collaboration portal specifically for you:</p>
      
      <p style="margin: 24px 0; text-align: center;">
        <a href="https://creatorarmour.com/pet-care" style="display: inline-block; background-color: #d9a74a; color: #1e3f20; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 9999px; border: 2px solid #1e3f20; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          👉 View ${brandName} Pre-Vetted Pet Shortlist
        </a>
      </p>
      
      <p>We’ve handpicked active golden retrievers, playful huskies, rescue dog packs, and cute lifestyle cats from our verified creator squad (like Simba, Oreo, and Sparkle). They are pre-vetted and perfect for featuring your products in heart-warming UGC reels, chewing tests, or grooming reviews.</p>
      
      <p>Beyond matching you with the right pet creators, Creator Armour manages the entire operational lifecycle of your campaigns:</p>
      
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        <li style="margin-bottom: 8px;"><strong>Sample Box Shipping:</strong> Automated tracking labels and weight-based logistics updates.</li>
        <li style="margin-bottom: 8px;"><strong>WhatsApp Sync:</strong> Automated campaign brief delivery and schedule reminders via WhatsApp (no DM chasing).</li>
        <li style="margin-bottom: 8px;"><strong>Protected Payouts:</strong> Escrow-based security where payouts only release after the live video complies with your tags.</li>
      </ul>
      
      <p>Would love to run a small test collaboration with 1-2 shortlisted pet creators to show you how seamless our campaign workflow is.</p>
      
      <p>Happy to jump on a quick 10-minute sync this week to explore this! 😊</p>
      
      <p style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #1f2937;">
        Regards,<br>
        <strong>Pratyush Raj</strong><br>
        Founder — Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #1e3f20; font-weight: bold; text-decoration: none;">creatorarmour.com</a>
      </p>
    </div>
  `;
}

async function sendOutreach() {
  const args = process.argv.slice(2);
  const targetEmail = args[0];
  const targetName = args[1];

  if (targetEmail) {
    // Single Test Send Mode
    const name = targetName || 'Test Pet Brand';
    console.log(`🚀 Sending CUSTOM PORTAL test email to ${name} (${targetEmail})...`);
    
    try {
      const { data, error } = await resend.emails.send({
        from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
        to: targetEmail,
        reply_to: 'creatorarmour07@gmail.com',
        subject: `Custom Pet Creator Portal + Campaign Infrastructure for ${name} 🐾🐶`,
        html: getPetEmailTemplate(name)
      });

      if (error) throw error;
      console.log(`✅ Success! Resend ID: ${data?.id}`);
    } catch (err: any) {
      console.error(`❌ Failed:`, err.message);
    }
  } else {
    // Bulk Send Mode to Verified Active Pet Leads
    console.log(`🚀 Sending CUSTOM PORTAL outreach to active pet brands...`);
    const results: any[] = [];

    for (const b of targetBrands) {
      console.log(`➡️ Sending to ${b.name} (${b.email})...`);
      try {
        // Track the brand lead in Supabase first
        const { data: existingLead } = await supabase
          .from('brand_leads')
          .select('*')
          .eq('brand_name', b.name)
          .maybeSingle();

        const leadPayload = {
          brand_name: b.name,
          website: b.website,
          email: b.email,
          category: 'Pet Care',
          status: 'contacted',
          outreach_count: existingLead ? (existingLead.outreach_count || 0) + 1 : 1,
          last_contacted_at: new Date().toISOString(),
          contact_name: 'Marketing Team',
          notes: 'Sent custom pet portal email.'
        };

        if (existingLead) {
          await supabase.from('brand_leads').update(leadPayload).eq('id', existingLead.id);
        } else {
          await supabase.from('brand_leads').insert(leadPayload);
        }

        const { data, error } = await resend.emails.send({
          from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
          to: b.email,
          reply_to: 'creatorarmour07@gmail.com',
          subject: `Custom Pet Creator Portal + Campaign Infrastructure for ${b.name} 🐾🐶`,
          html: getPetEmailTemplate(b.name)
        });

        if (error) throw error;
        console.log(`   ✅ Success! Resend ID: ${data?.id}`);
        results.push({ name: b.name, email: b.email, status: 'Sent', id: data?.id });
      } catch (err: any) {
        console.error(`   ❌ Failed to send to ${b.name}:`, err.message);
        results.push({ name: b.name, email: b.email, status: 'Failed', error: err.message });
      }

      await new Promise(r => setTimeout(r, 1500));
    }

    console.log('\n🐾 PET OUTREACH RESULTS:');
    console.table(results);
  }
}

sendOutreach();
