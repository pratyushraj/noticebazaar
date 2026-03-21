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

const requireBrand = async (req: AuthenticatedRequest, res: Response): Promise<{ ok: true; id: string; email: string | null } | { ok: false }> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return { ok: false };
  }
  const role = String(req.user?.role || '').toLowerCase();
  const email = req.user?.email ? String(req.user.email).toLowerCase() : null;

  if (!role || (role !== 'brand' && role !== 'admin')) {
    let profile: any = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role, business_name')
        .eq('id', userId)
        .maybeSingle();
      profile = data;
    } catch {
      profile = null;
    }

    const profileRole = String(profile?.role || '').toLowerCase();
    const isDemoBrand = email === 'brand-demo@noticebazaar.com';
    const hasBrandProfile = profileRole === 'brand' || !!String(profile?.business_name || '').trim();

    if (!isDemoBrand && role !== 'admin' && !hasBrandProfile) {
      res.status(403).json({ success: false, error: 'Brand access required' });
      return { ok: false };
    }
  }
  return { ok: true, id: userId, email };
};

router.get('/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    const run = async (canUseBrandId: boolean) => {
      // Use `*` so brand dashboards always receive full campaign + brand metadata as the schema evolves,
      // while still filtering access via brand_id / brand_email.
      let query: any = supabase.from('collab_requests').select('*').order('created_at', { ascending: false });
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
      rows = await run(true);
    } catch (err: any) {
      if (isMissingColumnError(err, 'brand_id')) rows = await run(false);
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

    // Avoid sending internal telemetry columns to the brand UI.
    rows = rows.map((r) => {
      const { submitted_ip, submitted_user_agent, ...safe } = r || {};
      return safe;
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, requests: rows });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /requests failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch brand requests' });
  }
});

router.patch('/requests/:id/withdraw', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Request id required' });

    const runFetch = async (canUseBrandId: boolean) => {
      let query: any = supabase.from('collab_requests').select('*').eq('id', id).maybeSingle();
      if (canUseBrandId) {
        if (brand.email) query = query.or(`brand_id.eq.${brand.id},brand_email.eq.${brand.email}`);
        else query = query.eq('brand_id', brand.id);
      } else if (brand.email) {
        query = query.eq('brand_email', brand.email);
      } else {
        return null;
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || null;
    };

    let request: any = null;
    try {
      request = await runFetch(true);
    } catch (err: any) {
      if (isMissingColumnError(err, 'brand_id')) request = await runFetch(false);
      else throw err;
    }

    if (!request) return res.status(404).json({ success: false, error: 'Offer not found' });

    const now = new Date().toISOString();
    const baseUpdate: any = { status: 'declined', updated_at: now };

    const tryUpdate = async (payload: any) => {
      const { data, error } = await supabase
        .from('collab_requests')
        .update(payload)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data || null;
    };

    let updated: any = null;
    try {
      updated = await tryUpdate({ ...baseUpdate, decline_reason: 'withdrawn_by_brand' });
    } catch (err: any) {
      if (isMissingColumnError(err, 'decline_reason')) updated = await tryUpdate(baseUpdate);
      else throw err;
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('[BrandDashboard] PATCH /requests/:id/withdraw failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to withdraw offer' });
  }
});

router.patch('/requests/:id/revise', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Request id required' });

    const {
      exact_budget,
      deliverables,
      deadline,
      campaign_description,
      offer_expires_at,
    } = req.body || {};

    const now = new Date().toISOString();

    const update: any = { status: 'pending', updated_at: now };
    if (exact_budget !== undefined) update.exact_budget = exact_budget === null ? null : Number(exact_budget);
    if (deadline !== undefined) update.deadline = deadline;
    if (campaign_description !== undefined) update.campaign_description = campaign_description;
    if (offer_expires_at !== undefined) update.offer_expires_at = offer_expires_at;
    if (deliverables !== undefined) {
      if (Array.isArray(deliverables)) update.deliverables = JSON.stringify(deliverables);
      else update.deliverables = deliverables;
    }

    const tryUpdate = async (payload: any) => {
      const { data, error } = await supabase
        .from('collab_requests')
        .update(payload)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data || null;
    };

    let updated: any = null;
    try {
      updated = await tryUpdate({ ...update, counter_offer: null });
    } catch (err: any) {
      if (isMissingColumnError(err, 'counter_offer')) updated = await tryUpdate(update);
      else throw err;
    }

    if (!updated) return res.status(404).json({ success: false, error: 'Offer not found' });

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('[BrandDashboard] PATCH /requests/:id/revise failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to revise offer' });
  }
});

router.get('/deals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    // Schema evolves over time across environments. Keep the brand dashboard resilient by
    // progressively falling back when optional columns are missing.
    //
	    // Important: some deployments do not have `deal_execution_status`, so every "full" select
	    // has a corresponding fallback without it.
	    const selectAttempts = [
	      // Newer schemas (signature timestamps + contract state)
	      {
	        select: `
	          id,
	          creator_id,
	          status,
	          deal_execution_status,
	          esign_status,
	          contract_status,
	          contract_signing_status,
	          signing_status,
	          signature_status,
	          brand_signed_at,
	          creator_signed_at,
	          contract_signed_at,
	          signed_at,
	          signed_pdf_url,
	          created_at,
	          updated_at,
	          deal_amount,
	          deliverables,
	          due_date,
	          contract_file_url,
	          safe_contract_url,
	          signed_contract_url,
	          signed_contract_path,
	          brand_id,
	          brand_email
	        `,
	        canUseBrandId: true,
	      },
	      {
	        select: `
	          id,
	          creator_id,
	          status,
	          esign_status,
	          contract_status,
	          contract_signing_status,
	          signing_status,
	          signature_status,
	          brand_signed_at,
	          creator_signed_at,
	          contract_signed_at,
	          signed_at,
	          signed_pdf_url,
	          created_at,
	          updated_at,
	          deal_amount,
	          deliverables,
	          due_date,
	          contract_file_url,
	          safe_contract_url,
	          signed_contract_url,
	          signed_contract_path,
	          brand_id,
	          brand_email
	        `,
	        canUseBrandId: true,
	      },
	      // Brand id available (preferred)
	      {
	        select: `
	          id,
          creator_id,
          status,
          deal_execution_status,
          esign_status,
          signed_at,
          signed_pdf_url,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          signed_contract_path,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          esign_status,
          signed_at,
          signed_pdf_url,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          signed_contract_path,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          deal_execution_status,
          esign_status,
          signed_at,
          signed_pdf_url,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          esign_status,
          signed_at,
          signed_pdf_url,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          signed_contract_path,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          deal_execution_status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          deal_execution_status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },
      {
        select: `
          id,
          creator_id,
          status,
          created_at,
          deal_amount,
          due_date,
          contract_file_url,
          brand_id,
          brand_email
        `,
        canUseBrandId: true,
      },

      // Brand email only (fallback)
      {
        select: `
          id,
          creator_id,
          status,
          deal_execution_status,
          esign_status,
          signed_at,
          signed_pdf_url,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          signed_contract_path,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          esign_status,
          signed_at,
          signed_pdf_url,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          signed_contract_path,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          deal_execution_status,
          esign_status,
          signed_at,
          signed_pdf_url,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          esign_status,
          signed_at,
          signed_pdf_url,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          signed_contract_path,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          deal_execution_status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          signed_contract_url,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          deal_execution_status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          created_at,
          updated_at,
          deal_amount,
          deliverables,
          due_date,
          contract_file_url,
          safe_contract_url,
          brand_email
        `,
        canUseBrandId: false,
      },
      {
        select: `
          id,
          creator_id,
          status,
          created_at,
          deal_amount,
          due_date,
          contract_file_url,
          brand_email
        `,
        canUseBrandId: false,
      },
    ];

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
    let lastError: any = null;
    for (const attempt of selectAttempts) {
      try {
        rows = await run(attempt.select, attempt.canUseBrandId);
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
	        const missingOptionalColumn =
	          isMissingColumnError(err, 'brand_id') ||
	          isMissingColumnError(err, 'signed_contract_url') ||
	          isMissingColumnError(err, 'signed_contract_path') ||
	          isMissingColumnError(err, 'safe_contract_url') ||
	          isMissingColumnError(err, 'deal_execution_status') ||
	          isMissingColumnError(err, 'esign_status') ||
	          isMissingColumnError(err, 'contract_status') ||
	          isMissingColumnError(err, 'contract_signing_status') ||
	          isMissingColumnError(err, 'signing_status') ||
	          isMissingColumnError(err, 'signature_status') ||
	          isMissingColumnError(err, 'brand_signed_at') ||
	          isMissingColumnError(err, 'creator_signed_at') ||
	          isMissingColumnError(err, 'contract_signed_at') ||
	          isMissingColumnError(err, 'signed_at') ||
	          isMissingColumnError(err, 'signed_pdf_url') ||
	          isMissingColumnError(err, 'updated_at');
	        if (!missingOptionalColumn) {
	          throw err;
        }
      }
    }
	    if (lastError) {
	      throw lastError;
	    }

	    // Attach signing timestamps from `contract_signatures` when available.
	    // This makes the dashboard correct even in environments where `brand_deals.status` isn't updated reliably.
	    try {
	      const dealIds = Array.from(new Set(rows.map((r) => String(r?.id || '')).filter(Boolean)));
	      if (dealIds.length > 0) {
	        const { data: sigs, error: sigErr } = await (supabase as any)
	          .from('contract_signatures')
	          .select('deal_id, signer_role, signed, signed_at')
	          .in('deal_id', dealIds as any[]);
	        if (!sigErr && Array.isArray(sigs)) {
	          const byDeal = new Map<string, { brand?: string | null; creator?: string | null }>();
	          sigs.forEach((s: any) => {
	            const dealId = String(s?.deal_id || '');
	            if (!dealId) return;
	            if (!s?.signed) return;
	            const role = String(s?.signer_role || '').toLowerCase();
	            const signedAt = s?.signed_at ? String(s.signed_at) : null;
	            const existing = byDeal.get(dealId) || {};
	            if (role === 'brand') existing.brand = signedAt || existing.brand || null;
	            if (role === 'creator') existing.creator = signedAt || existing.creator || null;
	            byDeal.set(dealId, existing);
	          });

	          rows = rows.map((r) => {
	            const id = String(r?.id || '');
	            const sig = byDeal.get(id);
	            if (!sig) return r;
	            return {
	              ...r,
	              brand_signed_at: (r as any)?.brand_signed_at || sig.brand || null,
	              creator_signed_at: (r as any)?.creator_signed_at || sig.creator || null,
	            };
	          });
	        }
	      }
	    } catch (e) {
	      // Non-fatal: some environments may not have `contract_signatures`.
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
