// Shipping token service: create and validate tokens for brand shipping update links (no brand login)

import crypto from 'crypto';
import { supabase } from '../index.js';

const TOKEN_EXPIRY_DAYS = 14;

export interface ShippingTokenRow {
  id: string;
  deal_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface CreateShippingTokenOptions {
  dealId: string;
}

/**
 * Create a secure shipping token for a barter deal (14-day expiry).
 */
export async function createShippingToken(options: CreateShippingTokenOptions): Promise<{ token: string; expiresAt: Date }> {
  const { dealId } = options;
  if (!dealId) throw new Error('dealId is required');

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const { error } = await (supabase as any)
    .from('shipping_tokens')
    .insert({
      deal_id: dealId,
      token,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

  if (error) {
    console.error('[ShippingTokenService] Insert error:', error);
    throw new Error('Failed to create shipping token');
  }

  return { token, expiresAt };
}

/**
 * Validate token and return deal summary for the shipping page (or null if invalid/expired/used).
 */
export async function getShippingTokenInfo(token: string): Promise<{
  dealId: string;
  creatorName: string;
  creatorCity: string | null;
  productDescription: string;
  brandName: string;
  used: boolean;
} | null> {
  if (!token || typeof token !== 'string' || !token.trim()) return null;

  const trimmed = token.trim();
  const now = new Date().toISOString();

  const { data: row, error: tokenError } = await (supabase as any)
    .from('shipping_tokens')
    .select('id, deal_id, token, expires_at, used, created_at')
    .eq('token', trimmed)
    .maybeSingle();

  if (tokenError || !row) return null;
  if (row.used) return null;
  if (new Date(row.expires_at) < new Date(now)) return null;

  const { data: deal, error: dealError } = await (supabase as any)
    .from('brand_deals')
    .select('id, brand_name, deliverables, creator_id')
    .eq('id', row.deal_id)
    .maybeSingle();

  if (dealError || !deal) return null;

  let creatorName = 'Creator';
  let creatorCity: string | null = null;
  if (deal.creator_id) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('first_name, last_name, location')
      .eq('id', deal.creator_id)
      .maybeSingle();
    if (profile) {
      creatorName = `${(profile.first_name || '').trim()} ${(profile.last_name || '').trim()}`.trim() || 'Creator';
      creatorCity = profile.location || null;
    }
  }
  let productDescription = typeof deal.deliverables === 'string'
    ? deal.deliverables
    : Array.isArray(deal.deliverables)
      ? deal.deliverables.join(', ')
      : 'Product';

  return {
    dealId: deal.id,
    creatorName,
    creatorCity,
    productDescription,
    brandName: deal.brand_name || 'Brand',
    used: !!row.used,
  };
}

/**
 * Mark token as used and return deal_id (for POST submit).
 */
export async function useShippingToken(token: string): Promise<string | null> {
  if (!token || typeof token !== 'string' || !token.trim()) return null;

  const trimmed = token.trim();
  const now = new Date().toISOString();

  const { data: row, error: fetchError } = await (supabase as any)
    .from('shipping_tokens')
    .select('id, deal_id, expires_at, used')
    .eq('token', trimmed)
    .maybeSingle();

  if (fetchError || !row || row.used) return null;
  if (new Date(row.expires_at) < new Date(now)) return null;

  const { error: updateError } = await (supabase as any)
    .from('shipping_tokens')
    .update({ used: true })
    .eq('token', trimmed);

  if (updateError) return null;
  return row.deal_id;
}
