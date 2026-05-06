// @ts-nocheck
import crypto from 'crypto';
import express, { Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

const isAnyMissingColumnError = (err: any) => {
  const msg = String(err?.message || err?.details || err?.hint || '').toLowerCase();
  return (
    msg.includes('could not find the') ||
    msg.includes('does not exist') ||
    (msg.includes('column') && msg.includes('schema cache'))
  );
};

// Automatically link records that were created using only an email address
// to the actual brand account when they log in. This ensures real-time
// subscriptions and RLS work correctly.
const linkOrphanedRecords = async (userId: string, email: string | null) => {
  if (!email) return;
  const brandEmail = String(email).toLowerCase().trim();
  
  try {
    // Perform direct updates. Postgres handles the case where no rows match efficiently.
    // This reduces the number of roundtrips to Supabase from 4 down to 2.
    await Promise.all([
      supabase
        .from('collab_requests')
        .update({ brand_id: userId } as any)
        .eq('brand_email', brandEmail)
        .is('brand_id', null),
      supabase
        .from('brand_deals')
        .update({ brand_id: userId } as any)
        .eq('brand_email', brandEmail)
        .is('brand_id', null)
    ]);
  } catch (err) {
    // Non-fatal
    console.warn('[BrandDashboard] Record linking notice:', err?.message || err);
  }
};

const requireBrand = async (req: AuthenticatedRequest, res: Response): Promise<{ ok: true; id: string; email: string | null } | { ok: false }> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return { ok: false };
  }
  const email = req.user?.email ? String(req.user.email).toLowerCase() : null;
  
  // For the purpose of the dashboard, we allow the request to proceed if authenticated.
  // The specific routes can then decide what data to return based on what's found in the database.
  return { ok: true, id: userId, email };
};

router.get('/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    // Link any orphaned requests to this brand ID
    await linkOrphanedRecords(brand.id, brand.email);

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
        .select('*')
        .in('id' as any, creatorIds as any[]);
      if (!profErr) {
        let transformedProfs = profs || [];
        // Apply hardcoded overrides for consistency
        transformedProfs = transformedProfs.map(p => {
          const isBlockedSocial = (url: string | null | undefined) => {
            const s = String(url || '').toLowerCase();
            return s.includes('cdninstagram.com') || s.includes('instagram.com') || s.includes('fbcdn.net');
          };

          // Step 1: Resolve best available photo
          const photoUrl = p.avatar_url || p.instagram_profile_photo || null;

          // Step 2: For everyone, return the photo
          return {
            ...p,
            avatar_url: photoUrl,
            instagram_profile_photo: photoUrl
          };
        });
        const byId = buildProfilesById(transformedProfs);
        rows = rows.map((r) => {
          const profile = byId.get(String(r.creator_id)) || null;
          // If we have a profile, ensure we have at least a username or first_name
          // This helps the frontend display something better than "Creator"
          return { 
            ...r, 
            profiles: profile,
            // Denormalize some fields for easier frontend access if needed
            creator_name: String(profile ? (`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || profile.business_name || r.creator_name || 'Creator') : (r.creator_name || 'Creator')).trim() || 'Creator',
            creator_avatar_url: String(profile ? (profile.avatar_url || profile.instagram_profile_photo || r.creator_avatar_url || '') : (r.creator_avatar_url || '')).trim()
          };
        });
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

// Upsert the brand identity row (service role; bypasses RLS).
// Used by the brand console settings page and brand signup flows.
router.post('/identity', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ success: false, error: 'Brand name is required' });

    const payload: any = {
      external_id: brand.id,
      name,
      website_url: req.body?.website_url ? String(req.body.website_url).trim() : null,
      industry: req.body?.industry ? String(req.body.industry).trim() : null,
      description: req.body?.description ? String(req.body.description).trim() : null,
      updated_at: new Date().toISOString(),
    };

    // If the caller passes a logo url, persist it (non-fatal if column doesn't exist).
    if (req.body?.logo_url) payload.logo_url = String(req.body.logo_url).trim();

    const { data: existing, error: existingErr } = await supabase
      .from('brands')
      .select('id')
      .eq('external_id', brand.id)
      .maybeSingle();
    if (existingErr) throw existingErr;

    const now = new Date().toISOString();
    if (existing?.id) {
      const { data, error } = await supabase
        .from('brands')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ success: true, brand: data || null });
    }

    const insertPayload = { ...payload, created_at: now };
    const { data, error } = await supabase
      .from('brands')
      .insert(insertPayload)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, brand: data || null });
  } catch (error: any) {
    console.error('[BrandDashboard] POST /identity failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to save brand identity' });
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
      if (Array.isArray(deliverables)) {
        update.deliverables = JSON.stringify(deliverables);
      } else {
        // Normalize comma-string to JSON array for consistent parsing
        update.deliverables = JSON.stringify(
          String(deliverables).split(',').map((s: string) => s.trim()).filter(Boolean)
        );
      }
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

router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    const userId = brand.id;

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('external_id', userId)
      .maybeSingle();

    if (error) {
      console.error(`[BrandDashboard] Profile fetch error for ${userId}:`, error);
      throw error;
    }
    console.log(`[BrandDashboard] Profile fetched for ${userId}:`, data ? 'Found' : 'Not Found');

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, brand: data || null });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /profile failed:', error);
    // Also log to the file
    try {
      const fs = await import('fs');
      fs.appendFileSync('brand_profile_errors.log', `${new Date().toISOString()} - Catch Error: ${error?.message || String(error)}\nStack: ${error?.stack}\n`);
    } catch {}
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch brand profile',
    });
  }
});

router.post(
  '/upload-logo',
  upload.single('file'),
  async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response) => {
    try {
      const brand = await requireBrand(req, res);
      if (!brand.ok) return;

      const file = req.file;
      if (!file || !file.buffer) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowed.includes(file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Only JPEG, PNG, WebP, SVG, and GIF are allowed' });
      }

      const ext = file.mimetype.split('/')[1]?.split('+')[0] || 'png';
      const path = `brand-assets/logos/${brand.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

      if (uploadError) {
        console.error('[BrandDashboard] POST /upload-logo upload failed:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload logo' });
      }

      const { data: urlData } = supabase.storage.from('creator-assets').getPublicUrl(path);
      return res.status(200).json({ success: true, url: urlData.publicUrl });
    } catch (error: any) {
      console.error('[BrandDashboard] POST /upload-logo failed:', error);
      return res.status(500).json({ success: false, error: error?.message || 'Failed to upload logo' });
    }
  }
);

router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    const userId = brand.id;
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return res.status(400).json({ success: false, error: 'Brand name required' });

    const budgetRange = typeof body.budget_range === 'string' ? body.budget_range.trim() || null : null;

    const payload: any = {
      external_id: userId,
      name,
      website_url: typeof body.website_url === 'string' ? body.website_url.trim() || null : null,
      industry: typeof body.industry === 'string' ? body.industry.trim() || 'General' : 'General',
      description: typeof body.description === 'string' ? body.description.trim() || null : null,
      logo_url: typeof body.logo_url === 'string' ? body.logo_url.trim() || null : null,
      instagram_handle: typeof body.instagram_handle === 'string' ? body.instagram_handle.trim() || null : null,
      whatsapp_handle: typeof body.whatsapp_handle === 'string' ? body.whatsapp_handle.trim() || null : null,
      content_niches: Array.isArray(body.content_niches) ? body.content_niches : [],
      company_address: typeof body.company_address === 'string' ? body.company_address.trim() || null : null,
      updated_at: new Date().toISOString(),
    };

    if (budgetRange) {
      const parsed = budgetRange.match(/(\d+)(?:k|l)?/gi);
      if (parsed && parsed.length >= 1) {
        const toNumber = (raw: string) => {
          const normalized = raw.toLowerCase();
          const value = Number.parseFloat(normalized.replace(/[^\d.]/g, ''));
          if (Number.isNaN(value)) return null;
          if (normalized.includes('l')) return Math.round(value * 100000);
          if (normalized.includes('k')) return Math.round(value * 1000);
          return Math.round(value);
        };
        const min = toNumber(parsed[0]);
        const max = parsed[1] ? toNumber(parsed[1]) : min;
        if (min !== null) payload.budget_min = min;
        if (max !== null) payload.budget_max = max;
      }
    }

    const tryUpsert = async (payloadToUse: any) => {
      // Create a select clause that only includes columns present in the current payload attempt,
      // plus the mandatory ID/Audit columns. This ensures .select() doesn't fail if a column is missing.
      const mandatory = ['id', 'external_id', 'name', 'website_url', 'industry', 'description', 'logo_url', 'created_at', 'updated_at'];
      const optional = ['budget_min', 'budget_max', 'company_address', 'instagram_handle', 'whatsapp_handle', 'content_niches'];
      
      const availableColumns = [...mandatory, ...optional.filter(col => Object.keys(payloadToUse).includes(col) || col === 'budget_min' || col === 'budget_max')];
      
      // We manually check for existence to avoid the requirement of a UNIQUE constraint on external_id 
      // which is causing "ON CONFLICT" errors in some environments.
      const { data: existing } = await supabase
        .from('brands')
        .select('id')
        .eq('external_id', userId)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('brands')
          .update(payloadToUse)
          .eq('id', existing.id)
          .select(availableColumns.join(', '))
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('brands')
          .insert({ ...payloadToUse, created_at: new Date().toISOString() })
          .select(availableColumns.join(', '))
          .maybeSingle();
        if (error) throw error;
        return data;
      }
    };

    const payloadAttempts = [
      payload,
      (() => {
        const { company_address, ...safePayload } = payload;
        return safePayload;
      })(),
      (() => {
        const { company_address, instagram_handle, whatsapp_handle, content_niches, ...legacyPayload } = payload;
        return legacyPayload;
      })(),
      (() => {
        const {
          company_address,
          instagram_handle,
          whatsapp_handle,
          content_niches,
          budget_min,
          budget_max,
          ...oldestPayload
        } = payload;
        return oldestPayload;
      })(),
    ];

    let result: any = null;
    let lastError: any = null;
    for (const attempt of payloadAttempts) {
      try {
        result = await tryUpsert(attempt);
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        if (!isAnyMissingColumnError(err)) {
          throw err;
        }
        console.warn('[BrandDashboard] Profile update fallback triggered:', err?.message || err);
      }
    }

    if (lastError) {
      throw lastError;
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, brand: result || null });
  } catch (error: any) {
    console.error('[BrandDashboard] PUT /profile failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to save brand profile' });
  }
});

router.get('/deals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    // Link any orphaned deals to this brand ID
    await linkOrphanedRecords(brand.id, brand.email);

    // Schema evolves over time across environments. Keep the brand dashboard resilient by
    // progressively falling back when optional columns are missing.
    const selectAttempts = [
      {
        select: '*',
        canUseBrandId: true,
      },
      // Schema fallback if * fails
      {
        select: `
          id, creator_id, status, created_at, updated_at, deal_amount, deliverables, due_date, 
          contract_file_url, safe_contract_url, brand_address, brand_phone, contact_person, 
          shipping_required, brand_id, brand_email, signed_contract_path,
          delivery_address, delivery_name, delivery_phone, usage_rights, usage_duration
        `,
        canUseBrandId: true,
      },
      {
        select: 'id, creator_id, status, created_at, updated_at, deal_amount, deliverables, due_date, brand_id, brand_email, delivery_address, delivery_name, delivery_phone, usage_rights, usage_duration',
        canUseBrandId: true,
      }
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
        // Optimization: don't loop if it's not a missing column error
        if (!isAnyMissingColumnError(err)) {
          throw err;
        }
      }
    }

    if (lastError) {
      console.error('[BrandDashboard] Select attempts exhausted:', lastError);
      throw lastError;
    }

    // Hydrate all secondary data in parallel to minimize latency
    const dealIds = Array.from(new Set(rows.map((r) => String(r?.id || '')).filter(Boolean)));
    const creatorIds = Array.from(new Set(rows.map((r) => String(r.creator_id || '')).filter(Boolean)));

    if (dealIds.length > 0 || creatorIds.length > 0) {
      try {
        const [sigsRes, profsRes, logsRes] = await Promise.all([
          // 1. Signatures
          dealIds.length > 0 ? (supabase as any).from('contract_signatures').select('deal_id, signer_role, signed, signed_at').in('deal_id', dealIds) : Promise.resolve({ data: [] }),
          // 2. Profiles
          creatorIds.length > 0 ? supabase.from('profiles').select('*').in('id' as any, creatorIds as any[]) : Promise.resolve({ data: [] }),
          // 3. Action Logs
          dealIds.length > 0 ? (supabase as any).from('deal_action_logs').select('deal_id, event, metadata, created_at').in('deal_id', dealIds).in('event', ['CONTENT_SUBMITTED', 'REVISION_SUBMITTED', 'CONTENT_APPROVED', 'REVISION_REQUESTED', 'DEAL_DISPUTED', 'PAYMENT_RELEASED', 'shipping_marked_shipped', 'shipping_status_updated', 'shipping_confirmed_delivered'] as any[]).order('created_at', { ascending: false }) : Promise.resolve({ data: [] })
        ]);

        // Process Signatures
        if (!sigsRes.error && Array.isArray(sigsRes.data)) {
          const byDeal = new Map<string, { brand?: string | null; creator?: string | null }>();
          sigsRes.data.forEach((s: any) => {
            const dealId = String(s?.deal_id || '');
            if (!dealId || !s?.signed) return;
            const role = String(s?.signer_role || '').toLowerCase();
            const signedAt = s?.signed_at ? String(s.signed_at) : null;
            const existing = byDeal.get(dealId) || {};
            if (role === 'brand') existing.brand = signedAt || existing.brand || null;
            if (role === 'creator') existing.creator = signedAt || existing.creator || null;
            byDeal.set(dealId, existing);
          });

          rows = rows.map((r) => {
            const sig = byDeal.get(String(r?.id || ''));
            if (!sig) return r;
            return {
              ...r,
              brand_signed_at: (r as any)?.brand_signed_at || sig.brand || null,
              creator_signed_at: (r as any)?.creator_signed_at || sig.creator || null,
            };
          });
        }

        // Process Profiles
        if (!profsRes.error && Array.isArray(profsRes.data)) {
          const byId = buildProfilesById(profsRes.data);
          rows = rows.map((r) => {
            const profile = byId.get(String(r.creator_id)) || null;
            return { 
              ...r, 
              profiles: profile,
              creator_name: String(profile ? (`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || profile.business_name || (r as any).creator_name || 'Creator') : ((r as any).creator_name || 'Creator')).trim() || 'Creator',
              creator_avatar_url: String(profile ? (profile.avatar_url || profile.instagram_profile_photo || (r as any).creator_avatar_url || '') : ((r as any).creator_avatar_url || '')).trim()
            };
          });
        }

        // Process Action Logs
        if (!logsRes.error && Array.isArray(logsRes.data)) {
          const latestByDeal = new Map<string, any[]>();
          logsRes.data.forEach((log: any) => {
            const dealId = String(log?.deal_id || '');
            if (!dealId) return;
            const bucket = latestByDeal.get(dealId) || [];
            bucket.push(log);
            latestByDeal.set(dealId, bucket);
          });

          rows = rows.map((row) => {
            const dealLogs = latestByDeal.get(String(row?.id || '')) || [];
            const submissionLog = dealLogs.find((log: any) => log?.event === 'CONTENT_SUBMITTED' || log?.event === 'REVISION_SUBMITTED');
            const reviewLog = dealLogs.find((log: any) => log?.event === 'CONTENT_APPROVED' || log?.event === 'REVISION_REQUESTED' || log?.event === 'DEAL_DISPUTED');
            const paymentLog = dealLogs.find((log: any) => log?.event === 'PAYMENT_RELEASED');
            const shippingLog = dealLogs.find((log: any) => log?.event === 'shipping_marked_shipped' || log?.event === 'shipping_status_updated' || log?.event === 'shipping_confirmed_delivered');

            const submissionMeta = submissionLog?.metadata || {};
            const reviewMeta = reviewLog?.metadata || {};
            const paymentMeta = paymentLog?.metadata || {};
            const shippingMeta = shippingLog?.metadata || {};

            const collabKind = String((row as any)?.collab_type || (row as any)?.deal_type || '').trim().toLowerCase();
            const requiresPayment = collabKind === 'paid' || collabKind === 'both' || collabKind === 'hybrid' || collabKind === 'paid_barter' || (collabKind !== 'barter' && Number((row as any)?.deal_amount || 0) > 0);
            const requiresShipping = typeof (row as any)?.shipping_required === 'boolean'
              ? Boolean((row as any).shipping_required)
              : (collabKind === 'barter' || collabKind === 'both' || collabKind === 'hybrid' || collabKind === 'paid_barter');

            const rawLinks = Array.isArray(submissionMeta.content_links) ? submissionMeta.content_links : [];
            const contentLinks = Array.from(new Set([submissionMeta.content_url, ...rawLinks].map(v => String(v || '').trim()).filter(Boolean)));

            return {
              ...row,
              content_submission_url: String((row as any)?.content_submission_url || submissionMeta.content_url || '').trim() || null,
              content_url: String((row as any)?.content_url || submissionMeta.content_url || '').trim() || null,
              content_links: Array.isArray((row as any)?.content_links) && (row as any).content_links.length ? (row as any).content_links : contentLinks,
              content_caption: String((row as any)?.content_caption || submissionMeta.caption || '').trim() || null,
              content_notes: String((row as any)?.content_notes || submissionMeta.notes || '').trim() || null,
              content_delivery_status: String((row as any)?.content_delivery_status || submissionMeta.content_status || '').trim() || null,
              brand_feedback: String((row as any)?.brand_feedback || reviewMeta.feedback || '').trim() || null,
              utr_number: String((row as any)?.utr_number || paymentMeta.payment_reference || '').trim() || null,
              payment_received_date: String((row as any)?.payment_received_date || paymentMeta.payment_received_date || '').trim() || null,
              payment_proof_url: String((row as any)?.payment_proof_url || paymentMeta.payment_proof_url || '').trim() || null,
              payment_notes: String((row as any)?.payment_notes || paymentMeta.payment_notes || '').trim() || null,
              shipping_required: requiresShipping,
              requires_shipping: requiresShipping,
              requires_payment: requiresPayment,
              shipping_status: String((row as any)?.shipping_status || shippingMeta.status || '').trim() || null,
              courier_name: String((row as any)?.courier_name || shippingMeta.courier_name || '').trim() || null,
              tracking_number: String((row as any)?.tracking_number || shippingMeta.tracking_number || '').trim() || null,
              tracking_url: String((row as any)?.tracking_url || shippingMeta.tracking_url || '').trim() || null,
              expected_delivery_date: String((row as any)?.expected_delivery_date || shippingMeta.expected_delivery_date || '').trim() || null,
            };
          });
        }
      } catch (err) {
        console.warn('[BrandDashboard] Hydration error:', err);
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, deals: rows });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /deals failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch brand deals' });
  }
});

router.post(
  '/deals/:id/upload-product-photo',
  upload.single('file'),
  async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response) => {
    try {
      const brand = await requireBrand(req, res);
      if (!brand.ok) return;

      const { id: dealId } = req.params;
      const file = req.file;

      if (!file || !file.buffer) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Only JPEG, PNG, WebP, and GIF are allowed' });
      }

      // Verify deal belongs to this brand
      const { data: deal, error: dealError } = await supabase
        .from('brand_deals')
        .select('id, brand_id, brand_email')
        .eq('id', dealId)
        .maybeSingle();

      if (dealError || !deal) {
        return res.status(404).json({ success: false, error: 'Deal not found' });
      }

      const dealBrandEmail = String(deal.brand_email || '').toLowerCase();
      const hasAccess = deal.brand_id === brand.id || (brand.email && dealBrandEmail === brand.email);
      
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const ext = file.mimetype.split('/')[1] || 'png';
      const path = `deal-assets/products/${dealId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

      if (uploadError) {
        console.error('[BrandDashboard] Deal product photo upload failed:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload photo' });
      }

      const { data: urlData } = supabase.storage.from('creator-assets').getPublicUrl(path);
      return res.status(200).json({ success: true, url: urlData.publicUrl });
    } catch (error: any) {
      console.error('[BrandDashboard] POST /deals/:id/upload-product-photo failed:', error);
      return res.status(500).json({ success: false, error: error?.message || 'Failed to upload photo' });
    }
  }
);

router.patch('/deals/:id/product-photo', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await requireBrand(req, res);
    if (!brand.ok) return;

    const { id: dealId } = req.params;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'Product photo URL is required' });
    }

    // Verify deal belongs to this brand
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, brand_id, brand_email')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String(deal.brand_email || '').toLowerCase();
    const hasAccess = deal.brand_id === brand.id || (brand.email && dealBrandEmail === brand.email);
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({ 
        barter_product_image_url: url,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', dealId);

    if (updateError) {
      console.error('[BrandDashboard] Deal product photo update failed:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update product photo' });
    }

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: brand.id,
      event: 'PRODUCT_PHOTO_UPDATED',
      metadata: { url }
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[BrandDashboard] PATCH /deals/:id/product-photo failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to update product photo' });
  }
});

export default router;
