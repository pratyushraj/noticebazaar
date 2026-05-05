import express, { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../index';

const router = express.Router();

const requireBrand = (req: AuthenticatedRequest, res: Response) => {
  // Validate user exists with required email
  if (!req.user?.id || !req.user?.email) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }
  
  const role = String(req.user.role || '').toLowerCase().trim();
  const email = String(req.user.email).toLowerCase().trim();
  
  // Check role
  if (role !== 'brand' && role !== 'admin') {
    res.status(403).json({ success: false, error: 'Brand access required' });
    return null;
  }
  
  return { id: req.user.id, email, role };
};

router.get('/deals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand) return;

    // Fetch deals filtered by brand_email
    const { data: deals, error: dealsError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('brand_email', brand.email)
      .order('created_at', { ascending: false });

    if (dealsError) throw dealsError;
    if (!deals || deals.length === 0) {
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ success: true, deals: [] });
    }

    // Batch fetch related data
    const creatorIds = Array.from(new Set(
      (deals || []).map((d: any) => String(d.creator_id || '')).filter(Boolean)
    ));
    const collabRequestIds = Array.from(new Set(
      (deals || []).map((d: any) => String(d.collab_request_id || '').trim()).filter(Boolean)
    ));

    const profilesById = new Map<string, any>();
    const requestsById = new Map<string, any>();

    // Batch fetch profiles
    if (creatorIds.length > 0) {
      const { data: profs, error: profsError } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, business_name, avatar_url')
        .in('id' as any, creatorIds as any[]);
      if (profsError) console.warn('[BrandDashboard] Profile fetch warning:', profsError);
      (profs || []).forEach((p: any) => {
        if (p?.id) profilesById.set(String(p.id), p);
      });
    }

    // Batch fetch collab requests
    if (collabRequestIds.length > 0) {
      const { data: reqs, error: reqsError } = await supabase
        .from('collab_requests')
        .select('id, selected_package_id, selected_package_label, selected_package_type, selected_addons, content_quantity, content_duration, content_requirements, barter_types, deliverables')
        .in('id' as any, collabRequestIds as any[]);
      if (reqsError) console.warn('[BrandDashboard] Requests fetch warning:', reqsError);
      (reqs || []).forEach((r: any) => {
        if (r?.id) requestsById.set(String(r.id), r);
      });
    }

    // Safely merge deal and request data (preserve deal fields as primary)
    const enriched = (deals || []).map((d: any) => {
      const request = requestsById.get(String(d.collab_request_id || '')) || null;
      return {
        ...d,
        // Only apply request defaults if deal field is not set
        selected_package_id: d.selected_package_id ?? request?.selected_package_id ?? null,
        selected_package_label: d.selected_package_label ?? request?.selected_package_label ?? null,
        selected_package_type: d.selected_package_type ?? request?.selected_package_type ?? null,
        selected_addons: d.selected_addons ?? request?.selected_addons ?? [],
        content_quantity: d.content_quantity ?? request?.content_quantity ?? null,
        content_duration: d.content_duration ?? request?.content_duration ?? null,
        content_requirements: d.content_requirements ?? request?.content_requirements ?? [],
        barter_types: d.barter_types ?? request?.barter_types ?? [],
        request_deliverables: request?.deliverables ?? null,
        // Attach profile as nested object (keep field name as "profiles" for backward compatibility)
        profiles: profilesById.get(String(d.creator_id)) ?? null,
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, deals: enriched });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /deals failed:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch deals',
      ...(process.env.NODE_ENV === 'development' && { debug: error?.toString?.() }),
    });
  }
});

router.get('/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand) return;

    const { data: requests, error } = await supabase
      .from('collab_requests')
      .select('*')
      .eq('brand_email', brand.email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, requests: requests || [] });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /requests failed:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch requests',
      ...(process.env.NODE_ENV === 'development' && { debug: error?.toString?.() }),
    });
  }
});

router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand) return;

    // Fetch brand profile by external_id (email)
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('external_id', brand.email)
      .maybeSingle();

    if (error) throw error;

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, brand: data || null });
  } catch (error: any) {
    console.error('[BrandDashboard] GET /profile failed:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch brand profile',
      ...(process.env.NODE_ENV === 'development' && { debug: error?.toString?.() }),
    });
  }
});

router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = requireBrand(req, res);
    if (!brand) return;

    // Safely extract and validate input
    const { name, website_url, industry, description, logo_url, company_address } = req.body;

    // Validate brand name
    const cleanName = String(name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Brand name must be at least 2 characters' });
    }
    if (cleanName.length > 255) {
      return res.status(400).json({ success: false, error: 'Brand name must be 255 characters or less' });
    }

    // Validate and sanitize optional fields
    const cleanWebsiteUrl = website_url ? String(website_url).trim() : null;
    const cleanIndustry = industry ? String(industry).trim().slice(0, 100) : null;
    const cleanDescription = description ? String(description).trim().slice(0, 1000) : null;
    const cleanLogoUrl = logo_url ? String(logo_url).trim() : null;
    const cleanCompanyAddress = company_address ? String(company_address).trim().slice(0, 500) : null;

    // Validate URLs if provided
    if (cleanWebsiteUrl) {
      try {
        new URL(cleanWebsiteUrl);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid website URL' });
      }
    }
    if (cleanLogoUrl) {
      try {
        new URL(cleanLogoUrl);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid logo URL' });
      }
    }

    // Check if brand exists by external_id (email)
    const { data: existing, error: checkError } = await supabase
      .from('brands')
      .select('id')
      .eq('external_id', brand.email)
      .maybeSingle();

    if (checkError) throw checkError;

    const brandPayload: any = {
      external_id: brand.email,
      name: cleanName,
      website_url: cleanWebsiteUrl,
      industry: cleanIndustry,
      description: cleanDescription,
      logo_url: cleanLogoUrl,
      company_address: cleanCompanyAddress,
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
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to save brand profile',
      ...(process.env.NODE_ENV === 'development' && { debug: error?.toString?.() }),
    });
  }
});

export default router;
