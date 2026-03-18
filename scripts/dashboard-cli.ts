import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local'), quiet: true });
dotenv.config({ path: join(process.cwd(), '.env'), quiet: true });

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/^"|"$/g, '');
const SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').replace(/^"|"$/g, '');
const API_BASE_URL = (process.env.API_BASE_URL || process.env.PUSH_API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env/.env.local');
  process.exit(1);
}

type Role = 'brand' | 'creator';

const args = process.argv.slice(2);
const command = args[0];

function getArg(name: string, fallback?: string): string | undefined {
  const key = `--${name}`;
  const index = args.findIndex((arg) => arg === key);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function requireArg(name: string): string {
  const value = getArg(name);
  if (!value) {
    console.error(`Missing required argument: --${name}`);
    process.exit(1);
  }
  return value;
}

function parseDeliverables(raw?: string): string[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function printJSON(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

async function login(email: string, password: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new Error(error?.message || 'Login failed');
  }

  return {
    user: data.user,
    token: data.session.access_token,
  };
}

async function api<T = any>(pathname: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${typeof body === 'object' ? body?.error || body?.details || JSON.stringify(body) : body}`);
  }

  return body as T;
}

async function rest<T = any>(query: string, token: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${body?.message || body?.error || JSON.stringify(body)}`);
  }
  return body as T;
}

async function brandRequests(email: string, password: string) {
  const { token, user } = await login(email, password);
  const data = await api<{ success: true; requests: any[] }>('/api/brand-dashboard/requests', token);
  printJSON({
    role: 'brand',
    userId: user.id,
    email: user.email,
    count: data.requests.length,
    requests: data.requests,
  });
}

async function brandDeals(email: string, password: string) {
  const { token, user } = await login(email, password);
  const data = await api<{ success: true; deals: any[] }>('/api/brand-dashboard/deals', token);
  printJSON({
    role: 'brand',
    userId: user.id,
    email: user.email,
    count: data.deals.length,
    deals: data.deals,
  });
}

async function brandComplete(email: string, password: string, dealId: string) {
  const { token, user } = await login(email, password);
  const data = await api(`/api/deals/${dealId}/mark-complete`, token, { method: 'PATCH' });
  printJSON({
    role: 'brand',
    userId: user.id,
    email: user.email,
    dealId,
    result: data,
  });
}

async function brandSaveProfile(email: string, password: string) {
  const { token, user } = await login(email, password);
  const name = requireArg('name');
  const website = getArg('website') || null;
  const industry = getArg('industry') || 'General';
  const location = getArg('location') || null;
  const description = getArg('description') || null;

  const profileRows = await rest<any[]>(`profiles?id=eq.${user.id}&select=id`, token);
  if (!Array.isArray(profileRows) || profileRows.length === 0) {
    throw new Error('Profile not found');
  }

  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      business_name: name,
      first_name: name,
      bio: description,
      location,
      updated_at: new Date().toISOString(),
    }),
  }).then(async (res) => {
    if (!res.ok) throw new Error(`Failed to update profile: ${await res.text()}`);
  });

  const existingBrands = await rest<any[]>(`brands?external_id=eq.${user.id}&select=id`, token);
  const brandPayload = {
    external_id: user.id,
    name,
    website_url: website,
    industry,
    description,
    updated_at: new Date().toISOString(),
  };

  if (existingBrands[0]?.id) {
    await fetch(`${SUPABASE_URL}/rest/v1/brands?id=eq.${existingBrands[0].id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(brandPayload),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Failed to update brand: ${await res.text()}`);
    });
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/brands`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ ...brandPayload, created_at: new Date().toISOString() }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Failed to create brand row: ${await res.text()}`);
    });
  }

  printJSON({
    role: 'brand',
    userId: user.id,
    email: user.email,
    saved: { name, website, industry, location, description },
    note: 'support_email is not persisted because current schema has no brand support email column',
  });
}

async function creatorRequests(email: string, password: string) {
  const { token, user } = await login(email, password);
  const rows = await rest<any[]>(`collab_requests?creator_id=eq.${user.id}&select=id,status,brand_name,brand_email,exact_budget,deliverables,deadline,created_at,counter_offer&order=created_at.desc`, token);
  printJSON({
    role: 'creator',
    userId: user.id,
    email: user.email,
    count: rows.length,
    requests: rows,
  });
}

async function creatorDeals(email: string, password: string) {
  const { token, user } = await login(email, password);
  const rows = await rest<any[]>(`brand_deals?creator_id=eq.${user.id}&select=id,status,brand_name,brand_email,deal_amount,due_date,contract_file_url,created_at&order=created_at.desc`, token);
  printJSON({
    role: 'creator',
    userId: user.id,
    email: user.email,
    count: rows.length,
    deals: rows,
  });
}

async function creatorAccept(email: string, password: string, requestId: string) {
  const { token, user } = await login(email, password);
  const data = await api(`/api/collab-requests/${requestId}/accept`, token, { method: 'PATCH' });
  printJSON({
    role: 'creator',
    userId: user.id,
    email: user.email,
    requestId,
    result: data,
  });
}

async function creatorDecline(email: string, password: string, requestId: string) {
  const { token, user } = await login(email, password);
  const data = await api(`/api/collab-requests/${requestId}/decline`, token, { method: 'PATCH' });
  printJSON({
    role: 'creator',
    userId: user.id,
    email: user.email,
    requestId,
    result: data,
  });
}

async function creatorCounter(email: string, password: string, requestId: string) {
  const { token, user } = await login(email, password);
  const finalPrice = getArg('price');
  const deliverables = getArg('deliverables');
  const paymentTerms = getArg('payment-terms');
  const notes = getArg('notes');

  const data = await api(`/api/collab-requests/${requestId}/counter`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      final_price: finalPrice ? Number(finalPrice) : undefined,
      deliverables,
      payment_terms: paymentTerms,
      notes,
    }),
  });

  printJSON({
    role: 'creator',
    userId: user.id,
    email: user.email,
    requestId,
    submitted: {
      final_price: finalPrice ? Number(finalPrice) : null,
      deliverables,
      payment_terms: paymentTerms,
      notes,
    },
    result: data,
  });
}

async function creatorSummary(email: string, password: string) {
  const { token, user } = await login(email, password);
  const [requests, deals] = await Promise.all([
    rest<any[]>(`collab_requests?creator_id=eq.${user.id}&select=id,status`, token),
    rest<any[]>(`brand_deals?creator_id=eq.${user.id}&select=id,status,deal_amount`, token),
  ]);

  const summary = {
    pendingRequests: requests.filter((row) => row.status === 'pending').length,
    acceptedRequests: requests.filter((row) => row.status === 'accepted').length,
    counteredRequests: requests.filter((row) => row.status === 'countered').length,
    activeDeals: deals.filter((row) => !String(row.status || '').toLowerCase().includes('completed')).length,
    completedDeals: deals.filter((row) => String(row.status || '').toLowerCase().includes('completed')).length,
    totalDealValue: deals.reduce((sum, row) => sum + Number(row.deal_amount || 0), 0),
  };

  printJSON({
    role: 'creator',
    userId: user.id,
    email: user.email,
    summary,
  });
}

async function brandSummary(email: string, password: string) {
  const { token, user } = await login(email, password);
  const [requestsData, dealsData] = await Promise.all([
    api<{ success: true; requests: any[] }>('/api/brand-dashboard/requests', token),
    api<{ success: true; deals: any[] }>('/api/brand-dashboard/deals', token),
  ]);

  const requests = requestsData.requests;
  const deals = dealsData.deals;

  const summary = {
    pendingRequests: requests.filter((row) => row.status === 'pending').length,
    acceptedRequests: requests.filter((row) => row.status === 'accepted').length,
    counteredRequests: requests.filter((row) => row.status === 'countered').length,
    activeDeals: deals.filter((row) => !String(row.status || '').toLowerCase().includes('completed')).length,
    completedDeals: deals.filter((row) => String(row.status || '').toLowerCase().includes('completed')).length,
    totalDealValue: deals.reduce((sum, row) => sum + Number(row.deal_amount || 0), 0),
  };

  printJSON({
    role: 'brand',
    userId: user.id,
    email: user.email,
    summary,
  });
}

function usage() {
  console.log(`
Dashboard CLI

Examples:
  npm run dashboard:cli -- brand-summary --email brand-demo@noticebazaar.com --password 'BrandDemo123!@#'
  npm run dashboard:cli -- brand-requests --email brand-demo@noticebazaar.com --password 'BrandDemo123!@#'
  npm run dashboard:cli -- brand-deals --email brand-demo@noticebazaar.com --password 'BrandDemo123!@#'
  npm run dashboard:cli -- brand-complete --email brand-demo@noticebazaar.com --password 'BrandDemo123!@#' --deal-id <deal-id>
  npm run dashboard:cli -- brand-save-profile --email brand-demo@noticebazaar.com --password 'BrandDemo123!@#' --name "Demo Brand" --website https://brand.com --industry Fashion --location "Mumbai, India" --description "Creator-first campaigns"

  npm run dashboard:cli -- creator-summary --email notice104@yopmail.com --password 'kickurass'
  npm run dashboard:cli -- creator-requests --email notice104@yopmail.com --password 'kickurass'
  npm run dashboard:cli -- creator-deals --email notice104@yopmail.com --password 'kickurass'
  npm run dashboard:cli -- creator-accept --email notice104@yopmail.com --password 'kickurass' --request-id <request-id>
  npm run dashboard:cli -- creator-decline --email notice104@yopmail.com --password 'kickurass' --request-id <request-id>
  npm run dashboard:cli -- creator-counter --email notice104@yopmail.com --password 'kickurass' --request-id <request-id> --price 18000 --deliverables "1 Reel,2 Stories" --payment-terms "50 upfront" --notes "Need revised budget"
`);
}

async function main() {
  if (!command || command === '--help' || command === 'help') {
    usage();
    return;
  }

  const email = getArg('email');
  const password = getArg('password');

  switch (command) {
    case 'brand-summary':
      return brandSummary(requireArg('email'), requireArg('password'));
    case 'brand-requests':
      return brandRequests(requireArg('email'), requireArg('password'));
    case 'brand-deals':
      return brandDeals(requireArg('email'), requireArg('password'));
    case 'brand-complete':
      return brandComplete(requireArg('email'), requireArg('password'), requireArg('deal-id'));
    case 'brand-save-profile':
      return brandSaveProfile(requireArg('email'), requireArg('password'));

    case 'creator-summary':
      return creatorSummary(requireArg('email'), requireArg('password'));
    case 'creator-requests':
      return creatorRequests(requireArg('email'), requireArg('password'));
    case 'creator-deals':
      return creatorDeals(requireArg('email'), requireArg('password'));
    case 'creator-accept':
      return creatorAccept(requireArg('email'), requireArg('password'), requireArg('request-id'));
    case 'creator-decline':
      return creatorDecline(requireArg('email'), requireArg('password'), requireArg('request-id'));
    case 'creator-counter':
      return creatorCounter(requireArg('email'), requireArg('password'), requireArg('request-id'));
    default:
      console.error(`Unknown command: ${command}`);
      usage();
      process.exit(1);
  }
}

main().catch((error: any) => {
  console.error(error?.message || String(error));
  process.exit(1);
});
