import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

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

interface ClinicDetails {
  name: string;
  email: string;
  website: string;
  category: string; // 'Dentistry' or 'Beauty, Skincare & Grooming' (Dermatology)
  servicesList: string[];
  transitionPhrase: string;
  businessOutcome: string;
  operationsPitch: string;
  notes: string;
}

const targetClinics: ClinicDetails[] = [
  {
    name: 'Comfort Smiles',
    email: 'comfortsmilesdentistry@gmail.com',
    website: 'https://comfortsmiles.in',
    category: 'Dentistry',
    servicesList: [
      'gentle, pain-free dental checkup routines',
      'stress-free patient transformation stories',
      'dentist-who-listens storytelling checkups'
    ],
    transitionPhrase: 'are seeing strong traction with short-form UGC creators right now.',
    businessOutcome: 'Especially for building a relaxed, high-trust reputation and attracting anxious patient consults in Noida Sector 41.',
    operationsPitch: 'Creator Armour is a creator operations layer that helps dental practices handle:',
    notes: 'Comfort Smiles Noida: led by Dr. Divya Dhingra running active gentle dentistry & care ads.'
  },
  {
    name: 'Re-Hab Dental',
    email: 'rehabdentalcentre@gmail.com',
    website: 'https://re-habdental.com',
    category: 'Dentistry',
    servicesList: [
      '3-to-5 day dental implant transformations',
      'painless cortico-basal implant patient reviews',
      'diabetic-safe implant procedure routines'
    ],
    transitionPhrase: 'perform extremely well with short-form UGC creators right now.',
    businessOutcome: 'Especially for consultation-driven discovery and showing visual before/after implant transformations in Noida.',
    operationsPitch: 'Creator Armour acts as a creator coordination layer that helps advanced dental clinics manage:',
    notes: 'Re-Hab Dental Noida: running active revolutionary cortico-basal implant ads.'
  },
  {
    name: 'Skinlogics Derma',
    email: 'skinlogicsclinic@gmail.com',
    website: 'https://www.skinlogics.in',
    category: 'Beauty, Skincare & Grooming',
    servicesList: [
      'fractional CO2 laser & acne scar corrections',
      'dermal-strengthening GFC hair regrowth journeys',
      'instant Hollywood facial glow routines'
    ],
    transitionPhrase: 'work especially well with short-form UGC creators right now.',
    businessOutcome: 'Especially for high-trust clinical discovery and premium procedural bookings in Noida Sector 26.',
    operationsPitch: 'Creator Armour is an established creator operations layer that helps clinical skincare hubs automate:',
    notes: 'Skinlogics Derma Noida: running active value combo & advanced GFC/Fractional ads.'
  },
  {
    name: 'Skinfinity Derma',
    email: 'info@skinfinityderma.com',
    website: 'https://www.skinfinityderma.com',
    category: 'Beauty, Skincare & Grooming',
    servicesList: [
      'USFDA-approved laser hair reduction trials',
      'celebrity dermatologist-led active ingredient tips',
      'exosome therapy & advanced hair restoration reviews'
    ],
    transitionPhrase: 'work incredibly well with short-form UGC creators right now.',
    businessOutcome: 'Especially for high-authority clinic discovery and procedural bookings in Noida Sector 36.',
    operationsPitch: 'Creator Armour acts as a dedicated creator operations layer that helps medical aesthetic brands manage:',
    notes: 'Skinfinity Derma Noida: led by Dr. Ipshita Johri running active celebrity-endorsed LHR & exosome ads.'
  },
  {
    name: 'Zanishaa Aesthetics',
    email: 'info@zanishaaaesthetics.com',
    website: 'https://zanishaaaesthetics.com',
    category: 'Beauty, Skincare & Grooming',
    servicesList: [
      'deep HydraFacial treatments for Noida pollution',
      'instant 45-minute clinical skin reset setups',
      'painless Alma Soprano Ice full body hair reductions'
    ],
    transitionPhrase: 'are seeing massive traction with short-form UGC creators right now.',
    businessOutcome: 'Especially for local walk-in discovery and high-end aesthetic appointment bookings in Noida Sector 104.',
    operationsPitch: 'We operate Creator Armour — a specialized creator operations system that helps premium clinics manage:',
    notes: 'Zanishaa Aesthetics Noida: running active pollution-combating HydraFacial & Alma Soprano LHR ads.'
  }
];

function getEmailTemplate(c: ClinicDetails): string {
  const emoji = c.category === 'Dentistry' ? '✨🦷' : '✨🧴';
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 20px;">
      <p>Hi Team 👋</p>

      <p>Came across <strong>${c.name}</strong> and honestly the content direction already feels very creator-native.</p>

      <p>Services like:</p>
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        ${c.servicesList.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
      </ul>
      <p>${c.transitionPhrase} ${c.businessOutcome}</p>

      <p>${c.operationsPitch}</p>
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        <li style="margin-bottom: 6px;">creator sourcing (wellness, skin, and lifestyle)</li>
        <li style="margin-bottom: 6px;">barter/paid collaborations and local content production</li>
        <li style="margin-bottom: 6px;">content delivery tracking</li>
        <li style="margin-bottom: 6px;">creator follow-ups</li>
      </ul>
      <p>without handling everything manually on DMs & sheets.</p>

      <p>We’d love to help <strong>${c.name}</strong> run a small creator pilot with local creators already active on our side in Delhi-NCR.</p>

      <p>No onboarding/setup cost for early partner brands ✨</p>

      <p style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #1f2937;">
        — <strong>Pratyush</strong><br>
        Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #ec4899; font-weight: bold; text-decoration: none;">creatorarmour.com</a>
      </p>
    </div>
  `;
}

async function sendOutreach() {
  const isDryRun = process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('🧪 DRY RUN MODE ENABLED. No emails will be sent. Database updates will not be committed.');
  }

  console.log(`🚀 Starting Noida local dentist & dermatologist outreach to ${targetClinics.length} targets...`);
  const results: any[] = [];

  for (const c of targetClinics) {
    console.log(`\n➡️ Processing ${c.name} (${c.email})...`);
    try {
      // 1. Check local offline state cache first to prevent duplicate outreach
      const localStatePath = join(process.cwd(), 'scratch', 'outreach_local_state.json');
      let localState: any = { d2c_brands: {} };
      if (fs.existsSync(localStatePath)) {
        localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
      }
      
      const localRecord = localState.d2c_brands?.[c.name];
      if (localRecord && localRecord.status === 'contacted' && localRecord.outreach_count > 0) {
        console.warn(`   ⚠️ WARNING: [Duplicate Protection] ${c.name} is already contacted in local state (count: ${localRecord.outreach_count}, last: ${localRecord.last_contacted_at}). Skipping!`);
        results.push({ name: c.name, email: c.email, status: 'Skipped (Duplicate Local)', error: 'Already contacted locally' });
        continue;
      }

      // 2. Check live Supabase DB
      const { data: existingLead, error: selectError } = await supabase
        .from('brand_leads')
        .select('*')
        .eq('brand_name', c.name)
        .maybeSingle();

      if (selectError) {
        throw new Error(`Supabase check failed: ${selectError.message}`);
      }

      if (existingLead && existingLead.status === 'contacted' && (existingLead.outreach_count || 0) > 0) {
        console.warn(`   ⚠️ WARNING: [Duplicate Protection] ${c.name} is already contacted in live Supabase DB (count: ${existingLead.outreach_count}, last: ${existingLead.last_contacted_at}). Skipping!`);
        results.push({ name: c.name, email: c.email, status: 'Skipped (Duplicate DB)', error: 'Already contacted in DB' });
        continue;
      }

      const nextOutreachCount = existingLead ? (existingLead.outreach_count || 0) + 1 : 1;
      const lastContactedAt = new Date().toISOString();

      const leadPayload = {
        brand_name: c.name,
        website: c.website,
        email: c.email,
        category: c.category,
        status: 'contacted',
        outreach_count: nextOutreachCount,
        last_contacted_at: lastContactedAt,
        notes: `Noida clinic ad outreach: ${c.notes}`
      };

      if (!isDryRun) {
        // 3. Update Supabase DB
        if (existingLead) {
          const { error: updateError } = await supabase.from('brand_leads').update(leadPayload).eq('id', existingLead.id);
          if (updateError) throw updateError;
          console.log(`   ✅ Supabase lead updated for ${c.name}`);
        } else {
          const { error: insertError } = await supabase.from('brand_leads').insert(leadPayload);
          if (insertError) throw insertError;
          console.log(`   ✅ Supabase lead created for ${c.name}`);
        }

        // 4. Update local offline state JSON cache
        if (!localState.d2c_brands) localState.d2c_brands = {};
        localState.d2c_brands[c.name] = {
          email: c.email,
          website: c.website,
          category: c.category,
          status: 'contacted',
          outreach_count: nextOutreachCount,
          last_contacted_at: lastContactedAt
        };
        fs.writeFileSync(localStatePath, JSON.stringify(localState, null, 2), 'utf8');
        console.log(`   ✅ Local state JSON updated for ${c.name}`);

        const emoji = c.category === 'Dentistry' ? '✨🦷' : '✨🧴';
        // 5. Dispatch Email via Resend
        const { data, error } = await resend.emails.send({
          from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
          to: c.email,
          reply_to: 'creatorarmour07@gmail.com',
          subject: `Custom ${c.name} Creator Portal + Campaign Infrastructure ${emoji}`,
          html: getEmailTemplate(c)
        });

        if (error) throw error;
        console.log(`   ✅ Email successfully sent! Resend ID: ${data?.id}`);
        results.push({ name: c.name, email: c.email, status: 'Sent', id: data?.id });
      } else {
        console.log(`   🧪 [Dry Run] Would update Supabase & Local Cache with:`, JSON.stringify(leadPayload, null, 2));
        console.log(`   🧪 [Dry Run] Would send email to: ${c.email} using template:\n`, getEmailTemplate(c).substring(0, 500) + '...\n');
        results.push({ name: c.name, email: c.email, status: 'Dry Run Success' });
      }

      // Add a defensive sleep delay to protect API limits
      await new Promise(r => setTimeout(r, 1500));

    } catch (err: any) {
      console.error(`   ❌ Failed processing ${c.name}:`, err.message);
      results.push({ name: c.name, email: c.email, status: 'Failed', error: err.message });
    }
  }

  console.log('\n✨ NOIDA CLINICS OUTREACH RESULTS SUMMARY:');
  console.table(results);
}

sendOutreach().catch(console.error);
