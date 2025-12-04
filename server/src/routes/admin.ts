// Admin API routes

import { Router } from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Middleware to check admin role
const adminOnly = (req: AuthenticatedRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /admin/conversations - List all conversations (admin only)
router.get('/conversations', adminOnly, async (req: AuthenticatedRequest, res) => {
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
router.post('/messages/:id/flag', adminOnly, async (req: AuthenticatedRequest, res) => {
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

export default router;

