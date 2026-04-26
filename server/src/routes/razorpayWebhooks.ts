import { Router, Request, Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import { supabase } from '../lib/supabase.js';
import { sendEscrowFundedEmailToCreator } from '../services/escrowEmailService.js';
import { generateEscrowReceipt } from '../services/invoiceService.js';

const router = Router();

// Use express.raw so we get the raw buffer to correctly verify Razorpay's signature
router.use(express.raw({ type: '*/*' }));

// Handle Razorpay webhooks
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'fallback_secret';
    
    // Verify signature
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return res.status(400).send('No signature found');
    }
    
    // req.body is now a Buffer because of express.raw
    const payloadBuffer = req.body;
    const payloadString = payloadBuffer.toString('utf8');
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
    
    if (expectedSignature !== signature) {
      console.warn('[Razorpay] Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    // Now safely parse the payload
    const body = JSON.parse(payloadString);
    const event = body.event;
    
    if (event === 'payment.captured') {
      const payment = body.payload.payment.entity;
      const notes = payment.notes || {};
      const dealId = notes.deal_id;
      
      if (!dealId) {
        return res.status(200).send('No deal_id in notes');
      }

      // Check current deal state for idempotency (Double Webhook Issue)
      const { data: deal } = await supabase
        .from('brand_deals')
        .select('payment_status, status, creator_id, brand_name, creator_email')
        .eq('id', dealId)
        .single();
        
      if (deal && deal.payment_status === 'captured') {
        console.log(`[Razorpay] Webhook already processed for deal ${dealId}`);
        return res.status(200).send('Already processed');
      }

      // Update deal status to CONTENT_MAKING (Race condition fix: only if PAYMENT_PENDING)
      const now = new Date().toISOString();
      const updateData = {
        status: 'CONTENT_MAKING',
        payment_id: payment.id,
        payment_status: 'captured',
        amount_paid: payment.amount / 100, // stored in INR
        updated_at: now
      };
      
      const { error } = await supabase
        .from('brand_deals')
        .update(updateData)
        .eq('id', dealId)
        .eq('status', 'PAYMENT_PENDING'); // Safety check
        
      if (error) {
        console.error('[Razorpay] Failed to update deal:', error);
      }
      
      // Log action
      await supabase.from('deal_action_logs').insert({
        deal_id: dealId,
        event: 'PAYMENT_CAPTURED',
        metadata: { payment_id: payment.id, amount: payment.amount }
      });

      // Send Email to Creator
      if (deal) {
        // Fetch creator details
        const { data: creator } = await supabase.from('creators').select('email, first_name, username').eq('id', deal.creator_id).single();
        await sendEscrowFundedEmailToCreator(deal, creator);
      }

      // Generate Escrow Receipt for Brand
      try {
        await generateEscrowReceipt(dealId);
      } catch (receiptErr) {
        console.error('[Razorpay] Failed to generate receipt:', receiptErr);
      }
      
    } else if (event === 'payment.failed') {
      const payment = body.payload.payment.entity;
      const notes = payment.notes || {};
      const dealId = notes.deal_id;
      
      if (dealId) {
        // Missing Failed Payment State Fix
        await supabase
          .from('brand_deals')
          .update({
            status: 'PAYMENT_FAILED',
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', dealId);

        await supabase.from('deal_action_logs').insert({
          deal_id: dealId,
          event: 'PAYMENT_FAILED',
          metadata: { payment_id: payment.id, error: payment.error_description }
        });
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('[Razorpay] Webhook error:', error);
    res.status(500).send('Webhook Error');
  }
});

export default router;
