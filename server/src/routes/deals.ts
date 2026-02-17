// @ts-nocheck
// Deals API Routes
// Handles deal-related operations like logging reminders and delivery details (barter)

import { Router, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import multer from 'multer';
import { generateContractFromScratch } from '../services/contractGenerator.js';
import { createContractReadyToken } from '../services/contractReadyTokenService.js';
import { sendCollabRequestAcceptedEmail } from '../services/collabRequestEmailService.js';
import { createShippingToken } from '../services/shippingTokenService.js';
import { sendBrandShippingUpdateEmail, sendBrandShippingIssueEmail } from '../services/shippingEmailService.js';
import { authMiddleware } from '../middleware/auth.js';
import { signContractAsCreator, getClientIp, getDeviceInfo } from '../services/contractSigningService.js';

const router = Router();

/** Mask phone for contract PDF: 98XXXXXX21 (first 2 + last 2 visible) */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return 'XXXXXXXXXX';
  return digits.slice(0, 2) + 'XXXXXX' + digits.slice(-2);
}

// Multer configuration for signed contract uploads (in-memory, PDF only, max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// POST /api/deals/log-share
// Log a brand message share
router.post('/log-share', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
router.patch('/:dealId/delivery-details', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
router.patch('/:dealId/shipping/update', async (req, res) => {
  try {
    const { dealId } = req.params;
    const { status, tracking_number, courier_name } = req.body;

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: status,
        tracking_number,
        courier_name,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      event: 'shipping_status_updated',
      metadata: { status, tracking_number }
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

router.patch('/:id/shipping/confirm-received', authMiddleware, confirmReceivedHandler);
router.patch('/:dealId/shipping/confirm-received', authMiddleware, confirmReceivedHandler);
router.post('/:id/confirm-receipt', authMiddleware, confirmReceivedHandler);

/**
 * POST /api/deals/:dealId/regenerate-contract
 * Manual trigger to regenerate contract for a deal if it failed or needs update.
 */
router.post('/:dealId/regenerate-contract', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Fetch creator profile
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, location')
      .eq('id', userId)
      .maybeSingle();

    const creatorName = creatorProfile
      ? `${(creatorProfile.first_name || '').trim()} ${(creatorProfile.last_name || '').trim()}`.trim() || 'Creator'
      : 'Creator';
    const creatorEmail = (creatorProfile as any)?.email || req.user?.email || undefined;
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

/**
 * PATCH /api/deals/:dealId/shipping/report-issue
 * Creator reports shipping issue (shipping_status = issue_reported, notify brand).
 */
router.patch('/:dealId/shipping/report-issue', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/:id/sign-creator', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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

    // 5. Update deal status to FULLY_EXECUTED
    await supabase
      .from('brand_deals')
      .update({
        status: 'FULLY_EXECUTED',
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', dealId);

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

// Debug route to test routing
router.get('/test-routing', (req, res) => {
  console.log('[Deals] Test routing endpoint hit');
  res.json({ success: true, message: 'Deals router is working', timestamp: new Date().toISOString() });
});

export default router;
