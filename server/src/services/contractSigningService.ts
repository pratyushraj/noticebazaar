// Service for legally valid contract signing with audit trail

import { supabase } from '../index.js';
import { Request } from 'express';

export interface SignContractRequest {
  dealId: string;
  token: string; // contract ready token
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  contractVersionId?: string;
  contractSnapshotHtml?: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: any;
  otpVerified: boolean;
  otpVerifiedAt?: string;
}

export interface SignatureRecord {
  id: string;
  deal_id: string;
  signer_role: 'brand' | 'creator';
  signer_name: string;
  signer_email: string;
  signer_phone?: string;
  ip_address: string;
  user_agent: string;
  device_info?: any;
  otp_verified: boolean;
  otp_verified_at?: string;
  signed: boolean;
  signed_at?: string;
  contract_version_id?: string;
  contract_snapshot_html?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get device info from user agent
 */
export function getDeviceInfo(userAgent: string): any {
  const deviceInfo: any = {
    userAgent,
    timestamp: new Date().toISOString(),
  };

  // Basic device detection
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    deviceInfo.type = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceInfo.type = 'tablet';
  } else {
    deviceInfo.type = 'desktop';
  }

  // Browser detection
  if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) {
    deviceInfo.browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    deviceInfo.browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    deviceInfo.browser = 'Safari';
  } else if (/edge|edg/i.test(userAgent)) {
    deviceInfo.browser = 'Edge';
  } else {
    deviceInfo.browser = 'Unknown';
  }

  return deviceInfo;
}

/**
 * Get IP address from request
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.socket.remoteAddress || req.ip || 'unknown';
  
  return ip.trim();
}

/**
 * Sign contract as brand
 */
export async function signContractAsBrand(
  request: SignContractRequest,
  tokenInfo?: { token: any; deal: any; creatorName: string } | null
): Promise<{ success: boolean; signature?: SignatureRecord; error?: string }> {
  try {
    // Validate OTP verification
    if (!request.otpVerified) {
      return {
        success: false,
        error: 'OTP verification is required before signing'
      };
    }

    // Use provided tokenInfo if available, otherwise validate token
    let validatedTokenInfo = tokenInfo;
    if (!validatedTokenInfo) {
      // Validate token and get deal (fallback for backward compatibility)
      const { getContractReadyTokenInfo } = await import('./contractReadyTokenService.js');
      validatedTokenInfo = await getContractReadyTokenInfo(request.token);

      if (!validatedTokenInfo) {
        return {
          success: false,
          error: 'Invalid or expired token'
        };
      }
    }

    // Get deal or create from submission if it doesn't exist
    let deal = validatedTokenInfo.deal;
    
    // If deal doesn't exist, create it from submission
    if (!deal || !deal.id) {
      // Get submission from contract ready token
      const { data: tokenData } = await supabase
        .from('contract_ready_tokens')
        .select('submission_id, deal_id')
        .eq('id', request.token)
        .maybeSingle();
      
      if (tokenData?.submission_id) {
        // Get submission data
        const { data: submission } = await supabase
          .from('deal_details_submissions')
          .select('*, deal_details_tokens!inner(*)')
          .eq('id', tokenData.submission_id)
          .maybeSingle();
        
        if (submission && submission.form_data) {
          const formData = submission.form_data as any;
          
          // Create deal from submission data
          const dealData: any = {
            creator_id: submission.creator_id,
            brand_name: formData.brandName || 'Brand',
            deal_amount: formData.dealType === 'paid' && formData.paymentAmount
              ? parseFloat(formData.paymentAmount) || 0
              : 0,
            deliverables: JSON.stringify(formData.deliverables || []),
            due_date: formData.deadline || new Date().toISOString().split('T')[0],
            payment_expected_date: formData.deadline || new Date().toISOString().split('T')[0],
            status: 'SIGNED_BY_BRAND', // Will be signed immediately
            platform: 'Other',
            deal_type: formData.dealType || 'paid',
            created_via: 'deal_details_form',
            brand_address: formData.companyAddress || null,
            brand_email: formData.companyEmail || null,
          };

          const { data: newDeal, error: dealError } = await supabase
            .from('brand_deals')
            .insert(dealData)
            .select()
            .single();

          if (dealError || !newDeal) {
            console.error('[ContractSigningService] Failed to create deal from submission:', dealError);
            return {
              success: false,
              error: 'Failed to create deal'
            };
          }

          deal = newDeal;
          request.dealId = newDeal.id;
          
          // Update submission with deal_id
          await supabase
            .from('deal_details_submissions')
            .update({ deal_id: newDeal.id })
            .eq('id', tokenData.submission_id);
          
          // Update contract ready token with deal_id (if it has submission_id)
          if (tokenData.submission_id) {
            await supabase
              .from('contract_ready_tokens')
              .update({ deal_id: newDeal.id })
              .eq('id', request.token);
          }
        }
      }
    }

    // Check if deal ID matches
    if (deal.id !== request.dealId) {
      return {
        success: false,
        error: 'Deal ID mismatch'
      };
    }

    // Check if already signed
    const { data: existingSignature, error: checkError } = await supabase
      .from('contract_signatures' as any)
      .select('*')
      .eq('deal_id', request.dealId)
      .eq('signer_role', 'brand')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[ContractSigningService] Error checking existing signature:', checkError);
      return {
        success: false,
        error: 'Failed to check existing signature'
      };
    }

    if (existingSignature && (existingSignature as any).signed) {
      return {
        success: false,
        error: 'Contract has already been signed'
      };
    }

    // Get contract HTML snapshot if not provided
    let contractSnapshotHtml = request.contractSnapshotHtml;
    if (!contractSnapshotHtml && deal.contract_file_url) {
      // Try to fetch contract HTML (if available)
      // For now, we'll store a reference
      contractSnapshotHtml = `Contract URL: ${deal.contract_file_url}\nSigned at: ${new Date().toISOString()}`;
    }

    // Create or update signature record
    const signatureData: any = {
      deal_id: request.dealId,
      signer_role: 'brand',
      signer_name: request.signerName,
      signer_email: request.signerEmail,
      signer_phone: request.signerPhone || null,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      device_info: request.deviceInfo || getDeviceInfo(request.userAgent),
      otp_verified: true,
      otp_verified_at: request.otpVerifiedAt || new Date().toISOString(),
      signed: true,
      signed_at: new Date().toISOString(),
      contract_version_id: request.contractVersionId || deal.contract_version || 'v3',
      contract_snapshot_html: contractSnapshotHtml,
    };

    let signature: SignatureRecord;

    if (existingSignature) {
      // Update existing record
      const { data: updated, error: updateError } = await supabase
        .from('contract_signatures' as any)
        .update(signatureData)
        .eq('id', (existingSignature as any).id)
        .select()
        .single();

      if (updateError || !updated) {
        console.error('[ContractSigningService] Error updating signature:', updateError);
        return {
          success: false,
          error: 'Failed to update signature record'
        };
      }

      signature = updated as unknown as SignatureRecord;
    } else {
      // Create new record
      const { data: created, error: createError } = await supabase
        .from('contract_signatures' as any)
        .insert(signatureData)
        .select()
        .single();

      if (createError || !created) {
        console.error('[ContractSigningService] Error creating signature:', createError);
        return {
          success: false,
          error: 'Failed to create signature record'
        };
      }

      signature = created as unknown as SignatureRecord;
    }

    // Update deal status to SIGNED_BY_BRAND
    try {
      const { error: updateDealError } = await supabase
        .from('brand_deals' as any)
        .update({
          brand_response_status: 'accepted_verified',
          brand_response_at: new Date().toISOString(),
          status: 'SIGNED_BY_BRAND', // Brand has signed the contract
          updated_at: new Date().toISOString()
        })
        .eq('id', request.dealId);

      if (updateDealError) {
        console.error('[ContractSigningService] Error updating deal status:', updateDealError);
        // Non-fatal: signature is already created, just log the error
      } else {
        console.log('[ContractSigningService] Deal status updated to SIGNED_BY_BRAND');
      }
    } catch (dealUpdateError) {
      console.error('[ContractSigningService] Deal status update failed (non-fatal):', dealUpdateError);
    }

    // Log activity
    try {
      await supabase
        .from('analytics_events' as any)
        .insert({
          event_type: 'contract_signed',
          deal_id: request.dealId,
          creator_id: deal.creator_id,
          metadata: {
            signer_role: 'brand',
            signer_email: request.signerEmail,
            signature_id: signature.id,
            ip_address: request.ipAddress,
            device_type: request.deviceInfo?.type || 'unknown'
          },
          created_at: new Date().toISOString()
        });
    } catch (analyticsError) {
      console.error('[ContractSigningService] Activity logging failed (non-fatal):', analyticsError);
    }

    // Send email notifications (non-blocking)
    try {
      const { sendBrandSigningConfirmationEmail, sendCreatorSigningNotificationEmail } = await import('./contractSigningEmailService.js');
      
      // Fetch creator details for email
      const { data: creator, error: creatorError } = await supabase
        .from('profiles' as any)
        .select('email, first_name, last_name')
        .eq('id', deal.creator_id)
        .maybeSingle();

      if (creatorError) {
        console.error('[ContractSigningService] Error fetching creator:', creatorError);
      }

      const creatorData = creator as any;
      const creatorName = creatorData?.first_name && creatorData?.last_name
        ? `${creatorData.first_name} ${creatorData.last_name}`
        : creatorData?.first_name || creatorData?.email?.split('@')[0] || 'Creator';

      // Parse deliverables
      const deliverablesList = deal.deliverables
        ? (typeof deal.deliverables === 'string' 
            ? (deal.deliverables.includes('[') ? JSON.parse(deal.deliverables) : [deal.deliverables])
            : Array.isArray(deal.deliverables) ? deal.deliverables : [])
        : [];

      const creatorEmail = creatorData?.email || '';
      
      const emailData = {
        dealId: deal.id,
        brandName: deal.brand_name || 'Brand',
        creatorName: creatorName,
        brandEmail: request.signerEmail,
        creatorEmail: creatorEmail,
        dealAmount: deal.amount ? parseFloat(deal.amount.toString()) : undefined,
        dealType: (deal.deal_type as 'paid' | 'barter') || 'paid',
        deliverables: deliverablesList.map((d: any) => 
          typeof d === 'string' ? d : `${d.quantity || 1}x ${d.contentType || 'Content'} on ${d.platform || 'Platform'}`
        ),
        deadline: deal.due_date || undefined,
        contractUrl: deal.contract_file_url || undefined,
      };

      // Send emails in parallel (non-blocking)
      Promise.all([
        sendBrandSigningConfirmationEmail(request.signerEmail, request.signerName, emailData),
        creatorEmail ? sendCreatorSigningNotificationEmail(creatorEmail, creatorName, emailData) : Promise.resolve({ success: true })
      ]).then(([brandResult, creatorResult]) => {
        if (brandResult.success) {
          console.log('[ContractSigningService] Brand confirmation email sent');
        } else {
          console.error('[ContractSigningService] Failed to send brand confirmation email:', brandResult.error || 'Unknown error');
        }
        if (creatorResult.success) {
          console.log('[ContractSigningService] Creator notification email sent');
        } else {
          const creatorError = (creatorResult as any).error;
          console.error('[ContractSigningService] Failed to send creator notification email:', creatorError || 'Unknown error');
        }
      }).catch((emailError) => {
        console.error('[ContractSigningService] Email sending error (non-fatal):', emailError);
      });
    } catch (emailServiceError) {
      console.error('[ContractSigningService] Email service error (non-fatal):', emailServiceError);
    }

    return {
      success: true,
      signature
    };
  } catch (error: any) {
    console.error('[ContractSigningService] Sign contract error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign contract'
    };
  }
}

/**
 * Sign contract as creator
 */
export async function signContractAsCreator(
  request: {
    dealId: string;
    creatorId: string;
    signerName: string;
    signerEmail: string;
    signerPhone?: string;
    contractVersionId?: string;
    contractSnapshotHtml?: string;
    ipAddress: string;
    userAgent: string;
    deviceInfo?: any;
    otpVerified: boolean;
    otpVerifiedAt?: string;
  }
): Promise<{ success: boolean; signature?: SignatureRecord; error?: string }> {
  try {
    // Validate OTP verification
    if (!request.otpVerified) {
      return {
        success: false,
        error: 'OTP verification is required before signing'
      };
    }

    // Get deal
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals' as any)
      .select('*')
      .eq('id', request.dealId)
      .single();

    if (dealError || !deal) {
      return {
        success: false,
        error: 'Deal not found'
      };
    }

    const dealData = deal as any;

    // Verify creator owns this deal
    if (dealData.creator_id !== request.creatorId) {
      return {
        success: false,
        error: 'You can only sign contracts for your own deals'
      };
    }

    // Check if brand has signed first
    const brandSignature = await getSignature(request.dealId, 'brand');
    if (!brandSignature || !brandSignature.signed) {
      return {
        success: false,
        error: 'Brand must sign the contract first'
      };
    }

    // Check if already signed
    const { data: existingSignature, error: checkError } = await supabase
      .from('contract_signatures' as any)
      .select('*')
      .eq('deal_id', request.dealId)
      .eq('signer_role', 'creator')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[ContractSigningService] Error checking existing signature:', checkError);
      return {
        success: false,
        error: 'Failed to check existing signature'
      };
    }

    if (existingSignature && (existingSignature as any).signed) {
      return {
        success: false,
        error: 'Contract has already been signed by creator'
      };
    }

    // Get contract HTML snapshot if not provided
    let contractSnapshotHtml = request.contractSnapshotHtml;
    if (!contractSnapshotHtml && dealData.contract_file_url) {
      contractSnapshotHtml = `Contract URL: ${dealData.contract_file_url}\nSigned at: ${new Date().toISOString()}`;
    }

    // Create or update signature record
    const signatureData: any = {
      deal_id: request.dealId,
      signer_role: 'creator',
      signer_name: request.signerName,
      signer_email: request.signerEmail,
      signer_phone: request.signerPhone || null,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      device_info: request.deviceInfo || null,
      otp_verified: request.otpVerified,
      otp_verified_at: request.otpVerifiedAt || new Date().toISOString(),
      signed: true,
      signed_at: new Date().toISOString(),
      contract_version_id: request.contractVersionId || dealData.contract_version || 'v3',
      contract_snapshot_html: contractSnapshotHtml || null,
    };

    let signature: SignatureRecord;

    if (existingSignature) {
      // Update existing signature
      const existingSig = existingSignature as any;
      const { data: updated, error: updateError } = await supabase
        .from('contract_signatures' as any)
        .update(signatureData)
        .eq('id', existingSig.id)
        .select()
        .single();

      if (updateError) {
        console.error('[ContractSigningService] Error updating signature:', updateError);
        return {
          success: false,
          error: 'Failed to update signature'
        };
      }

      signature = updated as unknown as SignatureRecord;
    } else {
      // Create new signature
      const { data: created, error: createError } = await supabase
        .from('contract_signatures' as any)
        .insert(signatureData)
        .select()
        .single();

      if (createError) {
        console.error('[ContractSigningService] Error creating signature:', createError);
        return {
          success: false,
          error: 'Failed to create signature'
        };
      }

      signature = created as unknown as SignatureRecord;
    }

    // Update deal status to completed when both parties have signed
    try {
      await supabase
        .from('brand_deals' as any)
        .update({
          deal_execution_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.dealId);
    } catch (updateError) {
      console.error('[ContractSigningService] Error updating deal status:', updateError);
      // Non-fatal, continue
    }

    // Send email notifications (non-blocking)
    try {
      const { sendCreatorSigningConfirmationEmail } = await import('./contractSigningEmailService.js');
      
      // Fetch brand details for email
      const { data: brandDeal, error: brandDealError } = await supabase
        .from('brand_deals' as any)
        .select('brand_name, brand_email, amount, deal_type, deliverables, due_date, contract_file_url')
        .eq('id', request.dealId)
        .single();

      if (!brandDealError && brandDeal) {
        const brandDealData = brandDeal as any;
        const deliverablesList = brandDealData.deliverables
          ? (typeof brandDealData.deliverables === 'string' 
              ? (brandDealData.deliverables.includes('[') ? JSON.parse(brandDealData.deliverables) : [brandDealData.deliverables])
              : Array.isArray(brandDealData.deliverables) ? brandDealData.deliverables : [])
          : [];

        const emailData = {
          dealId: request.dealId,
          brandName: brandDealData.brand_name || 'Brand',
          creatorName: request.signerName,
          brandEmail: brandDealData.brand_email || '',
          creatorEmail: request.signerEmail,
          dealAmount: brandDealData.amount ? parseFloat(brandDealData.amount.toString()) : undefined,
          dealType: (brandDealData.deal_type as 'paid' | 'barter') || 'paid',
          deliverables: deliverablesList.map((d: any) => 
            typeof d === 'string' ? d : `${d.quantity || 1}x ${d.contentType || 'Content'} on ${d.platform || 'Platform'}`
          ),
          deadline: brandDealData.due_date || undefined,
          contractUrl: brandDealData.contract_file_url || undefined,
        };

        sendCreatorSigningConfirmationEmail(request.signerEmail, request.signerName, emailData)
          .then((result) => {
            if (result.success) {
              console.log('[ContractSigningService] Creator confirmation email sent');
            } else {
              console.error('[ContractSigningService] Failed to send creator confirmation email:', result.error || 'Unknown error');
            }
          })
          .catch((emailError) => {
            console.error('[ContractSigningService] Email sending error (non-fatal):', emailError);
          });
      }
    } catch (emailServiceError) {
      console.error('[ContractSigningService] Email service error (non-fatal):', emailServiceError);
    }

    return {
      success: true,
      signature
    };
  } catch (error: any) {
    console.error('[ContractSigningService] Sign contract as creator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign contract'
    };
  }
}

/**
 * Get signature for a deal
 */
export async function getSignature(
  dealId: string,
  signerRole: 'brand' | 'creator'
): Promise<SignatureRecord | null> {
  try {
    const { data, error } = await supabase
      .from('contract_signatures' as any)
      .select('*')
      .eq('deal_id', dealId)
      .eq('signer_role', signerRole)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[ContractSigningService] Error fetching signature:', error);
      return null;
    }

    return data as unknown as SignatureRecord | null;
  } catch (error: any) {
    console.error('[ContractSigningService] Get signature error:', error);
    return null;
  }
}

