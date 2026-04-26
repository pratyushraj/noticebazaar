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
      const selectFields = 'id, payment_status, status, creator_id, brand_name, creator_email, payment_id, amount_paid';
      const { data: deal, error: fetchError } = await supabase
        .from('brand_deals')
        .select(selectFields)
        .eq('id', dealId)
        .single();
        
      if (fetchError) {
        console.warn('[Razorpay] Webhook select notice (might be missing columns):', fetchError.message);
        // Fallback: try minimal select if extended fails
        const { data: minimal } = await supabase.from('brand_deals').select('id, status').eq('id', dealId).single();
        if (!minimal) {
          console.error('[Razorpay] Webhook failed: deal not found', dealId);
          return res.status(200).send('Deal not found');
        }
      }

      console.log(`[Razorpay] Processing webhook for deal ${dealId}. Current status: ${deal?.status}`);

      if (deal && (deal.payment_status === 'captured' || (deal.status || '').toLowerCase() === 'content_making')) {
        console.log(`[Razorpay] Webhook already processed for deal ${dealId}`);
        return res.status(200).send('Already processed');
      }

      // Update deal status to content_making (Race condition fix: only if PAYMENT_PENDING)
      const now = new Date().toISOString();
      const updateData: any = {
        status: 'content_making',
        updated_at: now
      };
      
      // Only include escrow columns if they exist in the schema
      // (Hardening: prevent webhook crash if migrations haven't run)
      if ('payment_id' in (deal || {})) updateData.payment_id = payment.id;
      if ('payment_status' in (deal || {})) updateData.payment_status = 'captured';
      if ('amount_paid' in (deal || {})) updateData.amount_paid = payment.amount / 100;
      
      console.log(`[Razorpay] Updating deal ${dealId} with:`, updateData);
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update(updateData)
        .eq('id', dealId)
        .or('status.eq.PAYMENT_PENDING,status.eq.payment_pending,status.eq.signed,status.eq.SIGNED'); 
        
      if (updateError) {
        console.error('[Razorpay] Failed to update deal status:', updateError);
      } else {
        console.log(`[Razorpay] Successfully updated deal ${dealId} to content_making`);
      }
      
      // Log action
      await supabase.from('deal_action_logs').insert({
        deal_id: dealId,
        event: 'PAYMENT_CAPTURED',
        metadata: { payment_id: payment.id, amount: payment.amount, via: 'webhook' }
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
        const updateData: any = {
          status: 'PAYMENT_FAILED',
          updated_at: new Date().toISOString()
        };
        if ('payment_status' in (deal || {})) updateData.payment_status = 'failed';

        await supabase
          .from('brand_deals')
          .update(updateData)
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
