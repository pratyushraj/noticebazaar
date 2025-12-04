// Payments API routes

import { Router } from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /payments/recent - Get recent payments
router.get('/recent', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const { data: payments, error } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('creator_id', userId)
      .not('deal_amount', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ data: payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /payments/request - Request payment from brand
router.post('/request', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { deal_id, amount, due_date, notes } = req.body;

    if (!deal_id || !amount) {
      return res.status(400).json({ error: 'deal_id and amount required' });
    }

    // Verify deal belongs to user
    const { data: deal } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', deal_id)
      .eq('creator_id', userId)
      .single();

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Update deal with payment request
    const { data: updated, error } = await supabase
      .from('brand_deals')
      .update({
        payment_expected_date: due_date,
        payment_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', deal_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /payments/mark-received - Mark payment as received
router.post('/mark-received', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { deal_id, received_date, utr_number, proof_url } = req.body;

    if (!deal_id) {
      return res.status(400).json({ error: 'deal_id required' });
    }

    // Verify deal belongs to user
    const { data: deal } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', deal_id)
      .eq('creator_id', userId)
      .single();

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Update deal
    const { data: updated, error } = await supabase
      .from('brand_deals')
      .update({
        payment_received_date: received_date || new Date().toISOString(),
        utr_number: utr_number || null,
        proof_of_payment_url: proof_url || null,
        status: 'Completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', deal_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

