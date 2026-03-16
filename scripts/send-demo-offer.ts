/**
 * Send a demo offer from the demo brand to a target creator email.
 *
 * Usage:
 *   pnpm -s tsx scripts/send-demo-offer.ts
 *
 * Requires:
 *   - VITE_SUPABASE_URL (or SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials.');
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env');
  process.exit(1);
}

const getArg = (name: string) => {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
};

const toNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const DEMO_BRAND_EMAIL = getArg('brand-email') || 'brand-demo@noticebazaar.com';
const TARGET_CREATOR_EMAIL = getArg('to') || 'notice2@yopmail.com';
const OFFER_AMOUNT = toNumber(getArg('amount')) ?? 1200;
const DEADLINE_DAYS = toNumber(getArg('deadline-days')) ?? 10;
const PUSH_API_BASE_URL = (process.env.PUSH_API_BASE_URL || process.env.API_BASE_URL || 'https://noticebazaar-api.onrender.com').replace(/\/$/, '');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ensureUser = async (email: string, opts: { role: 'brand' | 'creator' }) => {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw new Error(`Failed to list users: ${listErr.message}`);

  const existing = list?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  if (existing?.id) return existing.id;

  const password = opts.role === 'brand' ? 'BrandDemo123!@#' : 'CreatorDemo123!@#';
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: opts.role },
  });
  if (createErr) throw new Error(`Failed to create user ${email}: ${createErr.message}`);
  if (!created.user?.id) throw new Error(`Failed to create user ${email}: no id returned`);
  return created.user.id;
};

async function main() {
  const brandId = await ensureUser(DEMO_BRAND_EMAIL, { role: 'brand' });
  const creatorId = await ensureUser(TARGET_CREATOR_EMAIL, { role: 'creator' });

  const now = new Date().toISOString();

  // Ensure profiles exist with the right roles (defense-in-depth).
  const { error: brandProfileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: brandId,
        role: 'brand',
        business_name: 'Demo Brand Co',
        first_name: 'Demo',
        last_name: 'Brand',
        onboarding_complete: true,
        updated_at: now,
      },
      { onConflict: 'id' }
    );
  if (brandProfileErr) throw new Error(`Failed to upsert brand profile: ${brandProfileErr.message}`);

  const { error: creatorProfileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: creatorId,
        role: 'creator',
        first_name: 'Notice',
        last_name: 'Two',
        onboarding_complete: true,
        updated_at: now,
      },
      { onConflict: 'id' }
    );
  if (creatorProfileErr) throw new Error(`Failed to upsert creator profile: ${creatorProfileErr.message}`);

  const basePayload: Record<string, any> = {
    creator_id: creatorId,
    brand_name: 'Demo Brand Co',
    brand_email: DEMO_BRAND_EMAIL,
    collab_type: 'paid',
    exact_budget: OFFER_AMOUNT,
    budget_range: OFFER_AMOUNT <= 2000 ? '1k-2k' : OFFER_AMOUNT <= 5000 ? '2k-5k' : OFFER_AMOUNT <= 10000 ? '5k-10k' : '10k+',
    campaign_description: 'Demo campaign: 1 Reel + 2 Stories (7-day usage).',
    deliverables: ['1 Reel', '2 Stories'],
    usage_rights: true,
    deadline: new Date(Date.now() + DEADLINE_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'pending',
    submitted_ip: '127.0.0.1',
    submitted_user_agent: 'demo-script',
  };

  const tryInsert = async (payload: Record<string, any>) => {
    return await supabase.from('collab_requests').insert(payload).select('id, created_at').single();
  };

  // Prefer inserting with brand_id (newer schema), but gracefully fall back if the column doesn't exist yet.
  let inserted: any;
  {
    const { data, error } = await tryInsert({ ...basePayload, brand_id: brandId });
    if (!error) inserted = data;
    else {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes("could not find the 'brand_id' column") || msg.includes('brand_id') && msg.includes('schema cache')) {
        const fallback = await tryInsert(basePayload);
        if (fallback.error) throw new Error(`Failed to insert collab request: ${fallback.error.message}`);
        inserted = fallback.data;
      } else {
        throw new Error(`Failed to insert collab request: ${error.message}`);
      }
    }
  }

  console.log('✅ Demo offer created');
  console.log(`- creator: ${TARGET_CREATOR_EMAIL} (${creatorId})`);
  console.log(`- brand:   ${DEMO_BRAND_EMAIL} (${brandId})`);
  console.log(`- request: ${inserted.id}`);
  console.log(`- created: ${inserted.created_at}`);

  // Trigger push/email notification for the creator (best-effort).
  // Note: push delivery still requires the creator to have enabled notifications in the app.
  try {
    const resp = await fetch(`${PUSH_API_BASE_URL}/api/push/notify-collab`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        creatorId,
        requestId: inserted.id,
        brandName: 'Demo Brand Co',
        collabType: 'paid',
        deliverables: ['1 Reel', '2 Stories'],
        deadline: basePayload.deadline,
      }),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.warn('⚠️  Notify failed:', json?.error || json?.details || resp.status);
    } else {
      console.log('🔔 Notification triggered:', json?.channel || (json?.success ? 'sent' : 'skipped'));
    }
  } catch (e: any) {
    console.warn('⚠️  Notify request failed:', e?.message || String(e));
  }
}

main().catch((err) => {
  console.error('❌ Failed to send demo offer');
  console.error(err?.message || String(err));
  process.exit(1);
});
