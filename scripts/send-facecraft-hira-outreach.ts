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

interface TargetBrand {
  name: string;
  email: string;
  website: string;
  dbCategory: string;
  nicheLabel: string;
  creatorLabel: string;
  creatorSourcingLabel: string;
  onboardingLabel: string;
  subject: string;
}

const targetBrands: TargetBrand[] = [
  {
    name: 'The Facecraft Project',
    email: 'info@thefacecraftproject.com',
    website: 'https://thefacecraftproject.com',
    dbCategory: 'Beauty, Skincare & Grooming',
    nicheLabel: 'skincare',
    creatorLabel: 'skincare routine',
    creatorSourcingLabel: 'skincare',
    onboardingLabel: 'beauty/skincare',
    subject: 'Custom Skincare Creator Shortlist — The Facecraft Project ✨💄',
  },
  {
    name: 'Hira Fragrances',
    email: 'collabs@hirafragrances.com',
    website: 'https://hirafragrances.com',
    dbCategory: 'Beauty, Skincare & Grooming',
    nicheLabel: 'fragrance & personal care',
    creatorLabel: 'beauty and lifestyle',
    creatorSourcingLabel: 'lifestyle',
    onboardingLabel: 'beauty/fragrance',
    subject: 'Custom Fragrance Creator Shortlist — HIRA Fragrances ✨🌬️',
  }
];

function getEmailTemplate(b: TargetBrand): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 20px;">
      <p>Hi Team 👋</p>

      <p>Came across <strong>${b.name}</strong> and honestly the products already feel very creator-friendly ✨</p>

      <p>The ${b.nicheLabel} category performs extremely well through:</p>
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        <li style="margin-bottom: 6px;">UGC-style reels</li>
        <li style="margin-bottom: 6px;">${b.creatorLabel} creators</li>
        <li style="margin-bottom: 6px;">review/testimonial content</li>
        <li style="margin-bottom: 6px;">before/after storytelling</li>
      </ul>

      <p>That’s exactly what we’re helping brands streamline through <strong>Creator Armour</strong> 😊</p>

      <p>We help with:</p>
      <ul style="padding-left: 20px; color: #4b5563; margin: 16px 0;">
        <li style="margin-bottom: 6px;">${b.creatorSourcingLabel} creator sourcing</li>
        <li style="margin-bottom: 6px;">barter creator collaborations</li>
        <li style="margin-bottom: 6px;">creator coordination & follow-ups</li>
        <li style="margin-bottom: 6px;">deliverable tracking through a structured dashboard</li>
      </ul>

      <p>We already work with ${b.creatorLabel} creators and genuinely feel creator-led content could scale very well for the brand.</p>

      <p>Since we’re onboarding a few early ${b.onboardingLabel} brands currently, we’d love to support a small pilot creator campaign completely free ✨</p>

      <p>Would love to connect.</p>

      <p style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #1f2937;">
        — <strong>Pratyush</strong><br>
        Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #ec4899; font-weight: bold; text-decoration: none;">creatorarmour.com</a>
      </p>
    </div>
  `;
}

async function sendOutreach() {
  console.log(`🚀 Starting outreach to ${targetBrands.length} brands...`);
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
        category: b.dbCategory,
        status: 'contacted',
        outreach_count: existingLead ? (existingLead.outreach_count || 0) + 1 : 1,
        last_contacted_at: new Date().toISOString(),
        contact_name: 'Marketing Team',
        notes: 'Sent custom personalized email outreach.'
      };

      if (existingLead) {
        await supabase.from('brand_leads').update(leadPayload).eq('id', existingLead.id);
      } else {
        await supabase.from('brand_leads').insert(leadPayload);
      }

      // Update local state JSON file
      try {
        const localStatePath = join(process.cwd(), 'scratch', 'outreach_local_state.json');
        if (fs.existsSync(localStatePath)) {
          const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
          if (!localState.d2c_brands) localState.d2c_brands = {};
          
          localState.d2c_brands[b.name] = {
            email: b.email,
            website: b.website,
            category: b.dbCategory,
            status: 'contacted',
            outreach_count: existingLead ? (existingLead.outreach_count || 0) + 1 : 1,
            last_contacted_at: leadPayload.last_contacted_at
          };
          
          fs.writeFileSync(localStatePath, JSON.stringify(localState, null, 2), 'utf8');
          console.log(`   ✅ Local state JSON updated for ${b.name}`);
        }
      } catch (e: any) {
        console.error(`   ❌ Failed to update local state JSON for ${b.name}:`, e.message);
      }

      const { data, error } = await resend.emails.send({
        from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
        to: b.email,
        reply_to: 'creatorarmour07@gmail.com',
        subject: b.subject,
        html: getEmailTemplate(b)
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

  console.log('\n✨ OUTREACH RESULTS:');
  console.table(results);
}

sendOutreach();
