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

interface LeadProps {
  clinicName: string;
  doctorName: string;
  email: string;
  treatmentKeyword: string;
  locationKeyword: string;
  category: 'Dentistry' | 'Dermatology' | 'Salon';
}

const localStatePath = join(process.cwd(), 'scratch', 'outreach_local_state.json');

function getEmailTemplate(lead: LeadProps): string {
  const isDoc = lead.category === 'Dentistry' || lead.category === 'Dermatology';
  let salutation = 'Hi,';
  if (isDoc) {
    salutation = lead.doctorName.toLowerCase().includes('doctor') || lead.doctorName.toLowerCase().includes('dr.') 
      ? 'Hi Doctor,' 
      : `Hi ${lead.doctorName},`;
  }

  if (lead.category === 'Dentistry') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 12px 0;">
        <p>${salutation}</p>
        
        <p>Came across <strong>${lead.clinicName}</strong> and noticed you already have strong patient trust and great Google reviews.</p>
        
        <p>Many patients today discover dental clinics through Instagram and creator-led local recommendations before booking appointments.</p>
        
        <p>At Creator Armour, we help clinics collaborate with local creators for:<br>
        • smile makeover reels<br>
        • teeth whitening content<br>
        • clinic experience videos<br>
        • local awareness campaigns</p>
        
        <p>We manage the entire process:<br>
        • creator sourcing<br>
        • campaign coordination<br>
        • content workflow management</p>
        
        <p>Collaborations can also work through barter services at your <strong>${lead.locationKeyword}</strong> clinic such as:<br>
        • teeth cleaning<br>
        • whitening sessions<br>
        • dental consultations<br>
        • smile analysis</p>
        
        <p>in exchange for creator content and Instagram promotion.</p>
        
        <p>We’d love to offer the first collaboration campaign completely free to demonstrate the results and workflow.</p>
        
        <p>Would love to connect for a quick discussion.</p>
        
        <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
          Regards,<br>
          <strong>Pratyush Raj</strong><br>
          Creator Armour<br>
          <a href="https://creatorarmour.com" style="color: #0f172a; text-decoration: underline; font-weight: 600;">creatorarmour.com</a>
        </p>
      </div>
    `;
  } else if (lead.category === 'Dermatology') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 12px 0;">
        <p>${salutation}</p>
        
        <p>Came across <strong>${lead.clinicName}</strong> and really liked the clinic’s branding and online presence.</p>
        
        <p>Today, many skincare and aesthetic clinics are growing through creator-led Instagram content and local word-of-mouth visibility.</p>
        
        <p>At Creator Armour, we help clinics collaborate with local creators for:<br>
        • skincare/clinic experience reels<br>
        • treatment awareness content<br>
        • UGC & influencer campaigns<br>
        • local Instagram visibility</p>
        
        <p>We handle the complete coordination process, including creator sourcing and campaign management.</p>
        
        <p>We can also structure collaborations through barter services at your <strong>${lead.locationKeyword}</strong> clinic such as:<br>
        • hydrafacials<br>
        • skin consultations<br>
        • laser sessions<br>
        • skincare treatments</p>
        
        <p>in exchange for authentic Instagram content and promotions.</p>
        
        <p>We’d love to offer the first creator campaign completely free so you can experience the workflow and results before committing long-term.</p>
        
        <p>Would love to connect for a quick discussion.</p>
        
        <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
          Regards,<br>
          <strong>Pratyush Raj</strong><br>
          Creator Armour<br>
          <a href="https://creatorarmour.com" style="color: #0f172a; text-decoration: underline; font-weight: 600;">creatorarmour.com</a>
        </p>
      </div>
    `;
  } else {
    // Salon
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 12px 0;">
        <p>Hi,</p>
        
        <p>Came across <strong>${lead.clinicName}</strong> and honestly the work and aesthetics look amazing.</p>
        
        <p>Beauty and salon businesses today grow heavily through Instagram reels, creator content, and local influencer visibility.</p>
        
        <p>At Creator Armour, we help salons collaborate with local creators for:<br>
        • makeover reels<br>
        • hair transformation content<br>
        • bridal shoots<br>
        • salon experience videos<br>
        • beauty influencer campaigns</p>
        
        <p>We handle the entire workflow:<br>
        • influencer sourcing<br>
        • coordination<br>
        • campaign management<br>
        • content tracking</p>
        
        <p>Collaborations can also be structured through barter services at your <strong>${lead.locationKeyword}</strong> salon such as:<br>
        • hair services<br>
        • facials<br>
        • makeover sessions<br>
        • bridal trials<br>
        • beauty treatments</p>
        
        <p>in exchange for authentic creator content and promotions.</p>
        
        <p>We’d love to offer the first creator collaboration campaign completely free so you can experience the impact firsthand.</p>
        
        <p>Would love to connect for a quick discussion.</p>
        
        <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
          Regards,<br>
          <strong>Pratyush Raj</strong><br>
          Creator Armour<br>
          <a href="https://creatorarmour.com" style="color: #0f172a; text-decoration: underline; font-weight: 600;">creatorarmour.com</a>
        </p>
      </div>
    `;
  }
}

async function run() {
  const args = process.argv.slice(2);
  const categoryArg = args.find(arg => arg.startsWith('--category='));
  
  if (!categoryArg) {
    console.error('❌ Error: Missing --category argument (e.g. --category=dentists, --category=dermatologists, --category=salons)');
    process.exit(1);
  }

  const categoryKey = categoryArg.split('=')[1] as 'dentists' | 'dermatologists' | 'salons';
  
  if (!['dentists', 'dermatologists', 'salons'].includes(categoryKey)) {
    console.error('❌ Error: Invalid category. Must be one of: dentists, dermatologists, salons');
    process.exit(1);
  }

  console.log(`\n🚀 INITIATING PATNA ${categoryKey.toUpperCase()} LOCAL OUTREACH CAMPAIGN (OFFLINE-FIRST)...`);
  
  if (!fs.existsSync(localStatePath)) {
    console.error(`❌ Error: Local state file not found at ${localStatePath}`);
    process.exit(1);
  }

  // Load local state
  const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
  const leads = localState[categoryKey] || {};
  
  const leadNames = Object.keys(leads);
  console.log(`Total Leads in Cache for ${categoryKey}: ${leadNames.length}`);
  
  let sentCount = 0;
  let categoryMapped: 'Dentistry' | 'Dermatology' | 'Salon' = 'Dentistry';
  let subjectEmoji = '🦷✨';
  if (categoryKey === 'dermatologists') {
    categoryMapped = 'Dermatology';
    subjectEmoji = '🩺✨';
  } else if (categoryKey === 'salons') {
    categoryMapped = 'Salon';
    subjectEmoji = '💇‍♀️✨';
  }

  for (const clinicName of leadNames) {
    const leadData = leads[clinicName];
    const email = leadData.email;

    // Check if already contacted in local cache
    if (leadData.status === 'contacted' || (leadData.outreach_count && leadData.outreach_count > 0)) {
      console.log(`⏭️ Skipping ${clinicName} (${email}) - already marked contacted.`);
      continue;
    }

    console.log(`➡️ Processing ${clinicName} (${email})...`);

    const lead: LeadProps = {
      clinicName: clinicName,
      doctorName: leadData.doctorName,
      email: email,
      treatmentKeyword: leadData.treatmentKeyword,
      locationKeyword: leadData.locationKeyword,
      category: categoryMapped
    };

    const subject = `local creator campaign for ${clinicName} ${subjectEmoji}`;
    const htmlBody = getEmailTemplate(lead);

    try {
      // 1. Dispatch email via Resend
      const { data, error: sendError } = await resend.emails.send({
        from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
        to: email,
        replyTo: 'creatorarmour07@gmail.com',
        subject: subject,
        html: htmlBody
      });

      if (sendError) {
        throw sendError;
      }

      console.log(`   ✅ Sent successfully! Resend ID: ${data?.id}`);
      sentCount++;

      // 2. Update local state immediately
      leadData.status = 'contacted';
      leadData.outreach_count = (leadData.outreach_count || 0) + 1;
      leadData.last_contacted_at = new Date().toISOString();
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
          console.warn(`   ⚠️ Supabase read warning: ${checkError.message}`);
        } else {
          const leadPayload = {
            brand_name: clinicName,
            email: email,
            category: categoryMapped,
            status: 'contacted',
            outreach_count: existingLead ? (existingLead.outreach_count || 0) + 1 : 1,
            last_contacted_at: new Date().toISOString(),
            website: existingLead?.website || '',
            notes: `Contact: ${leadData.doctorName} | Location: ${leadData.locationKeyword}`
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

  console.log(`\n🎉 Campaign Complete! Dispatched ${sentCount} outbound pitches to Patna ${categoryMapped} leads.`);
}

run();
