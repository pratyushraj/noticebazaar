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

interface BrandDetails {
  name: string;
  email: string;
  website: string;
  category: string;
  productsList: string[];
  transitionPhrase: string;
  businessOutcome: string;
  notes: string;
}

const targetBrands: BrandDetails[] = [
  { 
    name: 'GoBest Dentist', 
    email: 'info@gobestdentist.com', 
    website: 'https://www.gobestdentist.com', 
    category: 'Dentistry',
    productsList: [
      'affordable invisible aligner trials',
      'braces transformation check-ins',
      'ortho braces routine updates'
    ],
    transitionPhrase: 'perform extremely well with short-form UGC creators right now.',
    businessOutcome: 'Especially for local patient acquisition and clinic discovery on Instagram.',
    notes: 'GoBest Dentist is a multi-clinic regional dental chain in Pune running aligner/implant ads.'
  },
  { 
    name: 'Dezy', 
    email: 'support@dezy.mobi', 
    website: 'https://dezy.com', 
    category: 'Dentistry',
    productsList: [
      'same-day tooth replacement journeys',
      'advanced clear aligner transformations',
      'clinical dental implant case check-ins'
    ],
    transitionPhrase: 'work especially well with short-form UGC creators right now.',
    businessOutcome: 'Especially for consultation-driven dental discovery and high-trust patient acquisition.',
    notes: 'Dezy is a leading tech-first dental clinic chain and clear aligner D2C brand.'
  },
  { 
    name: 'Bentodent', 
    email: 'info@bentodent.in', 
    website: 'https://bentodent.in', 
    category: 'Dentistry',
    productsList: [
      'fluoride-free natural clay toothpastes',
      'chemical-free earthy oral care routines',
      'organic clay-based toothpaste trials'
    ],
    transitionPhrase: 'are seeing strong traction with short-form UGC creators right now.',
    businessOutcome: 'Especially for D2C customer acquisition and health-conscious trust-building on Instagram.',
    notes: 'Bentodent is a D2C natural clay-based organic toothpaste brand.'
  },
  { 
    name: 'MyOrl-Care', 
    email: 'contact@myorlcare.com', 
    website: 'https://myorlcare.com', 
    category: 'Dentistry',
    productsList: [
      'dentist-designed 3-sided manual toothbrushes',
      'advanced "My1Brush" oral cleaning trials',
      'dentist-approved gum health checklists'
    ],
    transitionPhrase: 'work incredibly well with short-form UGC creators right now.',
    businessOutcome: 'Especially for product education and visual UGC-driven D2C sales on Instagram.',
    notes: 'MyOrl-Care represents D2C innovative dentist-designed oral care accessories.'
  }
];

function getDentalEmailTemplate(b: BrandDetails): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 20px;">
      <p>Hi Team 👋</p>

      <p>Came across <strong>${b.name}</strong> and honestly the content direction already feels very creator-native.</p>

      <p>Products like:</p>
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        ${b.productsList.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
      </ul>
      <p>${b.transitionPhrase} ${b.businessOutcome}</p>

      <p>Creator Armour is a creator operations layer that helps oral care brands manage:</p>
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        <li style="margin-bottom: 6px;">creator sourcing</li>
        <li style="margin-bottom: 6px;">barter/paid collaborations</li>
        <li style="margin-bottom: 6px;">content tracking</li>
        <li style="margin-bottom: 6px;">creator follow-ups</li>
      </ul>
      <p>without handling everything manually on DMs & sheets.</p>

      <p>We’d love to help <strong>${b.name}</strong> run a small creator pilot with lifestyle/wellness creators already active on our side.</p>

      <p>No onboarding/setup cost for early partner brands ✨</p>

      <p>Would love to connect if this sounds relevant.</p>

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

  console.log(`🚀 Starting dental outreach to ${targetBrands.length} brands...`);
  const results: any[] = [];

  for (const b of targetBrands) {
    console.log(`\n➡️ Processing ${b.name} (${b.email})...`);
    try {
      // 1. Check local offline state cache first to prevent duplicate outreach
      const localStatePath = join(process.cwd(), 'scratch', 'outreach_local_state.json');
      let localState: any = { d2c_brands: {} };
      if (fs.existsSync(localStatePath)) {
        localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
      }
      
      const localRecord = localState.d2c_brands?.[b.name];
      if (localRecord && localRecord.status === 'contacted' && localRecord.outreach_count > 0) {
        console.warn(`   ⚠️ WARNING: [Duplicate Protection] ${b.name} is already contacted in local state (count: ${localRecord.outreach_count}, last: ${localRecord.last_contacted_at}). Skipping!`);
        results.push({ name: b.name, email: b.email, status: 'Skipped (Duplicate Local)', error: 'Already contacted locally' });
        continue;
      }

      // 2. Check live Supabase DB
      const { data: existingLead, error: selectError } = await supabase
        .from('brand_leads')
        .select('*')
        .eq('brand_name', b.name)
        .maybeSingle();

      if (selectError) {
        throw new Error(`Supabase check failed: ${selectError.message}`);
      }

      if (existingLead && existingLead.status === 'contacted' && (existingLead.outreach_count || 0) > 0) {
        console.warn(`   ⚠️ WARNING: [Duplicate Protection] ${b.name} is already contacted in live Supabase DB (count: ${existingLead.outreach_count}, last: ${existingLead.last_contacted_at}). Skipping!`);
        results.push({ name: b.name, email: b.email, status: 'Skipped (Duplicate DB)', error: 'Already contacted in DB' });
        continue;
      }

      const nextOutreachCount = existingLead ? (existingLead.outreach_count || 0) + 1 : 1;
      const lastContactedAt = new Date().toISOString();

      const leadPayload = {
        brand_name: b.name,
        website: b.website,
        email: b.email,
        category: 'Dentistry',
        status: 'contacted',
        outreach_count: nextOutreachCount,
        last_contacted_at: lastContactedAt,
        notes: `Dentist ad outreach: ${b.notes}`
      };

      if (!isDryRun) {
        // 3. Update Supabase DB
        if (existingLead) {
          const { error: updateError } = await supabase.from('brand_leads').update(leadPayload).eq('id', existingLead.id);
          if (updateError) throw updateError;
          console.log(`   ✅ Supabase lead updated for ${b.name}`);
        } else {
          const { error: insertError } = await supabase.from('brand_leads').insert(leadPayload);
          if (insertError) throw insertError;
          console.log(`   ✅ Supabase lead created for ${b.name}`);
        }

        // 4. Update local offline state JSON cache
        if (!localState.d2c_brands) localState.d2c_brands = {};
        localState.d2c_brands[b.name] = {
          email: b.email,
          website: b.website,
          category: 'Dentistry',
          status: 'contacted',
          outreach_count: nextOutreachCount,
          last_contacted_at: lastContactedAt
        };
        fs.writeFileSync(localStatePath, JSON.stringify(localState, null, 2), 'utf8');
        console.log(`   ✅ Local state JSON updated for ${b.name}`);

        // 5. Dispatch Email via Resend
        const { data, error } = await resend.emails.send({
          from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
          to: b.email,
          reply_to: 'creatorarmour07@gmail.com',
          subject: `Custom ${b.name} Creator Portal + Campaign Infrastructure ✨🦷`,
          html: getDentalEmailTemplate(b)
        });

        if (error) throw error;
        console.log(`   ✅ Email successfully sent! Resend ID: ${data?.id}`);
        results.push({ name: b.name, email: b.email, status: 'Sent', id: data?.id });
      } else {
        console.log(`   🧪 [Dry Run] Would update Supabase & Local Cache with:`, JSON.stringify(leadPayload, null, 2));
        console.log(`   🧪 [Dry Run] Would send email to: ${b.email} using template:\n`, getDentalEmailTemplate(b).substring(0, 500) + '...\n');
        results.push({ name: b.name, email: b.email, status: 'Dry Run Success' });
      }

      // Add a defensive sleep delay to protect API limits
      await new Promise(r => setTimeout(r, 1500));

    } catch (err: any) {
      console.error(`   ❌ Failed processing ${b.name}:`, err.message);
      results.push({ name: b.name, email: b.email, status: 'Failed', error: err.message });
    }
  }

  console.log('\n✨ DENTAL OUTREACH RESULTS SUMMARY:');
  console.table(results);
}

sendOutreach().catch(console.error);
