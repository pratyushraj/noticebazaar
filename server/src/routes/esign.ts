// eSign API Routes
// Handles Leegality eSign integration for contract signing

import express, { Router, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  sendDocumentForSigning,
  verifyWebhookSignature,
  downloadSignedPDF,
  getDocumentStatus,
} from '../services/leegalityService.js';
import { generateInvoice } from '../services/invoiceService.js';

const router = Router();
const publicRouter = Router(); // Separate router for public webhook endpoint

// POST /api/esign/send
// Send contract document to Leegality for eSign
router.post('/send', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId, pdfUrl, brandName, creatorName, brandPhone, creatorPhone, brandEmail, creatorEmail } = req.body;

    // Validate required fields
    if (!dealId || !pdfUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: dealId, pdfUrl'
      });
    }

    // Verify deal exists and user has access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, brand_name, brand_phone, brand_email')
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
    
    // Fetch creator profile for phone and email
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, email')
      .eq('id', deal.creator_id)
      .single();
    
    if (creatorError || !creatorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found'
      });
    }

    // Use provided data or fallback to deal/creator data
    const finalCreatorName = creatorName || `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator';
    const signingRequest = {
      pdfUrl: pdfUrl,
      brandName: brandName || deal.brand_name,
      creatorName: finalCreatorName,
      brandPhone: brandPhone || deal.brand_phone || '',
      creatorPhone: creatorPhone || creatorProfile.phone || '',
      brandEmail: brandEmail || deal.brand_email,
      creatorEmail: creatorEmail || creatorProfile.email || '',
    };
    
    // Validate required phone numbers
    if (!signingRequest.brandPhone) {
      return res.status(400).json({
        success: false,
        error: 'Brand phone number is required for eSign'
      });
    }
    
    if (!signingRequest.creatorPhone) {
      return res.status(400).json({
        success: false,
        error: 'Creator phone number is required for eSign'
      });
    }

    // Send to Leegality
    const result = await sendDocumentForSigning(signingRequest);

    if (!result.success || !result.documentId) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send document to Leegality'
      });
    }

    // Update deal with eSign information
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        esign_provider: 'leegality',
        esign_document_id: result.documentId,
        esign_status: 'sent',
        esign_url: result.signingUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('[eSign] Failed to update deal:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update deal with eSign information'
      });
    }

    return res.json({
      success: true,
      documentId: result.documentId,
      signingUrl: result.signingUrl,
      message: 'Document sent for eSign successfully'
    });
  } catch (error: any) {
    console.error('[eSign] Send error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/esign/status/:dealId
// Get eSign status for a deal
router.get('/status/:dealId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId } = req.params;

    // Verify deal exists and user has access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, esign_document_id, esign_status')
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

    // If no document ID, return current status
    if (!deal.esign_document_id) {
      return res.json({
        success: true,
        status: deal.esign_status || 'pending',
        message: 'No eSign document found'
      });
    }

    // Get status from Leegality
    const statusResult = await getDocumentStatus(deal.esign_document_id);

    if (!statusResult.success) {
      return res.status(500).json({
        success: false,
        error: statusResult.error || 'Failed to get document status'
      });
    }

    // Update deal status if changed
    if (statusResult.status !== deal.esign_status) {
      await supabase
        .from('brand_deals')
        .update({
          esign_status: statusResult.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);
    }

    return res.json({
      success: true,
      status: statusResult.status,
      documentId: deal.esign_document_id,
      message: 'Status retrieved successfully'
    });
  } catch (error: any) {
    console.error('[eSign] Status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/esign/webhook
// Webhook endpoint for Leegality callbacks (public, no auth required)
publicRouter.post('/webhook', async (req: express.Request, res: express.Response) => {
  try {
    // Get signature from headers
    const signature = req.headers['x-leegality-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.error('[eSign Webhook] Invalid signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    const { event, document_id, status, signed_pdf_url } = req.body;

    if (!document_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing document_id in webhook payload'
      });
    }

    // Find deal by document ID
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, esign_status')
      .eq('esign_document_id', document_id)
      .single();

    if (dealError || !deal) {
      console.error('[eSign Webhook] Deal not found for document:', document_id);
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    // Handle different event types
    if (event === 'document.signed' && status === 'signed') {
      // Download signed PDF
      const downloadResult = await downloadSignedPDF(document_id);

      if (!downloadResult.success || !downloadResult.pdfBuffer) {
        console.error('[eSign Webhook] Failed to download signed PDF');
        return res.status(500).json({
          success: false,
          error: 'Failed to download signed PDF'
        });
      }

      // Upload to Supabase storage
      const fileName = `signed-contract-${deal.id}-${Date.now()}.pdf`;
      const filePath = `${deal.id}/signed-contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(filePath, downloadResult.pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[eSign Webhook] Failed to upload signed PDF:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload signed PDF'
        });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('creator-assets')
        .getPublicUrl(filePath);

      // Update deal
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({
          esign_status: 'signed',
          signed_pdf_url: urlData?.publicUrl || signed_pdf_url,
          signed_at: new Date().toISOString(),
          status: 'Completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deal.id);

      if (updateError) {
        console.error('[eSign Webhook] Failed to update deal:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update deal'
        });
      }

      // Generate invoice automatically after signing
      try {
        const invoiceResult = await generateInvoice(deal.id);
        if (invoiceResult.success) {
          console.log(`[eSign Webhook] Invoice generated: ${invoiceResult.invoiceNumber}`);
        } else {
          console.error('[eSign Webhook] Failed to generate invoice:', invoiceResult.error);
          // Don't fail the webhook if invoice generation fails
        }
      } catch (invoiceError) {
        console.error('[eSign Webhook] Invoice generation error:', invoiceError);
        // Don't fail the webhook if invoice generation fails
      }

      return res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } else if (event === 'document.failed' || status === 'failed') {
      // Update deal status to failed
      await supabase
        .from('brand_deals')
        .update({
          esign_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deal.id);

      return res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } else if (event === 'document.sent' || status === 'sent') {
      // Update deal status to sent
      await supabase
        .from('brand_deals')
        .update({
          esign_status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deal.id);

      return res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    }

    // Unknown event, but acknowledge receipt
    return res.json({
      success: true,
      message: 'Webhook received'
    });
  } catch (error: any) {
    console.error('[eSign Webhook] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
export { publicRouter };
