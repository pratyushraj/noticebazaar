import express, { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../index';

const router = express.Router();

const requireBrand = (req: AuthenticatedRequest, res: Response) => {
  const role = String(req.user?.role || '').toLowerCase();
  const email = req.user?.email ? String(req.user.email).toLowerCase() : null;
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }
  if (role !== 'brand' && role !== 'admin') {
    res.status(403).json({ success: false, error: 'Brand access required' });
    return null;
  }
  if (!email && role !== 'admin') {
    res.status(400).json({ success: false, error: 'Brand email missing' });
    return null;
  }
  return { id: req.user.id, email, role };
};

router.get('/deals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand) return;

    let query: any = supabase
      .from('brand_deals')
      .select('*')
      .order('created_at', { ascending: false });

    // Most environments key off brand_email.
    if (brand.email) query = query.eq('brand_email', brand.email);

    const { data: deals, error } = await query;
    if (error) throw error;

    // Attach creator profiles and original collab request package metadata (best-effort).
    const creatorIds = Array.from(new Set((deals || []).map((d: any) => String(d.creator_id || '')).filter(Boolean)));
    const collabRequestIds = Array.from(new Set((deals || []).map((d: any) => String(d.collab_request_id || '').trim()).filter(Boolean)));
    let profilesById = new Map<string, any>();
    let requestsById = new Map<string, any>();
    if (creatorIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, business_name, avatar_url')
        .in('id' as any, creatorIds as any[]);
      (profs || []).forEach((p: any) => {
        if (p?.id) profilesById.set(String(p.id), p);
      });
    }
    if (collabRequestIds.length > 0) {
      const { data: reqs } = await supabase
        .from('collab_requests')
        .select('id, selected_package_id, selected_package_label, selected_package_type, selected_addons, content_quantity, content_duration, content_requirements, barter_types, deliverables')
        .in('id' as any, collabRequestIds as any[]);
      (reqs || []).forEach((r: any) => {
        if (r?.id) requestsById.set(String(r.id), r);
      });
    }

    const enriched = (deals || []).map((d: any) => {
      const request = requestsById.get(String(d.collab_request_id || '')) || null;
      return {
        ...request,
        ...d,
        selected_package_id: d.selected_package_id || request?.selected_package_id || null,
        selected_package_label: d.selected_package_label || request?.selected_package_label || null,
        selected_package_type: d.selected_package_type || request?.selected_package_type || null,
        selected_addons: d.selected_addons || request?.selected_addons || [],
        content_quantity: d.content_quantity || request?.content_quantity || null,
        content_duration: d.content_duration || request?.content_duration || null,
        content_requirements: d.content_requirements || request?.content_requirements || [],
        barter_types: d.barter_types || request?.barter_types || [],
        request_deliverables: request?.deliverables || null,
        profiles: profilesById.get(String(d.creator_id)) || null,
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, deals: enriched });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /deals failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch deals' });
  }
});

router.get('/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand) return;

    let query: any = supabase
      .from('collab_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (brand.email) query = query.eq('brand_email', brand.email);

    const { data: requests, error } = await query;
    if (error) throw error;

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, requests: requests || [] });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /requests failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch requests' });
  }
});

router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand) return;

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('external_id', brand.email)
      .maybeSingle();

    if (error) throw error;

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, brand: data });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /profile failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch brand profile' });
  }
});

router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand) return;

    const { name, website_url, industry, description, logo_url, company_address } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Brand name is required' });
    }

    // Check if brand exists by external_id (email)
    const { data: existing } = await supabase
      .from('brands')
      .select('id')
      .eq('external_id', brand.email)
      .maybeSingle();

    const brandPayload: any = {
      external_id: brand.email,
      name: name.trim(),
      website_url: website_url || null,
      industry: industry || null,
      description: description || null,
      logo_url: logo_url || null,
      company_address: company_address ? String(company_address).trim() : null,
      updated_at: new Date().toISOString(),
    };

    let data, error;
    if (existing?.id) {
      // Update existing
      ({ data, error } = await supabase
        .from('brands')
        .update(brandPayload)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      // Insert new
      brandPayload.created_at = new Date().toISOString();
      ({ data, error } = await supabase
        .from('brands')
        .insert(brandPayload)
        .select()
        .single());
    }

    if (error) throw error;

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, brand: data });
  } catch (error: any) {
    console.error('[BrandDashboard] PUT /profile failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to save brand profile' });
  }
});

export default router;
