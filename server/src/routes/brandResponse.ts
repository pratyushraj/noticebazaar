// @ts-nocheck
// Public Brand Response API - No authentication required
// Allows brands to respond to contract change requests via secure token links
// Uses cryptographically secure UUID v4 tokens for unguessable URLs

import { Router, Request, Response } from 'express';
import { supabase, supabaseInitialized } from '../lib/supabase.js';
import crypto from 'crypto';
import { generateContractFromScratch } from '../services/contractGenerator.js';

const router = Router();

// Helper function to hash IP address for privacy
function hashIpAddress(ip: string): { hash: string | null; partial: string | null } {
  if (!ip || ip === 'unknown') {
    return { hash: null, partial: null };
  }

  // Extract first 3 octets for partial IP (e.g., "192.168.1.xxx")
  const partialMatch = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  const partial = partialMatch ? `${partialMatch[1]}.xxx` : null;

  // Create a simple hash (SHA-256, first 16 chars for storage efficiency)
  const hash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

  return { hash, partial };
}

// Helper function to get client IP
function getClientIp(req: Request): string {
  return req.ip ||
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.toString() ||
    req.socket.remoteAddress ||
    'unknown';
}

/**
 * Determines if brand confirmation/clarification page is required
 * Returns true if any of these conditions are met:
 * - Creator requested changes earlier
 * - AI requested safety clarifications (requested_changes exist)
 * - Legal safeguards auto-applied (missing critical terms)
 * - Risk score > threshold
 * - Platform mismatch detected
 * - Payment risk detected
 */
async function shouldRequireBrandConfirmation(dealId: string): Promise<boolean> {
  try {
    // Fetch deal with related data
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select(`
        id,
        status,
        brand_response_status,
        analysis_report_id,
        creator_requested_clarifications,
        deal_schema
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.error('[shouldRequireBrandConfirmation] Error fetching deal:', dealError);
      // Default to requiring confirmation if we can't determine
      return true;
    }

    // A. Creator explicitly requested clarifications
    if (deal.creator_requested_clarifications === true) {
      console.log('[shouldRequireBrandConfirmation] Creator requested clarifications');
      return true;
    }

    // B. Check for requested changes from AI analysis
    if (deal.analysis_report_id) {
      const { data: issues, error: issuesError } = await supabase
        .from('protection_issues')
        .select('id, severity, category')
        .eq('report_id', deal.analysis_report_id)
        .in('severity', ['high', 'medium'])
        .limit(1);

      if (!issuesError && issues && issues.length > 0) {
        console.log('[shouldRequireBrandConfirmation] AI requested clarifications found');
        return true;
      }

      // Check analysis data for missing critical terms
      const { data: report, error: reportError } = await supabase
        .from('protection_reports')
        .select('analysis_json')
        .eq('id', deal.analysis_report_id)
        .single();

      if (!reportError && report?.analysis_json) {
        const analysisData = report.analysis_json;
        const keyTerms = analysisData?.keyTerms || {};

        // Check for missing critical terms that require clarification
        const hasMissingCriticalTerms =
          (!keyTerms?.usageRights || keyTerms.usageRights === 'Not specified') ||
          (!keyTerms?.exclusivity || keyTerms.exclusivity === 'Not specified') ||
          (!keyTerms?.paymentSchedule || keyTerms.paymentSchedule === 'Not specified') ||
          (!keyTerms?.termination || keyTerms.termination === 'Not specified');

        if (hasMissingCriticalTerms) {
          console.log('[shouldRequireBrandConfirmation] Missing critical terms detected');
          return true;
        }

        // Check for high/medium severity issues
        const issues = Array.isArray(analysisData?.issues) ? analysisData.issues : [];
        const hasImportantIssues = issues.some((issue: any) =>
          issue.severity === 'high' || issue.severity === 'medium'
        );

        if (hasImportantIssues) {
          console.log('[shouldRequireBrandConfirmation] Important issues detected');
          return true;
        }
      }
    }

    // C. Check deal schema for payment risks
    if (deal.deal_schema) {
      const dealSchema = typeof deal.deal_schema === 'string'
        ? JSON.parse(deal.deal_schema)
        : deal.deal_schema;

      // Payment risk: missing payment method or vague terms
      const paymentMethod = dealSchema.payment_method || dealSchema.paymentMethod;
      const paymentTerms = dealSchema.payment_terms || dealSchema.paymentTerms;

      if (!paymentMethod || !paymentTerms || paymentTerms === 'Not specified' || paymentTerms === 'Unclear') {
        console.log('[shouldRequireBrandConfirmation] Payment risk detected');
        return true;
      }
    }

    // D. Check if deal is in negotiation mode
    if (deal.status === 'Negotiating' || deal.brand_response_status === 'negotiating') {
      console.log('[shouldRequireBrandConfirmation] Deal in negotiation mode');
      return true;
    }

    // Happy path - no confirmation needed
    console.log('[shouldRequireBrandConfirmation] No confirmation required - happy path');
    return false;
  } catch (error: any) {
    console.error('[shouldRequireBrandConfirmation] Error:', error);
    // Default to requiring confirmation on error
    return true;
  }
}

// Helper function to log audit entry
// Audit logs are for transparency and record-keeping, not legal binding or advice.
async function logAuditEntry(
  replyTokenId: string,
  dealId: string,
  actionType: 'viewed' | 'accepted' | 'negotiation_requested' | 'rejected' | 'updated_response',
  req: Request,
  metadata: {
    responseStatus?: string;
    brandTeamName?: string;
    optionalComment?: string;
  } = {}
): Promise<void> {
  try {
    // For "viewed" actions: log only once per token unless revisited after 1 hour
    if (actionType === 'viewed') {
      const { data: lastViewed } = await supabase
        .from('brand_reply_audit_log')
        .select('action_timestamp')
        .eq('reply_token_id', replyTokenId)
        .eq('action_type', 'viewed')
        .order('action_timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastViewed) {
        const lastViewedTime = new Date(lastViewed.action_timestamp);
        const now = new Date();
        const hoursSinceLastView = (now.getTime() - lastViewedTime.getTime()) / (1000 * 60 * 60);

        // Only log if more than 1 hour has passed since last view
        if (hoursSinceLastView < 1) {
          return; // Skip logging duplicate view
        }
      }
    }

    // Calculate decision_version for decision-related actions
    let decisionVersion: number | null = null;
    if (actionType !== 'viewed') {
      // Get the highest decision_version for this deal
      const { data: lastDecision } = await supabase
        .from('brand_reply_audit_log')
        .select('decision_version')
        .eq('deal_id', dealId)
        .not('decision_version', 'is', null)
        .order('decision_version', { ascending: false })
        .limit(1)
        .maybeSingle();

      decisionVersion = lastDecision?.decision_version ? lastDecision.decision_version + 1 : 1;
    }

    const userAgent = req.headers['user-agent'] || null;
    const ip = getClientIp(req);
    const { hash, partial } = hashIpAddress(ip);

    const { error } = await supabase
      .from('brand_reply_audit_log')
      .insert({
        reply_token_id: replyTokenId,
        deal_id: dealId,
        action_type: actionType,
        action_timestamp: new Date().toISOString(),
        action_source: 'brand_reply_link',
        user_agent: userAgent,
        ip_address_hash: hash,
        ip_address_partial: partial,
        optional_comment: metadata.optionalComment || null,
        response_status: metadata.responseStatus || null,
        brand_team_name: metadata.brandTeamName || null,
        decision_version: decisionVersion,
      });

    if (error) {
      console.error('[BrandResponse] Audit log error:', error);
      // Don't fail the request if audit logging fails
    }
  } catch (error: any) {
    console.error('[BrandResponse] Audit log exception:', error);
    // Don't fail the request if audit logging fails
  }
}

// GET /api/brand-response/:token
// Public endpoint to fetch deal info via secure token
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Validate token format (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    if (!supabaseInitialized) {
      console.error('[BrandResponse] GET Supabase not initialized');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Fetch token and validate
    const { data: tokenData, error: tokenError } = await supabase
      .from('brand_reply_tokens')
      .select('id, deal_id, is_active, expires_at, revoked_at')
      .eq('id', token.trim())
      .maybeSingle();

    if (tokenError) {
      console.error('[BrandResponse] GET Token fetch error:', tokenError);
      return res.status(500).json({
        success: false,
        error: 'An error occurred. Please try again later.'
      });
    }

    if (!tokenData) {
      // Token doesn't exist - show neutral error (no hints, no IDs)
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    // Check if token is active
    if (!tokenData.is_active || tokenData.revoked_at) {
      return res.status(403).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    // Check if token is expired
    if (tokenData.expires_at) {
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        return res.status(403).json({
          success: false,
          error: 'This request has expired. Please ask the creator to resend.'
        });
      }
    }

    // Log "viewed" action
    await logAuditEntry(tokenData.id, tokenData.deal_id, 'viewed', req);

    // Fetch deal (only expose safe fields)
    let deal: any = null;
    let dealError: any = null;

    try {
      // First try with all columns
      const { data, error } = await supabase
        .from('brand_deals')
        .select(
          'id, brand_name, brand_response_status, brand_response_message, brand_response_at, deal_amount, deliverables, analysis_report_id'
        )
        .eq('id', tokenData.deal_id)
        .maybeSingle();

      deal = data;
      dealError = error;

      // If there's a column error, try with a minimal set that definitely exists
      const isColumnError =
        error &&
        (error.code === '42703' ||
          (typeof error.message === 'string' &&
            (error.message.includes('column') ||
              error.message.includes('does not exist'))));

      if (isColumnError) {
        console.log('[BrandResponse] Column error detected, trying minimal select:', error.message);
        // Try with only essential columns that should always exist
        const { data: fallbackDeal, error: fallbackError } = await supabase
          .from('brand_deals')
          .select(
            'id, brand_name, brand_response_status, brand_response_message, brand_response_at, deal_amount, deliverables'
          )
          .eq('id', tokenData.deal_id)
          .maybeSingle();

        if (!fallbackError && fallbackDeal) {
          deal = fallbackDeal;
          dealError = null;
          console.log('[BrandResponse] Successfully fetched deal with minimal select, response_status:', fallbackDeal.brand_response_status);
        } else {
          console.error('[BrandResponse] Fallback query also failed:', fallbackError);
          dealError = fallbackError;
        }
      } else if (!error && deal) {
        console.log('[BrandResponse] Successfully fetched deal, response_status:', deal.brand_response_status);
      }
    } catch (err: any) {
      console.error('[BrandResponse] Exception fetching deal:', err);
      dealError = err;
    }

    if (dealError || !deal) {
      console.error('[BrandResponse] GET Deal fetch error (falling back to minimal deal):', dealError);

      // Try to fetch at least the response status even if other fields fail
      if (tokenData?.deal_id) {
        const { data: minimalDeal } = await supabase
          .from('brand_deals')
          .select('brand_name, brand_response_status, brand_response_message, brand_response_at, deal_amount, deliverables')
          .eq('id', tokenData.deal_id)
          .maybeSingle();

        if (minimalDeal) {
          return res.json({
            success: true,
            deal: {
              brand_name: minimalDeal.brand_name || 'Collaboration',
              response_status: minimalDeal.brand_response_status || 'pending',
              response_message: minimalDeal.brand_response_message || null,
              response_at: minimalDeal.brand_response_at || null,
              deal_amount: minimalDeal.deal_amount || null,
              deliverables: minimalDeal.deliverables || null,
            },
            requested_changes: [],
            analysis_data: null,
          });
        }
      }

      // Final fallback: return a minimal, generic deal so the brand page still loads
      return res.json({
        success: true,
        deal: {
          brand_name: 'Collaboration',
          response_status: 'pending',
          response_message: null,
          response_at: null,
          deal_amount: null,
          deliverables: null,
        },
        requested_changes: [],
        analysis_data: null,
      });
    }

    // Fetch requested changes (issues + missing clauses) from protection_issues
    let requestedChanges: any[] = [];
    let analysisData: any = null;

    if (deal.analysis_report_id) {
      // Fetch issues
      const { data: issues, error: issuesError } = await supabase
        .from('protection_issues')
        .select('id, title, severity, category, description')
        .eq('report_id', deal.analysis_report_id)
        .in('severity', ['high', 'medium', 'warning'])
        .order('severity', { ascending: false })
        .order('created_at', { ascending: true });

      if (!issuesError && issues) {
        requestedChanges = issues.map((issue: any) => ({
          title: issue.title,
          severity: issue.severity,
          category: issue.category,
          description: issue.description
        }));
      }

      // Fetch analysis_json from protection_reports for full contract summary
      const { data: report, error: reportError } = await supabase
        .from('protection_reports')
        .select('analysis_json')
        .eq('id', deal.analysis_report_id)
        .maybeSingle();

      if (!reportError && report?.analysis_json) {
        analysisData = report.analysis_json;
      }
    }

    // Check if brand confirmation is required
    const requiresConfirmation = await shouldRequireBrandConfirmation(tokenData.deal_id);

    // Return only safe, non-sensitive data
    return res.json({
      success: true,
      deal: {
        brand_name: deal.brand_name,
        response_status: deal.brand_response_status || 'pending',
        response_message: deal.brand_response_message,
        response_at: deal.brand_response_at,
        deal_amount: deal.deal_amount || null,
        deliverables: deal.deliverables || null,
      },
      requested_changes: requestedChanges,
      analysis_data: analysisData,
      requires_confirmation: requiresConfirmation
    });

  } catch (error: any) {
    console.error('[BrandResponse] GET Error:', error);
    // Return neutral error (no stack traces, no internal details)
    return res.status(500).json({
      success: false,
      error: 'An error occurred. Please try again later.'
    });
  }
});

// POST /api/brand-response/:token
// Public endpoint - no auth required
router.post('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { status, message, brand_team_name } = req.body;

    // Validate token format (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!token || !uuidRegex.test(token.trim())) {
      return res.status(400).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Validate status enum
    const validStatuses = ['accepted', 'accepted_verified', 'negotiating', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!supabaseInitialized) {
      return res.status(500).json({
        success: false,
        error: 'An error occurred. Please try again later.'
      });
    }

    // Fetch and validate token (using indexed column for performance)
    const { data: tokenData, error: tokenError } = await supabase
      .from('brand_reply_tokens')
      .select('id, deal_id, is_active, expires_at, revoked_at')
      .eq('id', token.trim()) // Uses primary key index
      .maybeSingle();

    if (tokenError || !tokenData) {
      // Neutral error (no hints, no IDs)
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    // Check if token is active (revoked tokens remain in DB with revoked_at)
    if (!tokenData.is_active || tokenData.revoked_at) {
      return res.status(403).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    // Check if token is expired - expired tokens cannot submit decisions
    if (tokenData.expires_at) {
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        return res.status(403).json({
          success: false,
          error: 'This request has expired. Please ask the creator to resend.'
        });
      }
    }

    // Get client IP address
    const clientIp = getClientIp(req);

    // Check if deal exists - fetch more fields for contract generation
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, brand_name, status, brand_response_status, creator_id, deal_amount, deliverables, brand_email, deal_schema, analysis_report_id')
      .eq('id', tokenData.deal_id)
      .single();

    if (dealError || !deal) {
      console.error('[BrandResponse] POST Error fetching deal:', dealError);
      // Neutral error (no internal details)
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    // Check if confirmation is required
    const requiresConfirmation = await shouldRequireBrandConfirmation(tokenData.deal_id);

    // Determine action type for audit log
    const isUpdate = deal.brand_response_status && deal.brand_response_status !== 'pending';
    const actionType: 'accepted' | 'negotiation_requested' | 'rejected' | 'updated_response' =
      isUpdate ? 'updated_response' :
        status === 'accepted' || status === 'accepted_verified' ? 'accepted' :
          status === 'negotiating' ? 'negotiation_requested' :
            'rejected';

    // Update deal with brand response
    const updateData: any = {
      brand_response_status: status,
      brand_response_at: new Date().toISOString(),
      brand_response_ip: clientIp,
      updated_at: new Date().toISOString()
    };

    if (message && message.trim()) {
      updateData.brand_response_message = message.trim();
    }

    if (brand_team_name && brand_team_name.trim()) {
      updateData.brand_team_name = brand_team_name.trim();
    }

    // Auto-update deal status based on brand response
    let newDealStatus = deal.status;

    if (status === 'accepted' || status === 'accepted_verified') {
      newDealStatus = 'Approved';
    } else if (status === 'negotiating') {
      newDealStatus = 'Negotiating';
    } else if (status === 'rejected') {
      newDealStatus = 'Rejected';
    }

    if (newDealStatus !== deal.status) {
      updateData.status = newDealStatus;
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(updateData)
      .eq('id', tokenData.deal_id);

    if (updateError) {
      console.error('[BrandResponse] Update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'An error occurred. Please try again later.'
      });
    }

    // Log audit entry
    await logAuditEntry(
      tokenData.id,
      tokenData.deal_id,
      actionType,
      req,
      {
        responseStatus: status,
        brandTeamName: brand_team_name?.trim() || null,
        optionalComment: message?.trim() || null,
      }
    );

    // Auto-generate contract if confirmation not required and brand accepted
    let contractGenerated = false;
    if (!requiresConfirmation && (status === 'accepted' || status === 'accepted_verified')) {
      try {
        console.log('[BrandResponse] Auto-generating contract (happy path)...');

        // Fetch creator details for contract generation
        const { data: creator, error: creatorError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, address')
          .eq('id', deal.creator_id)
          .single();

        if (!creatorError && creator) {
          // Fetch analysis data if available
          let analysisData: any = null;
          if (deal.analysis_report_id) {
            const { data: report } = await supabase
              .from('protection_reports')
              .select('analysis_json')
              .eq('id', deal.analysis_report_id)
              .single();
            analysisData = report?.analysis_json;
          }

          // Parse deliverables
          let deliverablesList: string[] = [];
          if (deal.deliverables) {
            if (typeof deal.deliverables === 'string') {
              try {
                const parsed = JSON.parse(deal.deliverables);
                deliverablesList = Array.isArray(parsed) ? parsed : [deal.deliverables];
              } catch {
                deliverablesList = [deal.deliverables];
              }
            } else if (Array.isArray(deal.deliverables)) {
              deliverablesList = deal.deliverables;
            }
          }

          // Parse deal schema
          const dealSchema = deal.deal_schema
            ? (typeof deal.deal_schema === 'string' ? JSON.parse(deal.deal_schema) : deal.deal_schema)
            : {};

          // Build contract generation request
          const creatorName = creator.first_name && creator.last_name
            ? `${creator.first_name} ${creator.last_name}`
            : creator.first_name || creator.email?.split('@')[0] || 'Creator';

          const contractRequest = {
            brandName: deal.brand_name || 'Brand',
            creatorName: creatorName,
            dealAmount: deal.deal_amount || 0,
            deliverables: deliverablesList.length > 0 ? deliverablesList : ['As per agreement'],
            brandEmail: deal.brand_email || null,
            brandAddress: dealSchema.brand_address || null,
            creatorEmail: creator.email || null,
            creatorAddress: creator.address || null,
            dealSchema: dealSchema,
            usageType: dealSchema.usage_type || null,
            usagePlatforms: dealSchema.usage_platforms || [dealSchema.platform || 'Instagram'],
            usageDuration: dealSchema.usage_duration || null,
            paidAdsAllowed: dealSchema.paid_ads_allowed || null,
            whitelistingAllowed: dealSchema.whitelisting_allowed || null,
            exclusivityEnabled: dealSchema.exclusivity_enabled || false,
            exclusivityCategory: dealSchema.exclusivity_category || null,
            exclusivityDuration: dealSchema.exclusivity_duration || null,
            terminationNoticeDays: dealSchema.termination_notice_days || null,
            jurisdictionCity: dealSchema.jurisdiction_city || null,
            additionalTerms: dealSchema.additional_terms || null,
          };

          // Generate contract
          const contractResult = await generateContractFromScratch(contractRequest);

          // Upload contract DOCX to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('creator-assets')
            .upload(
              `contracts/${deal.id}/${contractResult.fileName}`,
              contractResult.contractDocx,
              {
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                upsert: true
              }
            );

          if (!uploadError && uploadData) {
            // Get public URL
            const { data: urlData } = await supabase.storage
              .from('creator-assets')
              .getPublicUrl(uploadData.path);

            // Update deal with contract info
            await supabase
              .from('brand_deals')
              .update({
                contract_file_url: urlData.publicUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', tokenData.deal_id);

            contractGenerated = true;
            console.log('[BrandResponse] Contract auto-generated successfully');

            // Track analytics
            try {
              await supabase
                .from('analytics_events')
                .insert({
                  event_type: 'contract_auto_generated',
                  deal_id: tokenData.deal_id,
                  creator_id: deal.creator_id,
                  metadata: {
                    status: status,
                    requires_confirmation: false
                  },
                  created_at: new Date().toISOString()
                });
            } catch (analyticsError) {
              console.error('[BrandResponse] Analytics tracking failed (non-fatal):', analyticsError);
            }

            // Send email to brand (async, don't wait)
            if (deal.brand_email) {
              try {
                const { sendBrandFormSubmissionEmail } = await import('../services/brandFormSubmissionEmailService.js');
                await sendBrandFormSubmissionEmail(
                  deal.brand_email,
                  deal.brand_name || 'Brand',
                  {
                    brandName: deal.brand_name || 'Brand',
                    dealAmount: deal.deal_amount || 0,
                    deliverables: deliverablesList,
                  },
                  tokenData.deal_id
                );
              } catch (emailError) {
                console.error('[BrandResponse] Email sending failed (non-fatal):', emailError);
              }
            }
          } else {
            console.error('[BrandResponse] Contract upload failed:', uploadError);
          }
        } else {
          console.error('[BrandResponse] Creator not found for contract generation');
        }
      } catch (contractError: any) {
        console.error('[BrandResponse] Contract auto-generation failed (non-fatal):', contractError);
        // Don't fail the response if contract generation fails
      }
    } else if (requiresConfirmation) {
      // Track analytics for clarification required
      try {
        await supabase
          .from('analytics_events')
          .insert({
            event_type: 'contract_alignment_required',
            deal_id: tokenData.deal_id,
            creator_id: deal.creator_id,
            metadata: {
              status: status,
              requires_confirmation: true
            },
            created_at: new Date().toISOString()
          });
      } catch (analyticsError) {
        console.error('[BrandResponse] Analytics tracking failed (non-fatal):', analyticsError);
      }

      // Update contract status to AwaitingClarification
      await supabase
        .from('brand_deals')
        .update({
          contract_status: 'AwaitingClarification',
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.deal_id);
    }

    // If OTP verified, trigger invoice generation
    if (status === 'accepted_verified') {
      try {
        const { generateInvoice } = await import('../services/invoiceService.js');
        console.log('[BrandResponse] Generating invoice for OTP-verified deal...');
        await generateInvoice(tokenData.deal_id);
        console.log('[BrandResponse] Invoice generated successfully');
      } catch (invoiceError: any) {
        console.error('[BrandResponse] Invoice generation failed (non-fatal):', invoiceError.message);
        // Don't fail the response if invoice generation fails
      }
    }

    return res.json({
      success: true,
      message: 'Brand response saved successfully',
      status: status,
      contract_generated: contractGenerated,
      requires_confirmation: requiresConfirmation
    });

  } catch (error: any) {
    console.error('[BrandResponse] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Debug endpoint to check token existence (dev only)
router.get('/debug/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Debug endpoint disabled in production' });
  }

  try {
    console.log('[BrandResponse] DEBUG Checking token:', token);

    const { data: tokenData, error: tokenError } = await supabase
      .from('brand_reply_tokens')
      .select('id, deal_id, is_active, expires_at, revoked_at, created_at')
      .eq('id', token.trim())
      .maybeSingle();

    const { data: deal, error: dealError } = tokenData ? await supabase
      .from('brand_deals')
      .select('id, brand_name, status')
      .eq('id', tokenData.deal_id)
      .maybeSingle() : { data: null, error: null };

    return res.json({
      token: token.trim(),
      tokenData: tokenData || null,
      tokenError: tokenError ? {
        code: tokenError.code,
        message: tokenError.message
      } : null,
      deal: deal || null,
      dealError: dealError ? {
        code: dealError.code,
        message: dealError.message
      } : null
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Debug check failed',
      message: error.message
    });
  }
});

export default router;
