import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

interface DentistOutreachProps {
  clinicName: string;
  doctorName: string;
  email: string;
  treatmentKeyword: string;
  locationKeyword: string;
}

const localStatePath = join(process.cwd(), 'scratch', 'outreach_local_state.json');

function getDentistEmailTemplate(lead: DentistOutreachProps): string {
  const salutation = lead.doctorName.toLowerCase().includes('doctor') ? 'Hi Doctor,' : `Hi ${lead.doctorName},`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 12px 0;">
      <p>${salutation}</p>
      
      <p>Came across <strong>${lead.clinicName}</strong> and really liked the clinic’s branding and online presence 👏</p>
      
      <p>We’re currently helping clinics run simple local creator campaigns to improve Instagram visibility and patient trust.</p>
      
      <p>For the first campaign itself, we would handle:<br>
      • onboarding 2–3 local Patna creators<br>
      • coordinating the shoot/content at your ${lead.locationKeyword} clinic<br>
      • ensuring reels + stories get posted<br>
      • promoting treatments like ${lead.treatmentKeyword}, etc.</p>
      
      <p>The idea is simple:<br>
      Creators visit the clinic, create authentic content around their experience, and help the clinic reach more local audiences organically.</p>
      
      <p>You don’t have to manage influencer DMs or coordination manually — we handle that side.</p>
      
      <p>Would love to share a few creator profiles and campaign ideas specifically for ${lead.clinicName} if you’re open 🙂</p>
      
      <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
        Best regards,<br>
        <strong>Pratyush Raj</strong><br>
        Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #0f172a; text-decoration: underline; font-weight: 600;">creatorarmour.com</a>
      </p>
    </div>
  `;
}

async function run() {
  console.log(`\n🚀 INITIATING PATNA DENTISTS LOCAL OUTREACH CAMPAIGN (OFFLINE-FIRST)...`);
  
  if (!fs.existsSync(localStatePath)) {
    console.error(`❌ Error: Local state file not found at ${localStatePath}`);
    process.exit(1);
  }

  // Load local state
  const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
  const dentists = localState.dentists || {};
  
  const clinicNames = Object.keys(dentists);
  console.log(`Total Leads in Cache: ${clinicNames.length}`);
  
  let sentCount = 0;

  for (const clinicName of clinicNames) {
    const dentist = dentists[clinicName];
    const email = dentist.email;

    // Check if already contacted in local cache
    if (dentist.status === 'contacted' || (dentist.outreach_count && dentist.outreach_count > 0)) {
      console.log(`⏭️ Skipping ${clinicName} (${email}) - already marked contacted.`);
      continue;
    }

    console.log(`➡️ Processing ${clinicName} (${email})...`);

    const lead: DentistOutreachProps = {
      clinicName: clinicName,
      doctorName: dentist.doctorName,
      email: email,
      treatmentKeyword: dentist.treatmentKeyword,
      locationKeyword: dentist.locationKeyword
    };

    const subject = `local creator campaign for ${clinicName} 🦷✨`;
    const htmlBody = getDentistEmailTemplate(lead);

    try {
      // 1. Dispatch email via Resend
      const { data, error: sendError } = await resend.emails.send({
        from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
        to: email,
        reply_to: 'creatorarmour07@gmail.com',
        subject: subject,
        html: htmlBody
      });

      if (sendError) {
        throw sendError;
      }

      console.log(`   ✅ Sent successfully! Resend ID: ${data?.id}`);
      sentCount++;

      // 2. Update local state immediately
      dentist.status = 'contacted';
      dentist.outreach_count = (dentist.outreach_count || 0) + 1;
      dentist.last_contacted_at = new Date().toISOString();
      fs.writeFileSync(localStatePath, JSON.stringify(localState, null, 2), 'utf8');
      console.log(`   💾 Updated local state cache.`);

      // 3. Try to sync with Supabase (ignoring errors if quota restricted)
      try {
        const { data: existingLead, error: checkError } = await supabase
          .from('brand_leads')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (checkError) {
          console.warn(`   ⚠️ Supabase read warning (probably quota restricted): ${checkError.message}`);
        } else {
          const leadPayload = {
            brand_name: clinicName,
            email: email,
            category: 'Dentistry',
            status: 'contacted',
            outreach_count: existingLead ? (existingLead.outreach_count || 0) + 1 : 1,
            last_contacted_at: new Date().toISOString(),
            contact_name: dentist.doctorName,
            website: existingLead?.website || ''
          };

          if (existingLead) {
            const { error: updateError } = await supabase
              .from('brand_leads')
              .update(leadPayload)
              .eq('id', existingLead.id);
            if (updateError) console.warn(`   ⚠️ Supabase update warning: ${updateError.message}`);
            else console.log(`   ⚡ Synced update to Supabase.`);
          } else {
            const { error: insertError } = await supabase
              .from('brand_leads')
              .insert(leadPayload);
            if (insertError) console.warn(`   ⚠️ Supabase insert warning: ${insertError.message}`);
            else console.log(`   ⚡ Synced insert to Supabase.`);
          }
        }
      } catch (supabaseErr: any) {
        console.warn(`   ⚠️ Failed to sync with Supabase (offline mode active): ${supabaseErr.message}`);
      }

      // Rate limit delay (1.5 seconds) between calls
      await new Promise(r => setTimeout(r, 1500));

    } catch (err: any) {
      console.error(`   ❌ Failed to process ${clinicName}:`, err.message);
      // Guard against quota/limit errors to prevent infinite loops
      const errMsg = err.message.toLowerCase();
      if (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('429') || errMsg.includes('rate limit')) {
        console.error(`🚨 Resend API quota/limit detected. Stopping execution.`);
        process.exit(1);
      }
    }
  }

  console.log(`\n🎉 Campaign Complete! Dispatched ${sentCount} outbound pitches to Patna Dentists.`);
}

run();
