/**
 * Canonical brand contact for agency: resolve or create by email, link to collab_requests and brand_deals.
 */

import { supabase } from '../index.js';

export interface BrandContactFields {
  legalName: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  address?: string | null;
  gstin?: string | null;
  industry?: string | null;
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Resolve or create a brand_contact by email. Updates last_seen_at on existing row.
 * Returns brand_contact id for linking to collab_request or brand_deal.
 */
export async function resolveOrCreateBrandContact(fields: BrandContactFields): Promise<string | null> {
  const emailNorm = normalizeEmail(fields.email);
  if (!emailNorm) return null;

  const row = {
    email_normalized: emailNorm,
    legal_name: (fields.legalName || '').trim() || null,
    email: (fields.email || '').trim() || null,
    phone: (fields.phone || '').trim() || null,
    website: (fields.website || '').trim() || null,
    instagram: (fields.instagram || '').trim() || null,
    address: (fields.address || '').trim() || null,
    gstin: (fields.gstin || '').trim().toUpperCase() || null,
    industry: (fields.industry || '').trim() || null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('brand_contacts')
    .select('id, legal_name, phone, website, instagram, address, gstin')
    .eq('email_normalized', emailNorm)
    .maybeSingle();

  if (existing) {
    const update: Record<string, unknown> = {
      last_seen_at: row.last_seen_at,
      updated_at: row.updated_at,
    };
    if (row.legal_name && !existing.legal_name) update.legal_name = row.legal_name;
    if (row.phone && !existing.phone) update.phone = row.phone;
    if (row.website && !existing.website) update.website = row.website;
    if (row.instagram && !existing.instagram) update.instagram = row.instagram;
    if (row.address && !existing.address) update.address = row.address;
    if (row.gstin && !existing.gstin) update.gstin = row.gstin;

    await supabase.from('brand_contacts').update(update).eq('id', existing.id);
    return existing.id;
  }

  const insert = {
    ...row,
    first_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data: created, error } = await supabase
    .from('brand_contacts')
    .insert(insert)
    .select('id')
    .single();

  if (error) {
    console.error('[BrandContactService] Insert error:', error);
    return null;
  }
  return created?.id ?? null;
}
