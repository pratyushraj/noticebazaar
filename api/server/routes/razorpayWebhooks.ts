// Razorpay Webhook Handler
import { Router, Request, Response } from 'express';
import { supabase } from '../index';
import crypto from 'crypto';
import { sendCollabRequestAcceptedEmail } from '../services/collabRequestEmailService';

const router = Router();

// POST /api/webhooks/razorpay
router.post('/', async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature || !secret) {
    console.warn('[Razorpay Webhook] Missing signature or secret');
    return res.status(400).send('Missing signature');
  }

  // Verify webhook signature
  const rawBody = (req as any).rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody || JSON.stringify(req.body))
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('[Razorpay Webhook] Signature mismatch');
    return res.status(401).send('Invalid signature');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  console.log(`[Razorpay Webhook] Event received: ${event}`);

  if (event === 'payment.captured' || event === 'order.paid') {
    const data = event === 'payment.captured' ? payload.payment.entity : payload.order.entity;
    const dealId = data.notes?.deal_id;
      const paymentId = event === 'payment.captured' ? data.id : data.id;
      const orderId = event === 'payment.captured' ? data.order_id : data.id;

    if (!dealId) {
      console.warn('[Razorpay Webhook] No deal_id in notes');
      return res.json({ success: true, message: 'No deal_id found' });
    }

    try {
      // Fetch deal
      const { data: deal, error: fetchError } = await supabase
        .from('brand_deals')
        .select('*')
        .eq('id', dealId)
        .maybeSingle();

      if (fetchError || !deal) {
        console.error('[Razorpay Webhook] Deal not found:', dealId);
        return res.status(404).json({ error: 'Deal not found' });
      }

      // If already in content_making, skip
      if (deal.status?.toLowerCase() === 'content_making') {
        return res.json({ success: true, message: 'Already processed' });
      }

      const now = new Date().toISOString();
      const updateData: any = {
        status: 'content_making',
        updated_at: now
      };
      
      // Update columns if they exist
      if ('payment_id' in deal) updateData.payment_id = paymentId || orderId;
      if ('payment_status' in deal) updateData.payment_status = 'captured';
      if ('amount_paid' in deal && data.amount) updateData.amount_paid = data.amount / 100;

      const { error: updateError } = await supabase
        .from('brand_deals')
        .update(updateData)
        .eq('id', dealId);

      if (updateError) {
        console.error('[Razorpay Webhook] Update failed:', updateError);
        return res.status(500).json({ error: 'Update failed' });
      }

      // Log action
      await supabase.from('deal_action_logs').insert({
        deal_id: dealId,
        event: 'PAYMENT_VERIFIED_WEBHOOK',
        metadata: { event, order_id: orderId, payment_id: data.id }
      }).catch(e => console.warn('[Razorpay Webhook] Log fail:', e));

      // Notify
      if (deal.brand_email) {
        sendCollabRequestAcceptedEmail(deal.brand_email, {
          creatorName: deal.creator_name || 'Creator',
          brandName: deal.brand_name || 'Brand',
          dealAmount: Number(deal.deal_amount || 0),
          dealType: 'paid',
          deliverables: Array.isArray(deal.deliverables) ? deal.deliverables : ['Content Creation'],
          contractReadyToken: 'paid_webhook'
        }).catch(e => console.warn('[Razorpay Webhook] Email fail:', e));
      }

      console.log(`[Razorpay Webhook] Successfully processed ${event} for deal ${dealId}`);
    } catch (err) {
      console.error('[Razorpay Webhook] Error:', err);
      return res.status(500).send('Internal Error');
    }
  } else if (event === 'payment.failed') {
    const data = payload.payment.entity;
    const dealId = data.notes?.deal_id;
    const errorMsg = data.error_description || 'Payment failed';
    
    console.warn(`[Razorpay Webhook] Payment failed for deal ${dealId}: ${errorMsg}`);
    
    if (dealId) {
      await supabase.from('deal_action_logs').insert({
        deal_id: dealId,
        event: 'PAYMENT_FAILED_WEBHOOK',
        metadata: { event, payment_id: data.id, error: errorMsg }
      }).catch(e => console.warn('[Razorpay Webhook] Log fail:', e));
    }
  } else if (event === 'settlement.processed') {
    console.log('[Razorpay Webhook] Settlement processed:', payload.settlement.entity.id);
  }

  res.json({ success: true });
});

export default router;
