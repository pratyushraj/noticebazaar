import express, { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

const buildProfilesById = (profiles: any[] | null | undefined) => {
  const map = new Map<string, any>();
  (profiles || []).forEach((p) => {
    if (!p?.id) return;
    map.set(String(p.id), p);
  });
  return map;
};

const isMissingColumnError = (err: any, column: string) => {
  const msg = String(err?.message || err?.details || err?.hint || '').toLowerCase();
  const col = String(column || '').toLowerCase();
  return (
    msg.includes(`could not find the '${col}' column`) ||
    msg.includes(`could not find the \"${col}\" column`) ||
    msg.includes(`column ${col} does not exist`) ||
    msg.includes(`column \"${col}\" does not exist`) ||
    msg.includes(`${col} does not exist`) ||
    (msg.includes('column') && msg.includes(col) && msg.includes('does not exist')) ||
    (msg.includes('schema cache') && msg.includes(col))
  );
};

const requireBrand = (req: AuthenticatedRequest, res: Response): { ok: true; id: string; email: string | null } | { ok: false } => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return { ok: false };
  }
  const role = String(req.user?.role || '').toLowerCase();
  if (role && role !== 'brand' && role !== 'admin') {
    res.status(403).json({ success: false, error: 'Brand access required' });
    return { ok: false };
  }
  const email = req.user?.email ? String(req.user.email).toLowerCase() : null;
  return { ok: true, id: userId, email };
};

router.get('/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand.ok) return;

    const selectV2 = `
      id,
      brand_name,
      brand_email,
      collab_type,
      status,
      created_at,
      budget_range,
      exact_budget,
      barter_value,
      barter_description,
      deliverables,
      deadline,
      creator_id,
      counter_offer,
      brand_id
    `;

    const selectV1 = `
      id,
      brand_name,
      brand_email,
      collab_type,
      status,
      created_at,
      budget_range,
      exact_budget,
      barter_value,
      barter_description,
      deliverables,
      deadline,
      creator_id,
      counter_offer
    `;

    const run = async (select: string, canUseBrandId: boolean) => {
      let query: any = supabase.from('collab_requests').select(select).order('created_at', { ascending: false });
      if (canUseBrandId) {
        if (brand.email) query = query.or(`brand_id.eq.${brand.id},brand_email.eq.${brand.email}`);
        else query = query.eq('brand_id', brand.id);
      } else if (brand.email) {
        query = query.eq('brand_email', brand.email);
      } else {
        return [] as any[];
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    };

    let rows: any[] = [];
    try {
      rows = await run(selectV2, true);
    } catch (err: any) {
      if (isMissingColumnError(err, 'brand_id')) rows = await run(selectV1, false);
      else throw err;
    }

    const creatorIds = Array.from(new Set(rows.map((r) => String(r.creator_id || '')).filter(Boolean)));
    if (creatorIds.length > 0) {
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, business_name, avatar_url')
        .in('id' as any, creatorIds as any[]);
      if (!profErr) {
        const byId = buildProfilesById(profs);
        rows = rows.map((r) => ({ ...r, profiles: byId.get(String(r.creator_id)) || null }));
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, requests: rows });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /requests failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch brand requests' });
  }
});

router.get('/deals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand.ok) return;

    const selectV2 = `
      id,
      creator_id,
      status,
      created_at,
      deal_amount,
      due_date,
      brand_id,
      brand_email
    `;

    const selectV1 = `
      id,
      creator_id,
      status,
      created_at,
      deal_amount,
      due_date,
      brand_email
    `;

    const run = async (select: string, canUseBrandId: boolean) => {
      let query: any = supabase.from('brand_deals').select(select).order('created_at', { ascending: false });
      if (canUseBrandId) {
        if (brand.email) query = query.or(`brand_id.eq.${brand.id},brand_email.eq.${brand.email}`);
        else query = query.eq('brand_id', brand.id);
      } else if (brand.email) {
        query = query.eq('brand_email', brand.email);
      } else {
        return [] as any[];
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    };

    let rows: any[] = [];
    try {
      rows = await run(selectV2, true);
    } catch (err: any) {
      if (isMissingColumnError(err, 'brand_id')) rows = await run(selectV1, false);
      else throw err;
    }

    const creatorIds = Array.from(new Set(rows.map((r) => String(r.creator_id || '')).filter(Boolean)));
    if (creatorIds.length > 0) {
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, business_name, avatar_url')
        .in('id' as any, creatorIds as any[]);
      if (!profErr) {
        const byId = buildProfilesById(profs);
        rows = rows.map((r) => ({ ...r, profiles: byId.get(String(r.creator_id)) || null }));
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, deals: rows });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /deals failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch brand deals' });
  }
});

export default router;

