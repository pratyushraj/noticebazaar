// Admin API routes

import { Router, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Middleware to check admin role
const adminOnly = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /admin/conversations - List all conversations (admin only)
router.get('/conversations', adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          user_id,
          role,
          profiles:user_id(first_name, last_name, email)
        )
      `)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ data: conversations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/messages/:id/flag - Flag message for review
router.post('/messages/:id/flag', adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    // Create audit log entry
    const { error } = await supabase
      .from('message_audit_logs')
      .insert({
        message_id: id,
        action: 'flagged',
        performed_by: req.user!.id,
        details: { reason, notes }
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/dashboard-stats - Get dashboard statistics (admin only, uses service role)
router.get('/dashboard-stats', adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Helper function to safely fetch count
    const safeCount = async (table: string, query?: (q: any) => any): Promise<number> => {
      try {
        let queryBuilder = supabase.from(table).select('id', { count: 'exact', head: true });
        if (query) {
          queryBuilder = query(queryBuilder);
        }
        const { count, error } = await queryBuilder;
        if (error) {
          console.warn(`[AdminDashboard] Error fetching ${table}:`, error.message);
          return 0;
        }
        return count || 0;
      } catch (error: any) {
        console.warn(`[AdminDashboard] Exception fetching ${table}:`, error.message);
        return 0;
      }
    };

    // Fetch Total Users Count (all profiles)
    const totalUsers = await safeCount('profiles');

    // Fetch New Accounts Count (accounts created in date range, or last 30 days if no range specified)
    let newAccountsQuery = (q: any) => {
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        q = q.gte('created_at', start.toISOString());
      } else {
        // Default to last 30 days if no date range specified
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        q = q.gte('created_at', thirtyDaysAgo.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        q = q.lte('created_at', end.toISOString());
      }
      return q;
    };
    const newAccounts = await safeCount('profiles', newAccountsQuery);

    // Fetch Total Contracts Made (brand_deals with contract_file_url)
    const contractsMade = await safeCount('brand_deals', (q) => 
      q.not('contract_file_url', 'is', null)
    );

    // Fetch Links Generated (deal_details_tokens + contract_ready_tokens)
    const dealTokensCount = await safeCount('deal_details_tokens');
    const contractTokensCount = await safeCount('contract_ready_tokens');
    const linksGenerated = dealTokensCount + contractTokensCount;

    // Fetch Referral Links Count
    const referralLinks = await safeCount('referral_links');

    // Fetch Total Deals Count
    const totalDeals = await safeCount('brand_deals');

    // Fetch Active Deals Count (status = 'active' or 'pending')
    const activeDeals = await safeCount('brand_deals', (q) => 
      q.in('status', ['active', 'pending'])
    );

    res.json({
      totalUsersCount: totalUsers,
      newAccountsCount: newAccounts,
      contractsMadeCount: contractsMade,
      linksGeneratedCount: linksGenerated,
      referralLinksCount: referralLinks,
      totalDealsCount: totalDeals,
      activeDealsCount: activeDeals,
    });
  } catch (error: any) {
    console.error('[AdminDashboard] Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

