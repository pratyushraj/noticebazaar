// @ts-nocheck
// eSign API Routes
// Handles Meon eSign integration for contract signing

import express, { Router, Response } from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  uploadPDF,
  createInvite,
  getInviteStatus,
  downloadSignedPDF,
  verifyWebhookSignature,
  downloadPDFFromUrl,
} from '../services/meonService';
import { generateInvoice } from '../services/invoiceService';

const router = Router();
const publicRouter = Router(); // Separate router for public webhook endpoint

// GET /api/esign/config
// Check if Meon is configured (public endpoint for frontend to check)
publicRouter.get('/config', (req: express.Request, res: Response) => {
  return res.json({
    success: true,
    configured:
      !!process.env.MEON_USERNAME &&
      !!process.env.MEON_CLIENT_SECRET_KEY &&
      !!process.env.MEON_BASE_URL,
  });
});

// POST /api/esign/send
// Send contract document to Meon for eSign
router.post('/send', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    const { dealId, pdfUrl, brandName, creatorName, brandPhone, creatorPhone, brandEmail, creatorEmail } = req.body;

    // Validate required fields
    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: dealId'
      });
    }

    // Verify deal exists and user has access
    console.log('[eSign] Looking up deal:', dealId);
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();
    
    if (dealError) {
      console.error('[eSign] Error fetching deal:', dealError);
      return res.status(500).json({
        success: false,
        error: `Database error: ${dealError.message}`
      });
    }
    
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }
    
    // Verify user has access
    if (deal.creator_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Use provided pdfUrl or fallback to deal's contract_file_url
    const finalPdfUrl = pdfUrl || (deal as any).contract_file_url;
    
    if (!finalPdfUrl) {
      return res.status(400).json({
        success: false,
        error: 'Contract PDF URL is required. Please ensure the deal has a contract file uploaded.'
      });
    }
    
    // Fetch creator profile for phone and email
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, email')
      .eq('id', deal.creator_id)
      .maybeSingle();
    
    // Prepare signer information
    const finalCreatorName = creatorName || 
      (creatorProfile ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() : '') || 
      'Creator';
    
    const finalCreatorPhone = creatorPhone || (creatorProfile?.phone || '');
    const finalCreatorEmail = creatorEmail || (creatorProfile?.email || '');
    const dealBrandPhone = (deal as any).brand_phone || brandPhone || '';
    const dealBrandEmail = (deal as any).brand_email || brandEmail || '';
    const finalBrandName = brandName || deal.brand_name;
    
    // Validate required phone numbers
    if (!dealBrandPhone || dealBrandPhone.trim() === '' || dealBrandPhone === '+91' || dealBrandPhone === '+91 ') {
      return res.status(400).json({
        success: false,
        error: 'Brand phone number is required for eSign'
      });
    }
    
    if (!finalCreatorPhone || finalCreatorPhone.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Creator phone number is required for eSign'
      });
    }

    // Validate Meon configuration
    if (!process.env.MEON_USERNAME || !process.env.MEON_CLIENT_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Meon eSign is not configured. Please set MEON_USERNAME and MEON_CLIENT_SECRET_KEY environment variables.'
      });
    }

    console.log('[eSign] Starting eSign workflow:', {
      dealId: deal.id,
      pdfUrl: finalPdfUrl,
      brandName: finalBrandName,
      creatorName: finalCreatorName,
    });

    // Step 1: Download PDF from URL
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await downloadPDFFromUrl(finalPdfUrl);
      console.log('[eSign] PDF downloaded successfully, size:', pdfBuffer.length, 'bytes');
    } catch (error: any) {
      console.error('[eSign] PDF download failed:', error);
      return res.status(500).json({
        success: false,
        error: `Failed to download contract PDF: ${error.message}`
      });
    }

    // Step 2: Upload PDF to Meon
    const fileName = `${finalBrandName}_${finalCreatorName}_Contract_${Date.now()}.pdf`;
    const uploadResult = await uploadPDF(pdfBuffer, fileName);
    
    if (!uploadResult.success || !uploadResult.fileId) {
      console.error('[eSign] Upload failed:', uploadResult.error);
      return res.status(500).json({
        success: false,
        error: uploadResult.error || 'Failed to upload PDF to Meon'
      });
    }
    
    console.log('[eSign] PDF uploaded to Meon, token:', uploadResult.fileId);

    // Step 3: Meon returns token and esign_url directly from uploadPDF
    // The uploadResult.fileId is actually the token, and esignUrl is in the response
    const token = uploadResult.fileId; // This is the token from Meon
    const esignUrl = (uploadResult as any).esignUrl;
    
    if (!token) {
      console.error('[eSign] No token received from Meon upload');
      return res.status(500).json({
        success: false,
        error: 'Failed to get signing token from Meon'
      });
    }
    
    console.log('[eSign] Meon upload successful:', {
      token: token,
      esignUrl: esignUrl,
    });

    // Step 4: Update deal with eSign information
    const updateData: any = {
      esign_provider: 'meon',
      esign_invitation_id: token, // Meon token
      esign_status: 'sent',
      esign_url: esignUrl || null,
      updated_at: new Date().toISOString(),
    };
    
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(updateData)
      .eq('id', dealId);

    if (updateError) {
      console.error('[eSign] Failed to update deal:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to update deal: ${updateError.message}`
      });
    }

    console.log('[eSign] Deal updated successfully with eSign information');

    return res.json({
      success: true,
      invitationId: token,
      signUrl: esignUrl,
      message: 'Document sent for eSign successfully'
    });
  } catch (error: any) {
    console.error('[eSign] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/esign/webhook
// Handle Meon webhook callbacks (public endpoint)
publicRouter.post('/webhook', async (req: express.Request, res: Response) => {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(req, rawBody);
    if (!isValid) {
      console.error('[eSign Webhook] Invalid signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    const { invitationId, status, event } = req.body;
    
    console.log('[eSign Webhook] Received webhook:', {
      invitationId,
      status,
      event,
      body: req.body,
    });

    if (!invitationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing invitationId in webhook payload'
      });
    }

    // Find deal by invitation ID
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('esign_invitation_id', invitationId)
      .maybeSingle();

    if (dealError || !deal) {
      console.error('[eSign Webhook] Deal not found for invitationId:', invitationId);
      return res.status(404).json({
        success: false,
        error: 'Deal not found for this invitation'
      });
    }

    // Handle different webhook events
    if (status === 'SIGNED' || event === 'document.signed' || status === 'signed') {
      console.log('[eSign Webhook] Document signed, downloading signed PDF...');
      
      // Download signed PDF
      const downloadResult = await downloadSignedPDF(invitationId);
      
      if (!downloadResult.success || !downloadResult.pdfBuffer) {
        console.error('[eSign Webhook] Failed to download signed PDF:', downloadResult.error);
        // Update status to failed but don't fail the webhook
        await supabase
          .from('brand_deals')
          .update({
            esign_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', deal.id);
        
        return res.status(500).json({
          success: false,
          error: downloadResult.error || 'Failed to download signed PDF'
        });
      }

      // Upload signed PDF to Supabase Storage
      const creatorId = deal.creator_id;
      const fileName = `signed-contract-${deal.id}-${Date.now()}.pdf`;
      const filePath = `${creatorId}/signed-contracts/${fileName}`;
      
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
          error: `Failed to upload signed PDF: ${uploadError.message}`
        });
      }

      // Get public URL for signed PDF
      const { data: publicUrlData } = supabase.storage
        .from('creator-assets')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        console.error('[eSign Webhook] Failed to get public URL for signed PDF');
        return res.status(500).json({
          success: false,
          error: 'Failed to get public URL for signed PDF'
        });
      }

      console.log('[eSign Webhook] Signed PDF uploaded:', publicUrlData.publicUrl);

      // Update deal with signed PDF and status
      const updateData: any = {
        esign_status: 'signed',
        signed_pdf_url: publicUrlData.publicUrl,
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('brand_deals')
        .update(updateData)
        .eq('id', deal.id);

      if (updateError) {
        console.error('[eSign Webhook] Failed to update deal:', updateError);
        return res.status(500).json({
          success: false,
          error: `Failed to update deal: ${updateError.message}`
        });
      }

      // Generate invoice after signing
      try {
        console.log('[eSign Webhook] Generating invoice for signed deal...');
        await generateInvoice(deal.id, creatorId);
        console.log('[eSign Webhook] Invoice generated successfully');
      } catch (invoiceError: any) {
        console.error('[eSign Webhook] Invoice generation failed (non-fatal):', invoiceError.message);
        // Don't fail the webhook if invoice generation fails
      }

      console.log('[eSign Webhook] Deal updated successfully, status: signed');
      
      return res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } else if (status === 'FAILED' || event === 'document.failed' || status === 'failed') {
      // Update status to failed
      await supabase
        .from('brand_deals')
        .update({
          esign_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deal.id);
      
      console.log('[eSign Webhook] Deal status updated to failed');
      
      return res.json({
        success: true,
        message: 'Webhook processed, status: failed'
      });
    } else {
      // Update status to pending or sent
      const newStatus = status === 'PENDING' || status === 'pending' ? 'pending' : 'sent';
      await supabase
        .from('brand_deals')
        .update({
          esign_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deal.id);
      
      console.log('[eSign Webhook] Deal status updated to:', newStatus);
      
      return res.json({
        success: true,
        message: `Webhook processed, status: ${newStatus}`
      });
    }
  } catch (error: any) {
    console.error('[eSign Webhook] Unhandled error:', error);
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    const { dealId } = req.params;

    // Verify deal exists and user has access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();
    
    if (dealError || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }
    
    if (deal.creator_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const invitationId = (deal as any).esign_invitation_id;
    
    if (!invitationId) {
      return res.json({
        success: true,
        status: 'not_sent',
        message: 'Document has not been sent for eSign yet'
      });
    }

    // Get status from Meon
    const statusResult = await getInviteStatus(invitationId);
    
    if (!statusResult.success) {
      return res.json({
        success: true,
        status: (deal as any).esign_status || 'unknown',
        signedPdfUrl: (deal as any).signed_pdf_url || null,
        error: statusResult.error,
      });
    }

    return res.json({
      success: true,
      status: statusResult.status || (deal as any).esign_status,
      invitationId,
      signUrl: (deal as any).esign_url,
      signedPdfUrl: (deal as any).signed_pdf_url || null,
      signedAt: (deal as any).signed_at || null,
      meonStatus: statusResult.data,
    });
  } catch (error: any) {
    console.error('[eSign] Get status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
export { publicRouter };
