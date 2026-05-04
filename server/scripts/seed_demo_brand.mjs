import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
   
  console.error('Missing SUPABASE env vars (VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const DEMO_BRAND_EMAIL = 'brand-demo@creatorarmour.com';
const DEFAULT_INDUSTRY = 'Consumer';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const findUserIdByEmail = async (email) => {
  let page = 1;
  // Try a few pages; this project typically has far fewer than 1k users.
  for (let i = 0; i < 10; i++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = (data?.users || []).find((u) => String(u?.email || '').toLowerCase() === email);
    if (user?.id) return String(user.id);
    page += 1;
    if (!data?.users?.length) break;
  }
  return null;
};

const main = async () => {
  const userId = await findUserIdByEmail(DEMO_BRAND_EMAIL);
  if (!userId) {
     
    console.error(`Could not find auth user for ${DEMO_BRAND_EMAIL}`);
    process.exit(1);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, business_name, role')
    .eq('id', userId)
    .maybeSingle();

  const name = String(profile?.business_name || 'Demo Brand Co').trim() || 'Demo Brand Co';
  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F766E&color=fff&size=256`;

  const { data: existing, error: existingErr } = await supabase
    .from('brands')
    .select('id, external_id, name, logo_url, industry')
    .eq('external_id', userId)
    .maybeSingle();
  if (existingErr) throw existingErr;

  const payload = {
    name,
    external_id: userId,
    logo_url: existing?.logo_url || logoUrl,
    industry: existing?.industry || DEFAULT_INDUSTRY,
    verified: true,
    status: 'active',
    source: 'demo',
  };

  if (existing?.id) {
    const { data: updated, error } = await supabase
      .from('brands')
      .update(payload)
      .eq('id', existing.id)
      .select('id, name, external_id, logo_url, industry')
      .single();
    if (error) throw error;
     
    console.log('Updated demo brand:', updated);
    return;
  }

  const { data: inserted, error } = await supabase
    .from('brands')
    .insert(payload)
    .select('id, name, external_id, logo_url, industry')
    .single();
  if (error) throw error;
   
  console.log('Inserted demo brand:', inserted);
};

main().catch((e) => {
   
  console.error('seed_demo_brand failed:', e?.message || e);
  process.exit(1);
});

