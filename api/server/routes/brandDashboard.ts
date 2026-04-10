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

    // Attach creator profiles (best-effort).
    const creatorIds = Array.from(new Set((deals || []).map((d: any) => String(d.creator_id || '')).filter(Boolean)));
    let profilesById = new Map<string, any>();
    if (creatorIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, business_name, avatar_url')
        .in('id' as any, creatorIds as any[]);
      (profs || []).forEach((p: any) => {
        if (p?.id) profilesById.set(String(p.id), p);
      });
    }

    const enriched = (deals || []).map((d: any) => ({
      ...d,
      profiles: profilesById.get(String(d.creator_id)) || null,
    }));

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

export default router;

