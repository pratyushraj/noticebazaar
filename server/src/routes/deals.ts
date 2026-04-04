// @ts-nocheck
// Deals API Routes
// Handles deal-related operations like logging reminders and delivery details (barter)

import { Router, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import multer from 'multer';
import { generateContractFromScratch } from '../services/contractGenerator.js';
import { createContractReadyToken } from '../services/contractReadyTokenService.js';
import { sendCollabRequestAcceptedEmail } from '../services/collabRequestEmailService.js';
import { createShippingToken } from '../services/shippingTokenService.js';
import { sendBrandShippingUpdateEmail, sendBrandShippingIssueEmail } from '../services/shippingEmailService.js';
import { authMiddleware } from '../middleware/auth.js';
import { signContractAsCreator, getClientIp, getDeviceInfo } from '../services/contractSigningService.js';
import { recordMarketplaceEvent } from '../shared/lib/marketplaceAnalytics.js';
import { getCreatorNotificationContent } from '../domains/deals/creatorNotificationCopy.js';
import { sendGenericPushNotificationToCreator } from '../services/pushNotificationService.js';

const router = Router();

/** Mask phone for contract PDF: 98XXXXXX21 (first 2 + last 2 visible) */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return 'XXXXXXXXXX';
  return digits.slice(0, 2) + 'XXXXXX' + digits.slice(-2);
}

const isMissingColumnError = (err: any) => {
  const msg = String(err?.message || err?.details || err?.hint || '').toLowerCase();
  return (
    msg.includes('could not find the') ||
    msg.includes('does not exist') ||
    msg.includes('column') ||
    msg.includes('schema cache')
  );
};

const normalizeStatus = (raw: any) => String(raw || '').trim().toUpperCase().replaceAll(' ', '_');
const normalizeCollabKind = (raw: any) => String(raw || '').trim().toLowerCase();
const inferRequiresPayment = (deal: any) => {
  const kind = normalizeCollabKind(deal?.collab_type || deal?.deal_type);
  if (kind === 'barter') return false;
  if (kind === 'paid' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter') return true;
  return Number(deal?.deal_amount || 0) > 0;
};
const inferRequiresShipping = (deal: any) => {
  if (typeof deal?.shipping_required === 'boolean') return deal.shipping_required;
  const kind = normalizeCollabKind(deal?.collab_type || deal?.deal_type);
  if (kind === 'barter' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter') return true;
  return false;
};

const notifyCreatorForDealEvent = async (
  template: Parameters<typeof getCreatorNotificationContent>[0],
  deal: any,
  metadata: Record<string, any> = {}
) => {
  const creatorId = String(deal?.creator_id || '').trim();
  if (!creatorId) return;

  try {
    const notification = getCreatorNotificationContent(template, {
      id: String(deal?.id || ''),
      creator_id: creatorId,
      brand_name: String(deal?.brand_name || '').trim() || 'Brand',
      brand_email: String(deal?.brand_email || '').trim() || '',
      deal_type: deal?.deal_type || deal?.collab_type || 'paid',
      collab_type: deal?.collab_type || deal?.deal_type || 'paid',
      deal_amount: Number(deal?.deal_amount || 0),
      status: String(deal?.status || ''),
      current_state: String(deal?.status || ''),
    } as any);

    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: creatorId,
      type: notification.type,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      data: {
        template,
        deal_id: deal.id,
        brand_name: deal?.brand_name || null,
        ...metadata,
      },
      link: notification.link,
      priority: notification.priority,
      icon: notification.type,
      action_label: notification.actionLabel,
      action_link: notification.actionLink,
      read: false,
    });

    if (notificationError) {
      console.warn(`[Deals] Failed to create ${template} notification:`, notificationError.message);
    }

    const pushResult = await sendGenericPushNotificationToCreator({
      creatorId,
      title: notification.title,
      body: notification.message,
      url: notification.actionLink,
      data: {
        template,
        dealId: deal.id,
        ...metadata,
      },
    });

    if (!pushResult.sent) {
      console.log(`[Deals] No push subscriptions delivered for ${template} on deal ${deal.id}`);
    }
  } catch (error: any) {
    console.warn(`[Deals] Failed to notify creator for ${template}:`, error?.message || error);
  }
};

// Multer configuration for signed contract uploads (in-memory, PDF only, max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// POST /api/deals/log-share
// Log a brand message share
router.post('/log-share', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId, message, metadata } = req.body;

    // Validate required fields
    if (!dealId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: dealId, message'
      });
    }

    // Verify deal exists and user has access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, status, brand_response_status')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    // Verify user has access
    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Log to deal_action_logs
    const { data: logEntry, error: logError } = await supabase
      .from('deal_action_logs')
      .insert({
        deal_id: dealId,
        user_id: userId,
        event: 'BRAND_MESSAGE_SHARED',
        metadata: {
          channel: metadata?.channel || 'share',
          method: metadata?.method || 'unknown',
          message: message,
          timestamp: metadata?.timestamp || new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('[Deals] Failed to log share:', logError);
      // Don't fail the request if logging fails
    }

    // Update brand_response_status to 'pending' and deal status to 'Sent' ONLY if not already accepted_verified
    // Once accepted_verified, status should never be reset
    let updateErrorObj: any = null;

    if (deal.brand_response_status === 'accepted_verified') {
      // Don't reset status if already accepted_verified, just update timestamp
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', dealId);

      if (updateError) updateErrorObj = updateError;
    } else {
      // Safe to update status for non-final states
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({
          brand_response_status: 'pending',
          status: 'Sent',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', dealId);

      if (updateError) updateErrorObj = updateError;
    }

    if (updateErrorObj) {
      console.error('[Deals] Failed to update deal status:', updateErrorObj);
    }

    return res.json({
      success: true,
      message: 'Share logged successfully',
      data: logEntry
    });

  } catch (error: any) {
    console.error('[Deals] Log share error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/deals/log-reminder
// Log a brand reminder to the activity log
router.post('/log-reminder', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId, reminder_type, message } = req.body;

    // Validate required fields
    if (!dealId || !reminder_type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Log the reminder
    const { data: logEntry, error: logError } = await supabase
      .from('deal_action_logs')
      .insert({
        deal_id: dealId,
        user_id: userId,
        event: 'BRAND_REMINDER_SENT',
        metadata: {
          type: reminder_type,
          message: message,
          timestamp: new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('[Deals] Failed to log reminder:', logError);
      return res.status(500).json({ success: false, error: 'Failed to log reminder' });
    }

    // Update deal's last_reminded_at
    await supabase
      .from('brand_deals')
      .update({
        last_reminded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    return res.json({
      success: true,
      data: logEntry
    });
  } catch (error: any) {
    console.error('[Deals] Log reminder error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/deals/:id/upload-signed-contract
// Upload a signed contract PDF
router.post('/:id/upload-signed-contract', authMiddleware, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Verify deal access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `signed_${timestamp}_${dealId}.pdf`;
    const filePath = `signed-contracts/${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('[Deals] Storage upload error:', uploadError);
      return res.status(500).json({ success: false, error: 'Failed to upload to storage' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('creator-assets')
      .getPublicUrl(filePath);

    // Update deal record
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'Signed',
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', dealId);

    if (updateError) {
      console.error('[Deals] Database update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update deal record' });
    }

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'SIGNED_CONTRACT_UPLOADED',
      metadata: { file_name: fileName }
    });

    return res.json({
      success: true,
      signed_contract_url: urlData.publicUrl
    });
  } catch (error: any) {
    console.error('[Deals] Signed contract upload error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/deals/barter/delivery-details
 * For BARTER deals: creator saves brand's shipping info + generates contract.
 */
router.post('/barter/delivery-details', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      dealId,
      brandContactName,
      brandAddress,
      brandPhone,
      shippingRequired,
      barterProductValue
    } = req.body;

    if (!dealId || !brandContactName || !brandAddress) {
      return res.status(400).json({ success: false, error: 'Missing required brand details' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*, creator:profiles!creator_id(*)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const creator = (deal as any).creator;
    const creatorName = creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() : 'Creator';
    const creatorAddress = (creator as any).location || (creator as any).address || '';

    // Try to get email from profile, then from req.user, then from auth
    let creatorEmail = creator?.email || req.user?.email || '';
    if (!creatorEmail) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        creatorEmail = authUser?.user?.email || '';
      } catch (e) {
        console.error('[Deals] Failed to fetch creator email from auth:', e);
      }
    }

    // Generate contract
    const contractResult = await generateContractFromScratch({
      brandName: deal.brand_name,
      creatorName,
      creatorEmail,
      dealAmount: 0,
      deliverables: Array.isArray(deal.deliverables) ? deal.deliverables : [String(deal.deliverables)],
      dueDate: deal.due_date,
      paymentExpectedDate: '',
      platform: deal.platform || 'Instagram',
      brandEmail: deal.brand_email || undefined,
      brandAddress,
      brandGstin: undefined,
      creatorAddress,
      dealSchema: {
        deal_amount: 0,
        deliverables: Array.isArray(deal.deliverables) ? deal.deliverables : [String(deal.deliverables)],
        delivery_deadline: deal.due_date,
        payment: { method: 'Barter', timeline: 'Product delivery' },
        usage: { type: 'Non-exclusive', platforms: ['All'], duration: '6 months', paid_ads: false, whitelisting: false },
        exclusivity: { enabled: false, category: null, duration: null },
        termination: { notice_days: 7 },
        jurisdiction_city: 'Mumbai',
      },
      usageType: 'Non-exclusive' as any,
      usagePlatforms: ['All'],
      usageDuration: '6 months',
      paidAdsAllowed: false,
      whitelistingAllowed: false,
      exclusivityEnabled: false,
      exclusivityCategory: null,
      exclusivityDuration: null,
      terminationNoticeDays: 7,
      jurisdictionCity: 'Mumbai',
    });

    // Upload contract
    const fileName = `barter_contract_${Date.now()}_${dealId}.docx`;
    const filePath = `contracts/${userId}/${fileName}`;
    await supabase.storage.from('creator-assets').upload(filePath, contractResult.contractDocx, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const { data: urlData } = supabase.storage.from('creator-assets').getPublicUrl(filePath);

    // Update deal
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        brand_address: brandAddress,
        brand_phone: brandPhone,
        shipping_required: !!shippingRequired,
        barter_value: barterProductValue || 0,
        contract_file_url: urlData.publicUrl,
        contract_file_path: filePath, // Use new secure path column
        status: 'contract_ready',
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Create contract token
    const token = await createContractReadyToken({ dealId, creatorId: userId, expiresAt: null });

    // Send email to brand (if they have email)
    if (deal.brand_email) {
      sendCollabRequestAcceptedEmail(deal.brand_email, {
        creatorName,
        brandName: deal.brand_name,
        dealType: 'barter',
        deliverables: Array.isArray(deal.deliverables) ? deal.deliverables : [String(deal.deliverables)],
        contractReadyToken: token.id,
        barterValue: barterProductValue,
      }).catch(e => console.error('[Deals] barter mail failed:', e));
    }

    return res.json({ success: true, contract_url: urlData.publicUrl });
  } catch (error: any) {
    console.error('[Deals] barter delivery-details error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:dealId/delivery-details
 * Save delivery details for a barter deal (post-acceptance). Generates contract and sets status to Awaiting Product Shipment.
 */
router.patch('/:dealId/delivery-details', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId } = req.params;
    const { delivery_name, delivery_phone, delivery_address, delivery_notes } = req.body;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, deal_type, brand_name, brand_email, brand_address, brand_phone, deliverables, due_date, payment_expected_date')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.creator_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if ((deal as any).deal_type !== 'barter') {
      return res.status(400).json({ success: false, error: 'Delivery details are only for barter deals' });
    }
    // Barter: delivery_address (and name/phone) required before contract generation — validated below

    if (!delivery_name || typeof delivery_name !== 'string' || !delivery_name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }
    const phoneDigits = (delivery_phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ success: false, error: 'Phone number must be at least 10 digits' });
    }
    if (!delivery_address || typeof delivery_address !== 'string' || !delivery_address.trim()) {
      return res.status(400).json({ success: false, error: 'Delivery address is required' });
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        delivery_name: delivery_name.trim(),
        delivery_phone: delivery_phone.trim(),
        delivery_address: delivery_address.trim(),
        delivery_notes: delivery_notes ? String(delivery_notes).trim() : null,
        status: 'Awaiting Product Shipment',
        shipping_required: true,
        shipping_status: 'pending',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    if (updateError) {
      console.error('[Deals] delivery-details update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to save delivery details' });
    }

    let contractUrl: string | null = null;
    let contractReadyToken: string | null = null;

    try {
      const { data: existingDeal } = await supabase
        .from('brand_deals')
        .select('contract_file_url')
        .eq('id', dealId)
        .single();

      if (existingDeal?.contract_file_url) {
        contractUrl = existingDeal.contract_file_url;
      } else {
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', userId)
          .maybeSingle();

        const creatorName = creatorProfile
          ? `${((creatorProfile as any).first_name || '').trim()} ${((creatorProfile as any).last_name || '').trim()}`.trim() || delivery_name.trim()
          : delivery_name.trim();

        // Try to get email from profile, then from req.user, then from auth as last resort
        let creatorEmail = (creatorProfile as any)?.email || req.user?.email;

        if (!creatorEmail) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId);
            creatorEmail = authUser?.user?.email;
          } catch (e) {
            console.error('[Deals] Failed to fetch creator email from auth:', e);
          }
        }

        creatorEmail = creatorEmail || undefined;

        let deliverablesArray: string[] = [];
        try {
          const d = deal.deliverables;
          deliverablesArray = typeof d === 'string' ? (d.includes('[') ? JSON.parse(d) : d.split(',').map((s: string) => s.trim())) : d || [];
        } catch {
          deliverablesArray = [String(deal.deliverables)];
        }
        const dueDate = deal.due_date || deal.payment_expected_date;
        const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString() : undefined;

        const maskedPhone = maskPhone(delivery_phone);
        // Barter-specific contract clauses (creator-first, plain English)
        const BARTER_DISPATCH_DAYS = 7;
        const productDeliveryTerms = [
          `1. Product Delivery: The brand must dispatch the barter product to the creator within ${BARTER_DISPATCH_DAYS} days of contract signing. A tracking ID must be shared with the creator when applicable.`,
          `2. Product Condition: The product must match the description and agreed value. The creator may reject damaged or incorrect items.`,
          `3. Delivery Confirmation: The creator confirms receipt inside the Creator Armour dashboard. The content timeline starts only after this confirmation.`,
          `4. Non-Delivery: If the product is not delivered within the agreed timeline, the creator may cancel the collaboration and the brand loses collaboration rights under this agreement.`,
          `5. No Product, No Content: The creator is not obligated to deliver content until the product has been received and confirmed.`,
          `Delivery address: ${delivery_address.trim()}. Contact (masked): ${maskedPhone}.`,
        ].join('\n\n');

        const dealSchema = {
          deal_amount: 0,
          deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
          delivery_deadline: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment: { method: 'Barter', timeline: 'Product shipment within 7 days' },
          usage: { type: 'Non-exclusive', platforms: ['All platforms'], duration: '6 months', paid_ads: false, whitelisting: false },
          exclusivity: { enabled: false, category: null, duration: null },
          termination: { notice_days: 7 },
          jurisdiction_city: 'Mumbai',
        };

        // Check if we have enough information for contract generation
        const canGenerateContract =
          deal.brand_name &&
          deal.brand_email &&
          (deal as any).brand_address &&
          creatorName &&
          creatorEmail &&
          delivery_address.trim();

        if (canGenerateContract) {
          const contractResult = await generateContractFromScratch({
            brandName: deal.brand_name,
            creatorName,
            creatorEmail,
            dealAmount: 0,
            deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
            paymentTerms: 'Barter – product shipment within 7 days of acceptance.',
            dueDate: dueDateStr,
            paymentExpectedDate: dueDateStr,
            platform: 'Multiple Platforms',
            brandEmail: deal.brand_email || undefined,
            brandAddress: (deal as any).brand_address || undefined,
            brandPhone: (deal as any).brand_phone || undefined,
            creatorAddress: delivery_address.trim(),
            dealSchema: dealSchema as any,
            usageType: 'Non-exclusive',
            usagePlatforms: ['All platforms'],
            usageDuration: '6 months',
            paidAdsAllowed: false,
            whitelistingAllowed: false,
            exclusivityEnabled: false,
            exclusivityCategory: null,
            exclusivityDuration: null,
            terminationNoticeDays: 7,
            jurisdictionCity: 'Mumbai',
            additionalTerms: productDeliveryTerms,
          });

          const storagePath = `contracts/${dealId}/${Date.now()}_${contractResult.fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('creator-assets')
            .upload(storagePath, contractResult.contractDocx, {
              contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              upsert: false,
            });

          if (uploadError) {
            console.error('[Deals] delivery-details contract upload error:', uploadError);
            // Don't fail the whole request if only contract failed
          } else {
            const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(storagePath);
            contractUrl = publicUrlData?.publicUrl || null;

            await supabase
              .from('brand_deals')
              .update({
                contract_file_url: contractUrl,
                contract_file_path: storagePath, // Use new secure path column
                updated_at: new Date().toISOString(),
              } as any)
              .eq('id', dealId);

            const token = await createContractReadyToken({
              dealId,
              creatorId: userId,
              expiresAt: null,
            });
            contractReadyToken = token.id;

            if (deal.brand_email && contractReadyToken && contractUrl) {
              sendCollabRequestAcceptedEmail(deal.brand_email, {
                creatorName,
                brandName: deal.brand_name,
                dealAmount: 0,
                dealType: 'barter',
                deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
                contractReadyToken,
                contractUrl,
              }).catch((e) => console.error('[Deals] delivery-details acceptance email failed:', e));
            }
          }
        } else {
          console.log('[Deals] Skipping contract generation due to missing info:', {
            hasBrandName: !!deal.brand_name,
            hasBrandEmail: !!deal.brand_email,
            hasBrandAddress: !!(deal as any).brand_address,
            hasCreatorName: !!creatorName,
            hasCreatorEmail: !!creatorEmail,
            hasCreatorAddress: !!delivery_address.trim()
          });
        }

        // Barter shipping: create token and send brand "Update Shipping Details" email (link valid 14 days)
        try {
          const { token: shippingToken } = await createShippingToken({ dealId });
          const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
          const shippingLink = `${frontendUrl}/ship/${shippingToken}`;
          const productDescription = deliverablesArray.length > 0 ? deliverablesArray.join(', ') : 'Product';
          if (deal.brand_email) {
            sendBrandShippingUpdateEmail(deal.brand_email, {
              brandName: deal.brand_name,
              creatorName,
              productDescription,
              shippingLink,
            }).catch((e) => console.error('[Deals] delivery-details shipping email failed:', e));
          }
        } catch (shippingTokenErr: any) {
          console.error('[Deals] delivery-details shipping token/email error:', shippingTokenErr);
        }
      }
    } catch (contractErr: any) {
      console.error('[Deals] delivery-details contract generation error:', contractErr);
      // More helpful error for common contract generation failures
      const errorMsg = contractErr.missingFields
        ? `Missing required details for contract: ${contractErr.missingFields.join(', ')}`
        : 'Delivery details saved but contract generation failed. Brand info might be incomplete.';
      return res.status(500).json({ success: false, error: errorMsg });
    }

    return res.json({
      success: true,
      deal: { id: dealId },
      contract: contractUrl ? { url: contractUrl, token: contractReadyToken } : null,
      message: 'Delivery details saved. Contract generated.',
    });
  } catch (error: any) {
    console.error('[Deals] delivery-details error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:dealId/shipping/update
 * Brand/System updates shipping status (shipped, delivered, etc.).
 */
router.patch('/:dealId/shipping/update', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();
    const { status, tracking_number, courier_name, tracking_url, expected_delivery_date } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, brand_id, brand_email, shipping_required, collab_type, deal_type')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!inferRequiresShipping(deal)) {
      return res.status(409).json({ success: false, error: 'Shipping is not required for this deal.' });
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: status,
        tracking_number,
        courier_name,
        tracking_url: tracking_url || null,
        expected_delivery_date: expected_delivery_date || null,
        shipped_at: status === 'shipped' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'shipping_status_updated',
      metadata: { status, tracking_number, courier_name, tracking_url: tracking_url || null, expected_delivery_date: expected_delivery_date || null }
    });

    return res.json({ success: true, message: `Shipping status updated to ${status}` });
  } catch (error: any) {
    console.error('[Deals] shipping update error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/shipping/confirm-received
 * Creator confirms they received the product (for barter).
 */
const confirmReceivedHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id || req.params.dealId;
    const userId = req.user!.id;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, deal_type, shipping_required, shipping_status')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealData = deal as any;
    if (dealData.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (dealData.deal_type !== 'barter' || !dealData.shipping_required) {
      return res.status(400).json({ success: false, error: 'Shipping confirmation is only for barter deals with shipping' });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: 'delivered',
        delivered_at: now,
        updated_at: now
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'shipping_confirmed_delivered',
      metadata: {}
    });

    // Notify creator (async, non-blocking)
    try {
      const { data: brandDeal } = await supabase
        .from('brand_deals')
        .select('brand_name')
        .eq('id', dealId)
        .single();

      const result = await (supabase as any)
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();
      const profile = result.data;

      if (profile && profile.email) {
        const creatorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator';
        const { sendCreatorDeliveryConfirmedEmail } = await import('../services/shippingEmailService.js');
        sendCreatorDeliveryConfirmedEmail(
          profile.email,
          creatorName,
          (brandDeal as any)?.brand_name || 'Brand',
          dealId
        ).catch(e => console.error('[Deals] Delivery confirmation email failed:', e));
      }
    } catch (emailErr) {
      console.warn('[Deals] Failed to trigger delivery confirmation email:', emailErr);
    }

    return res.json({ success: true, message: 'Product receipt confirmed' });
  } catch (error: any) {
    console.error('[Deals] confirm-received error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

router.patch('/:id/shipping/confirm-received', confirmReceivedHandler);
router.patch('/:dealId/shipping/confirm-received', confirmReceivedHandler);
router.post('/:id/confirm-receipt', confirmReceivedHandler);

/**
 * POST /api/deals/:dealId/regenerate-contract
 * Manual trigger to regenerate contract for a deal if it failed or needs update.
 */
router.post('/:dealId/regenerate-contract', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = String(req.user?.email || '').toLowerCase();
    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const isCreatorOwner = deal.creator_id === userId;
    const isBrandOwner = deal.brand_id === userId || (userEmail && String(deal.brand_email || '').toLowerCase() == userEmail);
    const isAdmin = req.user!.role === 'admin';

    if (!isCreatorOwner && !isBrandOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Fetch creator profile
    let creatorProfile: any = null;
    const selectV2 = 'first_name, last_name, full_name, location, address, email';
    const selectV1 = 'first_name, last_name, location';

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(selectV2)
        .eq('id', deal.creator_id)
        .maybeSingle();

      if (error) throw error;
      creatorProfile = data;
    } catch (err: any) {
      if (isMissingColumnError(err)) {
        const { data: v1Data, error: v1Error } = await supabase
          .from('profiles')
          .select(selectV1)
          .eq('id', deal.creator_id)
          .maybeSingle();
        if (v1Error) throw v1Error;
        creatorProfile = v1Data;
      } else {
        throw err;
      }
    }

    const creatorName = creatorProfile
      ? `${(creatorProfile.first_name || '').trim()} ${(creatorProfile.last_name || '').trim()}`.trim() || (creatorProfile as any)?.full_name?.trim() || 'Creator'
      : 'Creator';

    // Fallback email fetching if not in profiles
    let creatorEmail = (creatorProfile as any)?.email;
    if (!creatorEmail) {
      // If we are the creator, we have the email in req.user
      if (isCreatorOwner) {
        creatorEmail = req.user?.email;
      } else {
        // Otherwise try auth.admin (requires service role, which server client matches)
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(deal.creator_id);
          creatorEmail = authUser?.user?.email;
        } catch (authErr) {
          console.warn('[Deals] Failed to fetch creator email from auth.admin:', authErr);
        }
      }
    }

    const creatorAddress = (creatorProfile as any)?.location || (creatorProfile as any)?.address || undefined;

    // Parse deliverables
    let deliverablesArray: string[] = [];
    try {
      if (typeof deal.deliverables === 'string') {
        if (deal.deliverables.startsWith('[') && deal.deliverables.endsWith(']')) {
          deliverablesArray = JSON.parse(deal.deliverables);
        } else {
          deliverablesArray = deal.deliverables.split(',').map((s: string) => s.trim());
        }
      } else {
        deliverablesArray = deal.deliverables || [];
      }
    } catch {
      deliverablesArray = [String(deal.deliverables)];
    }

    const dueDateStr = deal.due_date ? new Date(deal.due_date).toLocaleDateString() : undefined;
    const paymentExpectedDateStr = deal.payment_expected_date ? new Date(deal.payment_expected_date).toLocaleDateString() : undefined;

    // Generate contract
    const contractResult = await generateContractFromScratch({
      brandName: deal.brand_name,
      creatorName,
      creatorEmail,
      dealAmount: deal.deal_amount,
      deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
      dueDate: dueDateStr,
      paymentExpectedDate: paymentExpectedDateStr,
      platform: deal.platform || 'Multiple Platforms',
      brandEmail: deal.brand_email || undefined,
      brandAddress: (deal as any).brand_address || undefined,
      brandPhone: (deal as any).brand_phone || undefined,
      creatorAddress,
      dealSchema: {
        deal_amount: deal.deal_amount,
        deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
        delivery_deadline: deal.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment: { method: 'Bank Transfer', timeline: paymentExpectedDateStr ? `Payment by ${paymentExpectedDateStr}` : 'Within 7 days of content delivery' },
        usage: { type: 'Non-exclusive', platforms: ['All platforms'], duration: '6 months', paid_ads: false, whitelisting: false },
        exclusivity: { enabled: false, category: null, duration: null },
        termination: { notice_days: 7 },
        jurisdiction_city: 'Mumbai',
      },
      usageType: 'Non-exclusive' as "Non-exclusive" | "Exclusive",
      usagePlatforms: ['All platforms'],
      usageDuration: '6 months',
      paidAdsAllowed: false,
      whitelistingAllowed: false,
      exclusivityEnabled: false,
      exclusivityCategory: null,
      exclusivityDuration: null,
      terminationNoticeDays: 7,
      jurisdictionCity: 'Mumbai',
    });

    const timestamp = Date.now();
    const storagePath = `contracts/${dealId}/${timestamp}_${contractResult.fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(storagePath, contractResult.contractDocx, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(storagePath);
    const contractUrl = publicUrlData?.publicUrl;

    if (!contractUrl) {
      throw new Error('Failed to get public URL for contract');
    }

    // Update deal
    await supabase.from('brand_deals').update({
      contract_file_url: contractUrl,
      updated_at: new Date().toISOString(),
    } as any).eq('id', dealId);

    // Create token
    const token = await createContractReadyToken({
      dealId,
      creatorId: userId,
      expiresAt: null,
    });

    // Send email
    if (deal.brand_email && token.id) {
      sendCollabRequestAcceptedEmail(deal.brand_email, {
        creatorName,
        brandName: (deal as any).brand_name,
        dealAmount: deal.deal_amount,
        dealType: (deal.deal_type as "paid" | "barter") || 'paid',
        deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
        contractReadyToken: token.id,
        contractUrl: contractUrl,
      }).catch((e) => console.error('[Deals] Regenerate contract email failed:', e));
    }

    return res.json({
      success: true,
      contract: {
        url: contractUrl,
        token: token.id
      },
      message: 'Contract regenerated and sent to brand.'
    });

  } catch (error: any) {
    console.error('[Deals] Regenerate contract error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

router.get('/:dealId/contract-review-link', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = String(req.user?.email || '').toLowerCase();
    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, brand_id, brand_email')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const isCreatorOwner = deal.creator_id === userId;
    const isBrandOwner = deal.brand_id === userId || (userEmail && String(deal.brand_email || '').toLowerCase() === userEmail);
    const isAdmin = req.user!.role === 'admin';

    if (!isCreatorOwner && !isBrandOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    let tokenId: string | null = null;
    const { data: existingToken } = await (supabase as any)
      .from('contract_ready_tokens')
      .select('id')
      .eq('deal_id', dealId)
      .eq('is_active', true)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

	    if (existingToken?.id) {
	      tokenId = existingToken.id;
	    } else {
	      const token = await createContractReadyToken({
	        dealId,
	        creatorId: deal.creator_id,
	        expiresAt: null,
	      });
	      tokenId = token.id;
	    }

	    const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
	    // Prefer the frontend origin (where the user is browsing) so we can send them to the
	    // ContractReadyPage for signing instead of a protected-file view that often downloads.
	    const frontendOriginRaw = req.get('origin') || process.env.FRONTEND_URL || '';
	    const frontendOrigin = String(frontendOriginRaw || '').replace(/\/$/, '');
	    return res.json({
	      success: true,
	      token: tokenId,
	      // Read-only contract view (can download depending on browser / content-disposition).
	      viewUrl: `${apiBaseUrl}/api/protection/contracts/${dealId}/view?token=${tokenId}`,
	      // Signing UX (brand flow) hosted on the frontend.
	      signUrl: frontendOrigin ? `${frontendOrigin}/contract-ready/${tokenId}` : undefined,
	    });
	  } catch (error: any) {
	    console.error('[Deals] contract-review-link error:', error);
	    return res.status(500).json({ success: false, error: error?.message || 'Failed to create contract review link' });
	  }
	});

/**
 * PATCH /api/deals/:dealId/shipping/report-issue
 * Creator reports shipping issue (shipping_status = issue_reported, notify brand).
 */
router.patch('/:dealId/shipping/report-issue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId } = req.params;
    const { reason } = req.body;
    const reasonStr = String(reason || 'No reason specified');

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, brand_name, brand_email')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: 'issue_reported',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    if (updateError) {
      return res.status(500).json({ success: false, error: 'Failed to update' });
    }

    try {
      await supabase.from('deal_action_logs').insert({
        deal_id: dealId,
        event: 'shipping_issue_reported',
        metadata: { reason: reasonStr },
      });
    } catch (e: any) {
      console.warn('[Deals] shipping audit log failed:', e);
    }

    if (deal.brand_email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
      const creatorName = profile
        ? `${(profile.first_name || '').trim()} ${(profile.last_name || '').trim()}`.trim() || 'Creator'
        : 'Creator';
      sendBrandShippingIssueEmail(deal.brand_email, {
        brandName: (deal as any).brand_name || 'Brand',
        creatorName,
        reason: reasonStr,
      }).catch((e) => console.error('[Deals] shipping issue email failed:', e));
    }

    return res.json({
      success: true,
      message: 'Issue reported. The brand has been notified.',
    });
  } catch (error: any) {
    console.error('[Deals] shipping report-issue error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});


/**
 * POST /api/deals/:id/sign-creator
 * Legally sign the contract as a creator after OTP verification
 */
router.post('/:id/sign-creator', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user!.id;
    const { signerName, signerEmail, contractSnapshotHtml } = req.body;

    if (!signerName || !signerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: signerName and signerEmail'
      });
    }

    // 1. Fetch deal to verify OTP status
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('creator_otp_verified, creator_otp_verified_at, creator_id')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealData = deal as any;

    // 2. Security Check: Only the creator (or admin) can sign
    if (dealData.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // 3. Verify OTP was actually verified
    if (!(deal as any).creator_otp_verified) {
      return res.status(400).json({
        success: false,
        error: 'OTP verification is required before signing. Please verify your email first.'
      });
    }

    // 4. Sign the contract using the service
    const signResult = await signContractAsCreator({
      dealId,
      creatorId: userId,
      signerName,
      signerEmail,
      contractSnapshotHtml,
      ipAddress: getClientIp(req as any),
      userAgent: req.headers['user-agent'] || 'unknown',
      deviceInfo: getDeviceInfo(req.headers['user-agent'] || 'unknown'),
      otpVerified: true,
      otpVerifiedAt: (deal as any).creator_otp_verified_at
    });

    if (!signResult.success) {
      return res.status(500).json({
        success: false,
        error: signResult.error || 'Failed to sign contract'
      });
    }

    // Status update is now handled internally by signContractAsCreator
    // based on whether both parties have signed.

    return res.json({
      success: true,
      message: 'Contract signed successfully',
      signature: signResult.signature
    });

  } catch (error: any) {
    console.error('[Deals] Sign-creator error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * PATCH /api/deals/:id/submit-content
 * Creator submits content for brand review
 */
router.patch('/:id/submit-content', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const userId = req.user!.id;
    const {
      contentUrl,
      mainLink,
      additionalLinks,
      caption,
      notes,
      messageToBrand,
      contentStatus,
      driveLink, // legacy
    } = req.body ?? {};

    const primaryLink = String(mainLink || contentUrl || '').trim();
    if (!primaryLink) {
      return res.status(400).json({ success: false, error: 'Content link is required' });
    }

    const normalizedContentStatusRaw = String(contentStatus || '').trim().toLowerCase();
    const normalizedContentStatus =
      normalizedContentStatusRaw === 'draft' || normalizedContentStatusRaw === 'posted'
        ? normalizedContentStatusRaw
        : null;

    const resolveDealId = async (id: string): Promise<string | null> => {
      const cleaned = String(id || '').trim();
      if (!cleaned) return null;

      // 1) Already a brand_deals id?
      const { data: dealProbe } = await supabase
        .from('brand_deals')
        .select('id')
        .eq('id', cleaned)
        .maybeSingle();
      if (dealProbe?.id) return dealProbe.id;

      // 2) deal_details_tokens id -> deal_details_submissions -> deal_id
      const { data: tokenRow } = await (supabase as any)
        .from('deal_details_tokens')
        .select('id')
        .eq('id', cleaned)
        .maybeSingle();
      if (tokenRow?.id) {
        const { data: submission } = await (supabase as any)
          .from('deal_details_submissions')
          .select('deal_id')
          .eq('token_id', cleaned)
          .maybeSingle();
        if (submission?.deal_id) return String(submission.deal_id);
      }

      // 3) collab_requests id -> deal_id
      const { data: collabRow } = await (supabase as any)
        .from('collab_requests')
        .select('deal_id')
        .eq('id', cleaned)
        .maybeSingle();
      if (collabRow?.deal_id) return String(collabRow.deal_id);

      return null;
    };

    const dealId = await resolveDealId(rawId);
    if (!dealId) {
      console.warn('[Deals] submit-content: could not resolve deal id', { rawId });
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    // Verify access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      // Keep this select limited to columns that exist in older schemas too.
      .select('id, creator_id, status, brand_email, brand_name, progress_percentage, updated_at')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError) {
      console.error('[Deals] submit-content: error fetching deal', { rawId, dealId, error: dealError.message });
    }
    if (dealError || !deal) {
      console.warn('[Deals] submit-content: deal not found after resolve', { rawId, dealId });
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const current = normalizeStatus((deal as any).status);
    const canSubmit = current === 'CONTENT_MAKING' || current === 'REVISION_REQUESTED' || current === 'FULLY_EXECUTED';
    if (!canSubmit) {
      return res.status(409).json({ success: false, error: `Cannot submit content from status ${current || 'UNKNOWN'}.` });
    }

    const now = new Date().toISOString();
    const isRevision = current === 'REVISION_REQUESTED';

    const sanitizeLink = (value: unknown) => {
      const url = String(value || '').trim();
      if (!url) return null;
      if (!/^https?:\/\//i.test(url)) return null;
      if (url.length > 2000) return null;
      return url;
    };

    const cleanedAdditional = (Array.isArray(additionalLinks) ? additionalLinks : [])
      .map(sanitizeLink)
      .filter(Boolean) as string[];
    const legacyDriveLink = sanitizeLink(driveLink);
    const uniqueLinks = Array.from(new Set([sanitizeLink(primaryLink), ...cleanedAdditional, legacyDriveLink].filter(Boolean) as string[]));
    const finalNotes = String(messageToBrand ?? notes ?? '').trim() || null;
    // Some deployments don't have the newer content_* columns yet.
    // We still record the submission via `deal_action_logs` and move the deal status forward.
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'Content Delivered',
        progress_percentage: 95,
        updated_at: now,
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: isRevision ? 'REVISION_SUBMITTED' : 'CONTENT_SUBMITTED',
      metadata: {
        content_url: primaryLink,
        content_links: uniqueLinks,
        caption,
        notes: finalNotes,
        content_status: normalizedContentStatus,
        submitted_at: now,
      }
    });

    await recordMarketplaceEvent(supabase, {
      eventName: 'content_submitted',
      userId,
      creatorId: userId,
      dealId,
      metadata: {
        creator_id: userId,
        deal_id: dealId,
        content_status: normalizedContentStatus,
      },
    });

    return res.json({
      success: true,
      message: isRevision ? 'Revision submitted for review' : 'Content submitted for review',
      submitted_at: now
    });
  } catch (error: any) {
    console.error('[Deals] submit-content error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/review-content
 * Brand reviews submitted content (approve or request changes)
 * This route might be called via a brand-specific token or auth
 */
router.patch('/:id/review-content', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();
    const { status, feedback, disputeNotes } = req.body; // status: 'approved' | 'changes_requested' | 'disputed'

    if (!['approved', 'changes_requested', 'disputed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, status, brand_id, brand_email, brand_name, creator_id, collab_type, deal_type, deal_amount, progress_percentage')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const normalizeStatus = (raw: any) => String(raw || '').trim().toUpperCase().replaceAll(' ', '_');
    const current = normalizeStatus((deal as any).status);
    if (!(current === 'CONTENT_DELIVERED' || current === 'REVISION_DONE')) {
      return res.status(409).json({ success: false, error: `Cannot review content from status ${current || 'UNKNOWN'}.` });
    }

    const now = new Date().toISOString();
    const updateData: any = {
      brand_approval_status: status,
      brand_feedback: feedback,
      updated_at: now,
    };

    const minimalUpdate: any = {
      updated_at: now,
    };

    if (status === 'approved') {
      updateData.brand_approved_at = now;
      updateData.milestone_status = 'approved';
      updateData.status = 'CONTENT_APPROVED';
      updateData.content_approved_at = now;
      updateData.progress_percentage = 95;
      minimalUpdate.status = 'CONTENT_APPROVED';
      minimalUpdate.progress_percentage = 95;
    } else if (status === 'changes_requested') {
      updateData.milestone_status = 'feedback_given';
      // Use a status value that exists in older environments and matches client filters.
      updateData.status = 'Content Making';
      updateData.revision_requested_at = now;
      updateData.progress_percentage = 85;
      minimalUpdate.status = 'Content Making';
      minimalUpdate.progress_percentage = 85;
    } else {
      updateData.milestone_status = 'disputed';
      updateData.status = 'DISPUTED';
      updateData.disputed_at = now;
      updateData.dispute_notes = String(disputeNotes ?? feedback ?? '').trim() || null;
      minimalUpdate.status = 'DISPUTED';
    }

    const { error: updateError } = await supabase.from('brand_deals').update(updateData).eq('id', dealId);
    if (updateError) {
      // Older schemas may not have brand_approval_status / milestone columns. Fall back to a minimal update.
      const { error: fallbackError } = await supabase.from('brand_deals').update(minimalUpdate).eq('id', dealId);
      if (fallbackError) throw fallbackError;
    }

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: status === 'approved' ? 'CONTENT_APPROVED' : status === 'disputed' ? 'DEAL_DISPUTED' : 'REVISION_REQUESTED',
      metadata: { feedback: feedback ?? null, dispute_notes: updateData.dispute_notes ?? null }
    });

    if (status === 'approved') {
      await recordMarketplaceEvent(supabase, {
        eventName: 'content_approved',
        userId,
        dealId,
        metadata: {
          deal_id: dealId,
        },
      });
    }

    if (status === 'approved') {
      await notifyCreatorForDealEvent('content_approved', {
        ...deal,
        status: 'CONTENT_APPROVED',
      }, {
        approved_at: now,
        feedback: feedback ?? null,
      });
    } else if (status === 'changes_requested') {
      await notifyCreatorForDealEvent('revision_requested', {
        ...deal,
        status: 'REVISION_REQUESTED',
      }, {
        revision_requested_at: now,
        feedback: feedback ?? null,
      });
    }

    return res.json({
      success: true,
      message: status === 'approved' ? 'Content approved' : status === 'disputed' ? 'Issue raised' : 'Changes requested',
      status: status
    });
  } catch (error: any) {
    console.error('[Deals] review-content error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/release-payment
 * Brand releases payment after content approval.
 */
router.patch('/:id/release-payment', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, status, brand_id, brand_email, brand_name, creator_id, collab_type, deal_type, deal_amount, shipping_required')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const normalizeStatus = (raw: any) => String(raw || '').trim().toUpperCase().replaceAll(' ', '_');
    const current = normalizeStatus((deal as any).status);
    if (!inferRequiresPayment(deal)) {
      return res.status(409).json({ success: false, error: 'This deal does not require creator payment.' });
    }
    if (current !== 'CONTENT_APPROVED') {
      return res.status(409).json({ success: false, error: `Payment can be released only after approval. Current: ${current || 'UNKNOWN'}.` });
    }

    const paymentReference = String(req.body?.paymentReference || req.body?.utrNumber || '').trim();
    const paymentProofUrl = String(req.body?.paymentProofUrl || '').trim() || null;
    const paymentNotes = String(req.body?.paymentNotes || '').trim() || null;
    const paymentReceivedDateRaw = String(req.body?.paymentReceivedDate || '').trim();
    const paymentReceivedDate = paymentReceivedDateRaw
      ? new Date(paymentReceivedDateRaw).toISOString()
      : new Date().toISOString();

    if (!paymentReference) {
      return res.status(400).json({ success: false, error: 'Payment reference is required before release.' });
    }

    const now = new Date().toISOString();
    const fullUpdate: any = {
      status: 'PAYMENT_RELEASED',
      payment_released_at: now,
      payment_received_date: paymentReceivedDate,
      utr_number: paymentReference,
      updated_at: now,
    };
    const minimalUpdate: any = {
      status: 'PAYMENT_RELEASED',
      payment_released_at: now,
      updated_at: now,
    };

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(fullUpdate)
      .eq('id', dealId);

    if (updateError) {
      const { error: fallbackError } = await supabase
        .from('brand_deals')
        .update(minimalUpdate)
        .eq('id', dealId);
      if (fallbackError) throw fallbackError;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'PAYMENT_RELEASED',
      metadata: {
        released_at: now,
        payment_reference: paymentReference,
        payment_received_date: paymentReceivedDate,
        payment_proof_url: paymentProofUrl,
        payment_notes: paymentNotes,
      },
    }).then(({ error }) => {
      if (error) console.warn('[Deals] release-payment action log failed:', error.message);
    });

    await recordMarketplaceEvent(supabase, {
      eventName: 'payment_marked',
      userId,
      dealId,
      metadata: {
        deal_id: dealId,
        amount: (deal as any).deal_amount || 0,
      },
    });

    await notifyCreatorForDealEvent('payment_marked', {
      ...deal,
      status: 'PAYMENT_RELEASED',
    }, {
      payment_reference: paymentReference,
      payment_received_date: paymentReceivedDate,
      payment_proof_url: paymentProofUrl,
      payment_notes: paymentNotes,
    });

    return res.json({
      success: true,
      message: 'Payment released.',
      payment_reference: paymentReference,
      payment_received_date: paymentReceivedDate,
      payment_proof_url: paymentProofUrl,
      payment_notes: paymentNotes,
    });
  } catch (error: any) {
    console.error('[Deals] release-payment error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/mark-complete
 * Brand manually marks a collaboration as completed from the dashboard.
 */
router.patch('/:id/mark-complete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, status, brand_id, brand_email, collab_type, deal_type, deal_amount, shipping_required, shipping_status')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String(deal.brand_email || '').toLowerCase() || null;
    const hasAccess =
      String(deal.brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const normalizedCurrent = String(deal.status || '').trim().toUpperCase().replaceAll(' ', '_');
    if (normalizedCurrent === 'COMPLETED') {
      return res.json({ success: true, alreadyCompleted: true, message: 'Deal already marked complete.' });
    }

    const requiresPayment = inferRequiresPayment(deal);
    const requiresShipping = inferRequiresShipping(deal);
    const shippingDone = ['DELIVERED', 'RECEIVED'].includes(normalizeStatus((deal as any).shipping_status));
    const paymentDone = !requiresPayment || normalizedCurrent === 'PAYMENT_RELEASED';
    const contentDone = requiresPayment ? normalizedCurrent === 'PAYMENT_RELEASED' : normalizedCurrent === 'CONTENT_APPROVED';

    if (role !== 'admin') {
      if (!contentDone) {
        return res.status(409).json({ success: false, error: `Deal can be completed only after content approval and required obligations are done. Current: ${normalizedCurrent || 'UNKNOWN'}.` });
      }
      if (requiresShipping && !shippingDone) {
        return res.status(409).json({ success: false, error: 'Deal can be completed only after shipping is delivered.' });
      }
      if (!paymentDone) {
        return res.status(409).json({ success: false, error: `Deal can be completed only after payment release. Current: ${normalizedCurrent || 'UNKNOWN'}.` });
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'COMPLETED',
        updated_at: now,
      } as any)
      .eq('id', dealId);

    if (updateError) {
      throw updateError;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'DEAL_MARKED_COMPLETE_BY_BRAND',
      metadata: {
        completed_at: now,
        source: 'brand_dashboard',
      },
    }).then(({ error }) => {
      if (error) console.warn('[Deals] mark-complete action log failed:', error.message);
    });

    await recordMarketplaceEvent(supabase, {
      eventName: 'deal_completed',
      userId,
      dealId,
      metadata: {
        deal_id: dealId,
        deal_value: (deal as any).deal_amount || 0,
      },
    });

    return res.json({ success: true, message: 'Deal marked as completed.' });
  } catch (error: any) {
    console.error('[Deals] mark-complete error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// Debug route to test routing
router.get('/test-routing', (req, res) => {
  console.log('[Deals] Test routing endpoint hit');
  res.json({ success: true, message: 'Deals router is working', timestamp: new Date().toISOString() });
});

export default router;
