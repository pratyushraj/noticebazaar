// @ts-nocheck
// Public shipping routes: brand updates shipping via token link (no auth)

import { Router, Request, Response } from 'express';
import { supabase } from '../index.js';
import { getShippingTokenInfo, useShippingToken } from '../services/shippingTokenService.js';
import { sendBrandShippingUpdateEmail, sendCreatorProductShippedEmail } from '../services/shippingEmailService.js';

const router = Router();

/**
 * GET /api/shipping/:token
 * Public: validate token and return deal summary for shipping form.
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }

    const info = await getShippingTokenInfo(token.trim());
    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'This link is invalid or has expired. Please contact the creator for a new link.',
      });
    }

    return res.json({
      success: true,
      dealId: info.dealId,
      creatorName: info.creatorName,
      creatorCity: info.creatorCity,
      productDescription: info.productDescription,
      brandName: info.brandName,
    });
  } catch (error: any) {
    console.error('[Shipping] GET error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred. Please try again later.',
    });
  }
});

/**
 * POST /api/shipping/:token
 * Public: submit shipping details (courier, tracking, etc.) and mark as shipped.
 */
router.post('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { courier_name, tracking_number, tracking_url, expected_delivery_date } = req.body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }

    if (!courier_name || typeof courier_name !== 'string' || !courier_name.trim()) {
      return res.status(400).json({ success: false, error: 'Courier name is required' });
    }
    if (!tracking_number || typeof tracking_number !== 'string' || !tracking_number.trim()) {
      return res.status(400).json({ success: false, error: 'Tracking number is required' });
    }

    const info = await getShippingTokenInfo(token.trim());
    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'This link is invalid or has expired. Please contact the creator for a new link.',
      });
    }

    const dealId = await useShippingToken(token.trim());
    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'This link has already been used. Contact the creator if you need to update shipping.',
      });
    }

    const now = new Date().toISOString();
    const expectedDate = expected_delivery_date
      ? (typeof expected_delivery_date === 'string'
          ? expected_delivery_date.trim()
          : null)
      : null;

    const { error: updateError } = await (supabase as any)
      .from('brand_deals')
      .update({
        shipping_status: 'shipped',
        courier_name: courier_name.trim(),
        tracking_number: tracking_number.trim(),
        tracking_url: tracking_url && typeof tracking_url === 'string' ? tracking_url.trim() || null : null,
        expected_delivery_date: expectedDate || null,
        shipped_at: now,
        updated_at: now,
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('[Shipping] Update brand_deals error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save shipping details. Please try again.',
      });
    }

    await (supabase as any)
      .from('deal_action_logs')
      .insert({
        deal_id: dealId,
        event: 'shipping_marked_shipped',
        metadata: { courier_name: courier_name.trim(), tracking_number: tracking_number.trim() },
      })
      .then(() => {})
      .catch((e: any) => console.warn('[Shipping] Audit log insert failed:', e));

    // Notify creator (async, non-blocking)
    try {
      const { data: deal } = await (supabase as any)
        .from('brand_deals')
        .select('creator_id, brand_name, courier_name, tracking_number, tracking_url')
        .eq('id', dealId)
        .single();

      if (deal?.creator_id) {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('id', deal.creator_id)
          .maybeSingle();

        const creatorEmail = profile?.email;
        const creatorName = profile
          ? `${(profile.first_name || '').trim()} ${(profile.last_name || '').trim()}`.trim() || 'Creator'
          : 'Creator';

        if (creatorEmail) {
          sendCreatorProductShippedEmail(creatorEmail, {
            creatorName,
            brandName: deal.brand_name || 'Brand',
            courierName: courier_name.trim(),
            trackingNumber: tracking_number.trim(),
            trackingUrl: tracking_url && typeof tracking_url === 'string' ? tracking_url.trim() || undefined : undefined,
          }).catch((e) => console.error('[Shipping] Creator email failed:', e));
        }
      }
    } catch (emailErr) {
      console.error('[Shipping] Creator notification error:', emailErr);
    }

    return res.json({
      success: true,
      message: 'Shipping details saved. The creator has been notified.',
    });
  } catch (error: any) {
    console.error('[Shipping] POST error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred. Please try again later.',
    });
  }
});

export default router;
