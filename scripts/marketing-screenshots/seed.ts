/**
 * Demo Data Seeder
 * Injects realistic fake data into the Supabase-powered creator dashboard
 * for marketing screenshot capture without manual data entry
 */

import { SCREENSHOT_CONFIG } from './config';

const SUPABASE_URL = 'https://ooxtwmqrvidqz oijcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlkzSUoyMGVBWFkvT2k5RHIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL29vYXh0d21xcnZmemRxem9pamNqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYzY4Yzg2NC04MWExLTQ0ZDktOWUyNi0wZWZlYzk0ZWU3ZTMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc2MDk1OTM3LCJpYXQiOjE3NzYwOTU5MzcsImVtYWlsIjoibm90aWNlMTA0QHlvcG1haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJhY2NvdW50X21vZGUiOiJjcmVhdG9yIiwiZW1haWwiOiJub3RpY2UxMDRAeW9wbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyc3RfbmFtZSI6IlByYXR5dXNoIiwibGFzdF9uYW1lIjoiUmFqIiwiaW5zdGFncmFtX2hhbmRsZSI6Indvd3ZpZHVzaGkiLCJzdWIiOiJjYzY4Yzg2NC04MWExLTQ0ZDktOWUyNi0wZWZlYzk0ZWU3ZTMifX0.5pCp0xLkgdczF6a8';

export interface SeedProfile {
  id: string;
  email: string;
  username: string;
  instagram_handle: string;
  full_name: string;
  bio: string;
  follower_count: number;
  category: string;
  profile_photo: string;
  rate_per_reel: number;
  is_onboarded: boolean;
  payout_verified: boolean;
}

export interface SeedDeal {
  brand_name: string;
  brand_logo: string;
  collab_type: 'reel' | 'story' | 'carousel' | 'post';
  deal_amount: number;
  deliverables: string;
  status: 'pending' | 'active' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  payment_status: 'pending' | 'paid' | 'overdue';
}

const BRAND_LOGOS = [
  'https://logo.clearbit.com/myntra.com',
  'https://logo.clearbit.com/nykaa.com',
  'https://logo.clearbit.com/boAt-lifestyle.com',
  'https://logo.clearbit.com/zomato.com',
  'https://logo.clearbit.com/swiggy.com',
  'https://logo.clearbit.com/urbanic.com',
  'https://logo.clearbit.com/dailyobjects.com',
  'https://logo.clearbit.com/bigbasket.com',
];

const BRANDS = [
  { name: 'Myntra', category: 'Fashion', minAmount: 8000, maxAmount: 25000 },
  { name: 'Nykaa', category: 'Beauty', minAmount: 12000, maxAmount: 35000 },
  { name: 'boAt Lifestyle', category: 'Audio', minAmount: 5000, maxAmount: 15000 },
  { name: 'Zomato', category: 'Food', minAmount: 10000, maxAmount: 30000 },
  { name: 'Swiggy', category: 'Food', minAmount: 8000, maxAmount: 20000 },
  { name: 'Urbanic', category: 'Fashion', minAmount: 6000, maxAmount: 18000 },
  { name: 'Daily Objects', category: 'Lifestyle', minAmount: 7000, maxAmount: 22000 },
  { name: 'BigBasket', category: 'Grocery', minAmount: 5000, maxAmount: 12000 },
];

const CATEGORIES = ['Lifestyle', 'Fashion', 'Beauty', 'Food', 'Fitness', 'Travel', 'Tech', 'Finance'];
const PROFILE_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop',
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString();
}

/**
 * Seed a creator profile with populated data for screenshots
 */
export async function seedCreatorProfile(accessToken: string): Promise<SeedProfile | null> {
  try {
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileRes.ok) return null;
    const profiles = await profileRes.json();
    if (!profiles?.length) return null;

    const profile = profiles[0];
    const updated = {
      ...profile,
      username: 'beyonce',
      full_name: 'Beyoncé',
      bio: 'Pop icon. Brand deals that move cultures. 180K organic followers.',
      follower_count: 180000,
      instagram_handle: 'beyonce',
      category: 'Music & Lifestyle',
      rate_per_reel: 8000,
      is_onboarded: true,
      payout_verified: true,
      profile_photo: PROFILE_PHOTOS[0],
    };

    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updated),
    });

    return updateRes.ok ? updated : null;
  } catch (e) {
    console.error('[Seed] Profile update failed:', e);
    return null;
  }
}

/**
 * Seed pending offers (brand → creator requests) for screenshot demos
 */
export async function seedPendingOffers(accessToken: string, creatorEmail: string): Promise<void> {
  try {
    // Get creator profile
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(creatorEmail)}&select=id`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` } }
    );
    const profiles = await profileRes.json();
    if (!profiles?.length) return;
    const creatorId = profiles[0].id;

    // Clear existing pending requests
    await fetch(
      `${SUPABASE_URL}/rest/v1/collab_requests?creator_id=eq.${creatorId}&status=eq.pending`,
      { method: 'DELETE', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` } }
    );

    // Create 3 fresh pending offers
    const offers = BRANDS.slice(0, 3).map((brand, i) => ({
      creator_id: creatorId,
      brand_name: brand.name,
      brand_logo_url: BRAND_LOGOS[i],
      collab_type: randomItem(['reel', 'story', 'carousel'] as const),
      budget: randomBetween(brand.minAmount, brand.maxAmount),
      deliverables: `@${creatorEmail.split('@')[0]} creates 1 Instagram Reel`,
      message: `Hi! We love your content and think you'd be a perfect fit for our ${brand.category} campaign. We'd love to work with you!`,
      status: 'pending',
      is_demo: false,
      created_at: randomDate(7),
    }));

    for (const offer of offers) {
      await fetch(`${SUPABASE_URL}/rest/v1/collab_requests`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(offer),
      });
    }
    console.log(`[Seed] Created ${offers.length} pending offers`);
  } catch (e) {
    console.error('[Seed] Pending offers seed failed:', e);
  }
}

/**
 * Seed active deals for the "active deal" screenshot state
 */
export async function seedActiveDeals(accessToken: string, creatorEmail: string): Promise<void> {
  try {
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(creatorEmail)}&select=id`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` } }
    );
    const profiles = await profileRes.json();
    if (!profiles?.length) return;
    const creatorId = profiles[0].id;

    // Get existing active deals
    const dealsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/deals?creator_id=eq.${creatorId}&status=eq.active&select=id`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` } }
    );
    const existingDeals = await dealsRes.json();

    if (existingDeals?.length >= 2) {
      console.log('[Seed] Active deals already exist, skipping');
      return;
    }

    // Create active deals
    const activeBrands = BRANDS.slice(3, 5);
    for (const brand of activeBrands) {
      await fetch(`${SUPABASE_URL}/rest/v1/deals`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          creator_id: creatorId,
          brand_name: brand.name,
          brand_logo_url: BRAND_LOGOS[3],
          collab_type: 'reel',
          deal_amount: randomBetween(brand.minAmount, brand.maxAmount),
          deliverables: '1 Instagram Reel',
          status: 'active',
          payment_status: 'pending',
          progress_percentage: 50,
          content_delivery_status: 'draft',
          created_at: randomDate(3),
        }),
      });
    }
    console.log('[Seed] Active deals created');
  } catch (e) {
    console.error('[Seed] Active deals seed failed:', e);
  }
}

/**
 * Seed completed deals for "earnings" screenshot state
 */
export async function seedCompletedDeals(accessToken: string, creatorEmail: string): Promise<void> {
  try {
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(creatorEmail)}&select=id`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` } }
    );
    const profiles = await profileRes.json();
    if (!profiles?.length) return;
    const creatorId = profiles[0].id;

    const completedBrands = [
      { name: 'Myntra', amount: 18000 },
      { name: 'Nykaa', amount: 22000 },
      { name: 'Zomato', amount: 15000 },
    ];

    for (const brand of completedBrands) {
      await fetch(`${SUPABASE_URL}/rest/v1/deals`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: creatorId,
          brand_name: brand.name,
          brand_logo_url: BRAND_LOGOS[0],
          collab_type: 'reel',
          deal_amount: brand.amount,
          deliverables: '1 Instagram Reel',
          status: 'completed',
          payment_status: 'paid',
          progress_percentage: 100,
          content_delivery_status: 'posted',
          created_at: randomDate(30),
          payment_received_date: randomDate(25),
        }),
      });
    }
    console.log('[Seed] Completed deals created');
  } catch (e) {
    console.error('[Seed] Completed deals seed failed:', e);
  }
}

/**
 * Run full seed — all states
 */
export async function runFullSeed(accessToken: string, creatorEmail: string = 'notice104@yopmail.com') {
  console.log('[Seed] Starting full seed...');
  await seedCreatorProfile(accessToken);
  await seedPendingOffers(accessToken, creatorEmail);
  await seedActiveDeals(accessToken, creatorEmail);
  await seedCompletedDeals(accessToken, creatorEmail);
  console.log('[Seed] Full seed complete ✅');
}
