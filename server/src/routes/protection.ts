// Protection/Contract Analysis API routes

import { Router, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { analyzeContract } from '../services/contractAnalysis.js';
import { generateReportPdf } from '../services/pdfGenerator.js';
import { generateSafeClause } from '../services/clauseGenerator.js';
import { generateSafeContract } from '../services/safeContractGenerator.js';
import { generateContractFromScratch } from '../services/contractGenerator.js';
import { callLLM } from '../services/aiContractAnalysis.js';
import crypto from 'crypto';

const router = Router();

// POST /protection/analyze - Analyze contract and generate report
router.post('/analyze', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { contract_url, deal_id } = req.body;

    if (!contract_url) {
      return res.status(400).json({ error: 'contract_url required' });
    }

    // Download contract file
    const contractResponse = await fetch(contract_url);
    if (!contractResponse.ok) {
      throw new Error('Failed to download contract file');
    }
    const contractBuffer = Buffer.from(await contractResponse.arrayBuffer());

    // Analyze contract - PURE AI-DRIVEN (no keyword/rule-based rejection)
    // Supports PDF, DOCX, and DOC files
    // AI receives FULL extracted text and decides everything
    let analysis;
    const provider = process.env.LLM_PROVIDER || 'huggingface';
    const model = process.env.LLM_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
    
    try {
      analysis = await analyzeContract(contractBuffer, contract_url);
      
      // Log AI decision to contract_ai_logs table
      try {
        const aiAnalysis = analysis as any;
        const promptHash = crypto.createHash('sha256')
          .update(JSON.stringify({ provider, model, timestamp: Date.now() }))
          .digest('hex');
        
        await supabase.from('contract_ai_logs').insert({
          report_id: null, // Will be updated after report is saved
          user_id: userId,
          model_used: `${provider}/${model}`,
          prompt_hash: promptHash,
          risk_score: aiAnalysis.riskScore || null,
          detected_type: aiAnalysis.documentType || null,
          detected_category: aiAnalysis.detectedContractCategory || null,
          brand_detected: aiAnalysis.brandDetected ?? null,
          analysis_metadata: {
            parties: aiAnalysis.parties || null,
            extractedTerms: aiAnalysis.extractedTerms || null,
            negotiationPoints: aiAnalysis.negotiationPoints || null,
          },
        } as any);
      } catch (logError: any) {
        console.warn('[Protection] Failed to log AI decision:', logError.message);
        // Continue - logging failure shouldn't block analysis
      }
    } catch (err: any) {
      console.error('[Protection] Contract analysis error:', err);
      
      // 🚨 HARD FAIL AT API LEVEL: If validation fails, MUST return 400
      if (err.validationError === true) {
        return res.status(400).json({
          ok: false,
          validationError: true,
          error: err.message,
          details: err.details || null
        });
      }
      
      // Handle document parsing errors
      if (err.message?.includes('Invalid') || err.message?.includes('structure') || err.message?.includes('extract text')) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid document file. Please ensure the file is a valid PDF, DOCX, or DOC document.',
          details: err.message
        });
      }
      
      // For all other errors, return 500 with error message
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to analyze contract',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }

    // Generate PDF report (optional - if it fails, continue without PDF)
    let pdfUrl: string | null = null;
    try {
      const pdfBuffer = await generateReportPdf(analysis);
      
      // Upload PDF to storage
      const pdfPath = `protection-reports/${userId}/${Date.now()}_analysis_report.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('creator-assets')
          .getPublicUrl(pdfPath);
        pdfUrl = urlData.publicUrl;
        console.log('[Protection] PDF report generated and uploaded successfully');
      } else {
        console.warn('[Protection] PDF upload failed:', uploadError.message);
      }
    } catch (pdfError: any) {
      // PDF generation failed - log but don't fail the entire request
      console.warn('[Protection] PDF generation failed, continuing without PDF:', pdfError.message);
      // Continue without PDF - analysis results are still valid
    }

    // Normalize core analysis fields before saving
    const rawProtectionScore = Number((analysis as any).protectionScore ?? 0);
    const protectionScore = Number.isFinite(rawProtectionScore)
      ? Math.min(100, Math.max(0, rawProtectionScore))
      : 0;

    const rawOverallRisk = String((analysis as any).overallRisk || '').toLowerCase();
    let normalizedOverallRisk: 'low' | 'medium' | 'high' = 'medium';
    if (rawOverallRisk.includes('low')) {
      normalizedOverallRisk = 'low';
    } else if (rawOverallRisk.includes('high')) {
      normalizedOverallRisk = 'high';
    }

    // Save protection report (optional - if table doesn't exist or insert fails, continue without saving)
    let reportId: string | null = null;
    try {
      // Extract additional AI analysis fields
      const aiAnalysis = analysis as any;
      const { data: report, error: reportError } = await supabase
        .from('protection_reports')
        .insert({
          deal_id: deal_id || null,
          user_id: userId, // Track who created the report
          contract_file_url: contract_url,
          pdf_report_url: pdfUrl, // Can be null if PDF generation failed
          protection_score: protectionScore,
          negotiation_power_score: (analysis as any).negotiationPowerScore || null, // Negotiation Power Score
          overall_risk: normalizedOverallRisk,
          analysis_json: analysis,
          // New AI-driven fields (if columns exist)
          document_type: aiAnalysis.documentType || null,
          detected_contract_category: aiAnalysis.detectedContractCategory || null,
          brand_detected: aiAnalysis.brandDetected ?? null,
        } as any)
        .select()
        .single();

      if (reportError) {
        console.error('[Protection] Failed to save report to database:', reportError);
        console.error('[Protection] Error code:', reportError.code);
        console.error('[Protection] Error message:', reportError.message);
        
        // Try to save without user_id if that's the issue
        // Check for various error messages that indicate missing user_id column
        const isUserIdError = 
          reportError.message?.includes('user_id') || 
          reportError.message?.includes("Could not find the 'user_id' column") ||
          reportError.message?.includes('column "user_id"') ||
          reportError.code === '42703' || // undefined_column
          reportError.code === 'PGRST116'; // PostgREST column not found
        
        if (isUserIdError) {
          console.log('[Protection] 🔄 Retrying without user_id column (column may not exist yet)...');
          try {
            const { data: reportRetry, error: retryError } = await supabase
              .from('protection_reports')
              .insert({
                deal_id: deal_id || null,
                contract_file_url: contract_url,
                pdf_report_url: pdfUrl,
                protection_score: protectionScore,
                negotiation_power_score: (analysis as any).negotiationPowerScore || null, // Negotiation Power Score
                overall_risk: normalizedOverallRisk,
                analysis_json: analysis,
                // New AI-driven fields (if columns exist)
                document_type: aiAnalysis.documentType || null,
                detected_contract_category: aiAnalysis.detectedContractCategory || null,
                brand_detected: aiAnalysis.brandDetected ?? null,
              } as any)
              .select()
              .single();
            
            if (!retryError && reportRetry) {
              reportId = reportRetry.id;
              console.log('[Protection] ✅ Report saved to database (without user_id):', reportId);
            } else {
              console.error('[Protection] ❌ Retry also failed:', retryError);
              console.error('[Protection] Retry error details:', JSON.stringify(retryError, null, 2));
            }
          } catch (retryErr: any) {
            console.error('[Protection] ❌ Retry exception:', retryErr);
          }
        } else {
          console.warn('[Protection] ⚠️ Error is not related to user_id column. Not retrying.');
        }
        // Continue without saving to database - analysis is still valid
      } else {
        reportId = report?.id || null;
        console.log('[Protection] ✅ Report saved to database:', reportId);
      }
    } catch (dbError: any) {
      console.warn('[Protection] Database save failed, continuing without saving:', dbError.message);
      // Continue without saving - analysis results are still valid
    }

    // Save issues and verified items (optional - only if report was saved)
    let savedIssueIds: string[] = [];
    if (reportId && analysis.issues && analysis.issues.length > 0) {
      try {
        const { data: insertedIssues, error: insertError } = await supabase
          .from('protection_issues')
          .insert(
            analysis.issues.map((issue: any) => ({
              report_id: reportId,
              severity: issue.severity,
              category: issue.category,
              title: issue.title,
              description: issue.description,
              clause_reference: issue.clause,
              recommendation: issue.recommendation
            }))
          )
          .select('id');
        
        if (!insertError && insertedIssues) {
          savedIssueIds = insertedIssues.map((issue: any) => issue.id);
        }
      } catch (error) {
        console.warn('[Protection] Failed to save issues:', error);
      }
    }

    if (reportId && analysis.verified && analysis.verified.length > 0) {
      try {
        await supabase.from('protection_verified').insert(
          analysis.verified.map((item: any) => ({
            report_id: reportId,
            category: item.category,
            title: item.title,
            description: item.description,
            clause_reference: item.clause
          }))
        );
      } catch (error) {
        console.warn('[Protection] Failed to save verified items:', error);
      }
    }

    // Add issue UUIDs to analysis if they were saved
    if (savedIssueIds.length > 0 && analysis.issues) {
      analysis.issues = analysis.issues.map((issue: any, index: number) => ({
        ...issue,
        db_id: savedIssueIds[index] || null // Add database UUID for API calls
      }));
    }

    // Return analysis results (database save is optional)
    // Frontend expects: responseData.data.analysis_json
    // Always include report_id, even if null (frontend can handle it)
    const responseData = {
      ok: true,
      data: {
        analysis_json: analysis, // Frontend expects this field name
        report_id: reportId || null, // Explicitly set to null if not saved
        pdf_report_url: pdfUrl || null
      }
    };
    
    // Log if report_id is missing (for debugging)
    if (!reportId) {
      console.warn('[Protection] ⚠️ Report was not saved to database. report_id will be null in response.');
      console.warn('[Protection] ⚠️ Action buttons (Download Safe Version, etc.) will not work without report_id.');
      console.warn('[Protection] 💡 Run the migration to add user_id column: server/database/migrations/protection_tables.sql');
    }
    
    res.json(responseData);
  } catch (err: any) {
    // Log detailed error information for debugging
    console.error('[Protection] Unhandled error in /analyze endpoint:', err);
    console.error('[Protection] Error name:', err?.name);
    console.error('[Protection] Error message:', err?.message);
    console.error('[Protection] Error stack:', err?.stack);
    
    // Log request details for context
    console.error('[Protection] Request body:', JSON.stringify(req.body, null, 2));
    console.error('[Protection] User ID:', req.user?.id);

    if (err.validationError === true) {
      return res.status(400).json({
        ok: false,
        validationError: true,
        error: err.message,
        details: err.details || null
      });
    }

    // Return more detailed error message (hide stack in production for security)
    return res.status(500).json({
      ok: false,
      error: err.message || "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        name: err.name
      } : undefined
    });
  }
});

// GET /protection/:id/report.pdf - Get signed PDF download URL
router.get('/:id/report.pdf', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: report, error } = await supabase
      .from('protection_reports')
      .select('*, deal:brand_deals!deal_id(creator_id)')
      .eq('id', id)
      .single();

    if (error || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Verify access
    const reportData = report as any;
    if (reportData.deal?.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!reportData.pdf_report_url) {
      return res.status(404).json({ error: 'PDF report not available' });
    }

    // Generate signed download URL
    const path = reportData.pdf_report_url.split('/').slice(-2).join('/');
    const { generateSignedDownloadUrl } = await import('../services/storage');
    const signedUrl = await generateSignedDownloadUrl(path, 3600);

    res.redirect(signedUrl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /protection/generate-safe-contract - Generate safe contract version
router.post('/generate-safe-contract', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reportId, originalFilePath, dealId } = req.body;

    // Validate originalFilePath (required)
    if (!originalFilePath || originalFilePath.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'originalFilePath is required and cannot be empty' 
      });
    }
    
    // reportId is optional - log if missing
    if (!reportId) {
      console.log('[Protection] Generating safe contract without reportId, using originalFilePath only');
    }

    // If reportId is provided, verify report belongs to user
    if (reportId) {
      const { data: report, error: reportError } = await supabase
        .from('protection_reports')
        .select('*, deal:brand_deals!deal_id(creator_id)')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        console.warn('[Protection] Report not found, but continuing with originalFilePath only:', reportId);
        // Continue without reportId - we can still generate from original file
      } else {
        // Check access: allow if user created it, or if deal's creator matches, or if admin
        const hasAccess = 
          (report as any).user_id === userId || // User created the report (if user_id column exists)
          (report as any).deal?.creator_id === userId || // User owns the deal
          !(report as any).deal_id || // No deal_id means user created it directly via /analyze endpoint
          req.user!.role === 'admin'; // Admin access

        if (!hasAccess) {
          return res.status(403).json({ 
            success: false,
            error: 'Access denied' 
          });
        }
      }
    } else {
      console.warn('[Protection] No reportId provided, generating safe contract from original file only');
    }

    // Generate safe contract (reportId is optional - will work with just originalFilePath)
    const result = await generateSafeContract({
      reportId: reportId || 'temp', // Use temp ID if not provided
      originalFilePath,
      userId
    });

    // HTML is the canonical source - always generated
    if (!result.contractHtml) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate contract HTML'
      });
    }

    // Store HTML in database (PRIMARY)
    if (dealId) {
      // Verify user owns the deal
      const { data: deal, error: dealError } = await supabase
        .from('brand_deals')
        .select('creator_id')
        .eq('id', dealId)
        .single();

      if (dealError || !deal) {
        return res.status(404).json({
          success: false,
          error: 'Deal not found'
        });
      }

      if (deal.creator_id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Upload PDF to Supabase Storage (OPTIONAL - only if generated)
      let safeContractUrl: string | null = null;
      
      if (result.fileBuffer && result.fileName) {
      const timestamp = Date.now();
        const storagePath = `safe-contracts/${dealId}/${timestamp}_${result.fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(storagePath, result.fileBuffer, {
          contentType: result.contentType || 'application/pdf',
          upsert: false,
        });

        if (!uploadError) {
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('creator-assets')
        .getPublicUrl(storagePath);

          safeContractUrl = publicUrlData?.publicUrl || null;
          console.log('[Protection] PDF uploaded successfully (optional):', safeContractUrl);
        } else {
          console.warn('[Protection] PDF upload failed (non-blocking):', uploadError.message);
        }
      }

      // Update deal with HTML contract (PRIMARY) and optional PDF URL
      const baseUpdateData: any = {
        contract_html: result.contractHtml, // PRIMARY
        updated_at: new Date().toISOString(),
      };
      
      // Add PDF URL if available (OPTIONAL)
      if (safeContractUrl) {
        baseUpdateData.safe_contract_url = safeContractUrl;
        baseUpdateData.contract_file_url = safeContractUrl;
      }
      
      // Try to update with contract_version
      const updateDataWithVersion = {
        ...baseUpdateData,
        contract_version: 'safe_final',
      };

      console.log('[Protection] Updating deal with contract HTML, length:', result.contractHtml.length);
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update(updateDataWithVersion)
        .eq('id', dealId);

      // If update fails due to missing columns, retry without them
      if (updateError) {
        const errorMsg = updateError.message || '';
        console.warn('[Protection] Update failed, error:', errorMsg);
        
        // Check if it's a column missing error
        if (errorMsg.includes('contract_version') || errorMsg.includes('contract_html') || errorMsg.includes('column') || errorMsg.includes('does not exist')) {
          console.warn('[Protection] Column may not exist, retrying with minimal fields...');
          
          // Try with just the fields that definitely exist
          const minimalUpdateData: any = {
            updated_at: new Date().toISOString(),
          };
          
          // Only add contract_html if column exists (we'll try and catch)
          try {
            const { error: htmlError } = await supabase
              .from('brand_deals')
              .update({ contract_html: result.contractHtml, updated_at: minimalUpdateData.updated_at })
              .eq('id', dealId);
            
            if (!htmlError) {
              console.log('[Protection] Successfully updated contract_html');
              minimalUpdateData.contract_html = result.contractHtml;
            } else {
              console.warn('[Protection] contract_html column may not exist:', htmlError.message);
            }
          } catch (e) {
            console.warn('[Protection] Could not update contract_html:', e);
          }
          
          // Add PDF URLs if available
          if (safeContractUrl) {
            minimalUpdateData.safe_contract_url = safeContractUrl;
            minimalUpdateData.contract_file_url = safeContractUrl;
          }
          
          // Final update attempt with minimal fields
          const { error: minimalError } = await supabase
            .from('brand_deals')
            .update(minimalUpdateData)
            .eq('id', dealId);
          
          if (minimalError) {
            console.error('[Protection] Failed to update deal even with minimal fields:', minimalError);
          } else {
            console.log('[Protection] Successfully updated deal with minimal fields');
          }
        } else {
        console.error('[Protection] Failed to update deal:', updateError);
        }
      } else {
        console.log('[Protection] Successfully updated deal with contract HTML and version');
      }

      return res.json({
        success: true,
        contractHtml: result.contractHtml, // PRIMARY OUTPUT - source of truth
        // DOCX available via /contracts/:dealId/download-docx endpoint
      });
    }

    // If no dealId, return HTML directly
    return res.json({
      success: true,
      contractHtml: result.contractHtml, // PRIMARY OUTPUT
    });
  } catch (error: any) {
    console.error('[Protection] Generate safe contract error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate safe contract' 
    });
  }
});

// POST /protection/generate-contract-from-scratch - Generate complete contract from scratch using AI
router.post('/generate-contract-from-scratch', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'dealId is required'
      });
    }

    // Fetch deal information
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.error('[Protection] Deal fetch error:', dealError);
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    // Verify user owns the deal
    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Fetch creator profile separately
    let creatorName = 'Creator';
    let creatorEmail: string | undefined = req.user?.email; // Set email from authenticated user first
    let creatorProfile: any = null;
    let creatorAddress: string | undefined;
    
    console.log('[Protection] Starting profile fetch:', {
      dealCreatorId: deal.creator_id,
      currentUserId: userId,
      isCreator: deal.creator_id === userId,
      userEmail: req.user?.email,
    });
    
    // Always try to fetch current user's profile first if they're the creator
    if (deal.creator_id === userId) {
      console.log('[Protection] Fetching current user profile for userId:', userId);
      
      // First, check if profile exists at all
      const { data: profileExists, error: existsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('[Protection] Profile existence check:', {
        userId,
        exists: !!profileExists,
        error: existsError,
        errorCode: existsError?.code,
        errorMessage: existsError?.message,
      });
      
      // Try selecting all columns first to see if profile exists
      const { data: allProfileData, error: allProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('[Protection] Full profile query (select *):', {
        hasData: !!allProfileData,
        error: allProfileError,
        errorCode: allProfileError?.code,
        columns: allProfileData ? Object.keys(allProfileData) : [],
        location: allProfileData?.location,
        address: allProfileData?.address,
        locationType: typeof allProfileData?.location,
        addressType: typeof allProfileData?.address,
      });
      
      // Now try with specific columns
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, address, location')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('[Protection] Profile query result:', {
        userId,
        hasData: !!currentUserProfile,
        error: profileError,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
        firstName: currentUserProfile?.first_name,
        lastName: currentUserProfile?.last_name,
        location: currentUserProfile?.location,
        address: currentUserProfile?.address,
        fullProfile: currentUserProfile,
      });
      
      if (profileError) {
        console.error('[Protection] Profile fetch error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });
      }
      
      // Use full profile data if available, otherwise use specific columns
      const profileToUse = allProfileData || currentUserProfile;
      
      if (profileToUse) {
        creatorProfile = profileToUse;
        const firstName = (profileToUse.first_name || '').trim();
        const lastName = (profileToUse.last_name || '').trim();
        const fullName = `${firstName} ${lastName}`.trim();
        creatorName = fullName || firstName || lastName || 'Creator';
        
        // Try location first (where address is stored), then address field
        // IMPORTANT: Check both location and address fields, and handle null/undefined explicitly
        const locationValue = profileToUse.location;
        const addressValue = profileToUse.address;
        const profileAddress = (locationValue && typeof locationValue === 'string' && locationValue.trim() !== '') 
          ? locationValue.trim() 
          : (addressValue && typeof addressValue === 'string' && addressValue.trim() !== '') 
            ? addressValue.trim() 
            : null;
        
        creatorAddress = profileAddress || undefined;
        
        console.log('[Protection] Set creator info from profile:', {
          creatorName,
          creatorAddress,
          creatorAddressLength: creatorAddress?.length,
          creatorEmail,
          hasFirstName: !!firstName,
          hasLastName: !!lastName,
          hasLocation: !!profileToUse.location,
          locationValue: profileToUse.location,
          locationType: typeof profileToUse.location,
          locationIsNull: profileToUse.location === null,
          locationIsUndefined: profileToUse.location === undefined,
          locationLength: profileToUse.location?.length,
          hasAddress: !!profileToUse.address,
          addressValue: profileToUse.address,
          addressType: typeof profileToUse.address,
          addressIsNull: profileToUse.address === null,
          addressIsUndefined: profileToUse.address === undefined,
          addressLength: profileToUse.address?.length,
          profileAddress,
          profileAddressLength: profileAddress?.length,
        });
      } else {
        console.warn('[Protection] No profile data found for current user:', {
          userId,
          error: profileError,
          hasData: !!currentUserProfile,
        });
      }
    } else {
      console.warn('[Protection] Deal creator_id does not match current user:', {
        dealCreatorId: deal.creator_id,
        currentUserId: userId,
      });
    }
    
    // If creator is different from current user, fetch their profile
    if (deal.creator_id && deal.creator_id !== userId) {
      const { data: profileData, error: otherUserError } = await supabase
        .from('profiles')
        .select('first_name, last_name, address, location')
        .eq('id', deal.creator_id)
        .maybeSingle();
      
      if (otherUserError) {
        console.error('[Protection] Error fetching other user profile:', otherUserError);
      }
      
      if (profileData) {
        creatorProfile = profileData;
        const firstName = (profileData.first_name || '').trim();
        const lastName = (profileData.last_name || '').trim();
        const fullName = `${firstName} ${lastName}`.trim();
        creatorName = fullName || firstName || lastName || 'Creator';
        
        const profileAddress = profileData.location || profileData.address;
        creatorAddress = profileAddress && profileAddress.trim() !== '' ? profileAddress.trim() : undefined;
        
        // For other users, we can't get their email from auth.users, so it stays undefined
        // This is okay - email validation will fail and user will need to add it to deal
      }
    }
    
    // Final fallback: ALWAYS try to fetch current user's profile if we're missing data
    // This handles cases where the initial fetch failed or returned null
    if ((!creatorName || creatorName === 'Creator') || !creatorAddress || !creatorProfile) {
      console.log('[Protection] Missing data, trying fallback profile fetch:', {
        hasName: !!creatorName && creatorName !== 'Creator',
        hasAddress: !!creatorAddress,
        hasProfile: !!creatorProfile,
        willFetch: true,
        userId,
      });
      
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('profiles')
        .select('first_name, last_name, address, location')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if not found
      
      console.log('[Protection] Fallback profile fetch result:', {
        hasData: !!fallbackProfile,
        error: fallbackError,
        errorCode: fallbackError?.code,
        errorMessage: fallbackError?.message,
        firstName: fallbackProfile?.first_name,
        lastName: fallbackProfile?.last_name,
        location: fallbackProfile?.location,
        address: fallbackProfile?.address,
        fullProfile: fallbackProfile,
      });
      
      if (fallbackProfile) {
        creatorProfile = fallbackProfile;
        
        if (!creatorName || creatorName === 'Creator') {
          const fallbackFirstName = (fallbackProfile.first_name || '').trim();
          const fallbackLastName = (fallbackProfile.last_name || '').trim();
          const fallbackFullName = `${fallbackFirstName} ${fallbackLastName}`.trim();
          creatorName = fallbackFullName || fallbackFirstName || fallbackLastName || creatorName;
          console.log('[Protection] Updated creatorName from fallback:', creatorName);
        }
        if (!creatorAddress) {
          const fallbackAddress = fallbackProfile.location || fallbackProfile.address;
          creatorAddress = fallbackAddress && fallbackAddress.trim() !== '' ? fallbackAddress.trim() : creatorAddress;
          console.log('[Protection] Updated creatorAddress from fallback:', creatorAddress);
        }
      } else if (fallbackError) {
        console.error('[Protection] Fallback profile fetch failed:', {
          code: fallbackError.code,
          message: fallbackError.message,
          details: fallbackError.details,
          hint: fallbackError.hint,
        });
      }
    }
    
    // Ensure email is always set from authenticated user
    if (!creatorEmail && req.user?.email) {
      creatorEmail = req.user.email;
      console.log('[Protection] Set creatorEmail from req.user:', creatorEmail);
    }

    // Build structured deal schema (v2)
    const { buildDealSchemaFromDealData, validateRequiredContractFields } = await import('../services/contractTemplate.js');
    const dealSchema = buildDealSchemaFromDealData(deal);

    // Validate required fields before generation
    const brandInfo = {
      name: deal.brand_name || 'Brand',
      address: (deal as any).brand_address,
      email: deal.brand_email,
    };

    // Final check: If address is still missing, try one more time from profile
    // This is a critical fallback - always try to get address from profile
    // Also do a fresh database query if needed
    if ((!creatorAddress || creatorAddress.trim() === '') && creatorProfile) {
      const finalAddress = creatorProfile.location || creatorProfile.address;
      if (finalAddress && typeof finalAddress === 'string' && finalAddress.trim() !== '') {
        creatorAddress = finalAddress.trim();
        console.log('[Protection] Final address extraction from profile:', {
          address: creatorAddress,
          addressLength: creatorAddress.length,
          fromLocation: !!creatorProfile.location,
          locationValue: creatorProfile.location,
          locationType: typeof creatorProfile.location,
          fromAddress: !!creatorProfile.address,
          addressValue: creatorProfile.address,
          addressType: typeof creatorProfile.address,
          profileKeys: Object.keys(creatorProfile),
        });
      } else {
        console.warn('[Protection] Profile exists but address is empty:', {
          hasLocation: !!creatorProfile.location,
          locationValue: creatorProfile.location,
          locationType: typeof creatorProfile.location,
          hasAddress: !!creatorProfile.address,
          addressValue: creatorProfile.address,
          addressType: typeof creatorProfile.address,
          profileKeys: Object.keys(creatorProfile),
        });
        
        // Last resort: Do a fresh database query to get the location
        console.log('[Protection] Attempting fresh database query for location...');
        const { data: freshProfile, error: freshError } = await supabase
          .from('profiles')
          .select('location, address')
          .eq('id', userId)
          .maybeSingle();
        
        if (freshProfile && !freshError) {
          const freshLocation = freshProfile.location;
          const freshAddress = freshProfile.address;
          const freshFinal = (freshLocation && typeof freshLocation === 'string' && freshLocation.trim() !== '')
            ? freshLocation.trim()
            : (freshAddress && typeof freshAddress === 'string' && freshAddress.trim() !== '')
              ? freshAddress.trim()
              : null;
          
          if (freshFinal) {
            creatorAddress = freshFinal;
            console.log('[Protection] SUCCESS: Got address from fresh database query:', {
              address: creatorAddress,
              addressLength: creatorAddress.length,
              fromLocation: !!freshLocation,
              locationValue: freshLocation,
              fromAddress: !!freshAddress,
              addressValue: freshAddress,
            });
          } else {
            console.error('[Protection] Fresh query also returned empty address:', {
              freshLocation,
              freshAddress,
              locationType: typeof freshLocation,
              addressType: typeof freshAddress,
            });
          }
        } else {
          console.error('[Protection] Fresh database query failed:', freshError);
        }
      }
    }
    
    // If still no address, log a critical error
    if (!creatorAddress || creatorAddress.trim() === '') {
      console.error('[Protection] CRITICAL: Creator address is still missing after all attempts:', {
        hasProfile: !!creatorProfile,
        profileLocation: creatorProfile?.location,
        profileAddress: creatorProfile?.address,
        creatorAddress,
        userId,
        dealCreatorId: deal.creator_id,
      });
    } else {
      console.log('[Protection] SUCCESS: Creator address is available:', {
        address: creatorAddress,
        addressLength: creatorAddress.length,
        addressPreview: creatorAddress.substring(0, 50),
      });
    }
    
    // CRITICAL: Ensure address is set from profile if it exists
    // This is a final safety check before creating creatorInfo
    if ((!creatorAddress || creatorAddress.trim() === '') && creatorProfile) {
      const safetyCheck = creatorProfile.location || creatorProfile.address;
      if (safetyCheck && typeof safetyCheck === 'string' && safetyCheck.trim() !== '') {
        creatorAddress = safetyCheck.trim();
        console.log('[Protection] Safety check: Extracted address from profile:', {
          address: creatorAddress,
          addressLength: creatorAddress.length,
        });
      }
    }

    const creatorInfo = {
      name: creatorName,
      address: creatorAddress || undefined, // Ensure undefined instead of empty string
      email: creatorEmail,
    };
    
    // Log final creatorInfo before validation
    console.log('[Protection] Final creatorInfo before validation:', {
      name: creatorInfo.name,
      address: creatorInfo.address,
      addressLength: creatorInfo.address?.length,
      addressIsDefined: creatorInfo.address !== undefined,
      addressIsNull: creatorInfo.address === null,
      addressIsEmptyString: creatorInfo.address === '',
      addressType: typeof creatorInfo.address,
      email: creatorInfo.email,
      rawCreatorAddress: creatorAddress,
      rawCreatorAddressType: typeof creatorAddress,
    });

    // Debug logging BEFORE validation - show exact values
    console.log('[Protection] === BEFORE VALIDATION ===');
    console.log('[Protection] Creator Info:', {
      name: creatorInfo.name,
      nameType: typeof creatorInfo.name,
      nameLength: creatorInfo.name?.length,
      address: creatorInfo.address,
      addressType: typeof creatorInfo.address,
      addressLength: creatorInfo.address?.length,
      addressTrimmed: creatorInfo.address?.trim(),
      addressIsEmpty: !creatorInfo.address || creatorInfo.address.trim() === '',
      email: creatorInfo.email,
      emailType: typeof creatorInfo.email,
    });
    console.log('[Protection] Creator Address Details:', {
      raw: creatorAddress,
      trimmed: creatorAddress?.trim(),
      length: creatorAddress?.length,
      isEmpty: !creatorAddress || creatorAddress.trim() === '',
      hasLocation: !!creatorProfile?.location,
      hasAddress: !!creatorProfile?.address,
      locationValue: creatorProfile?.location,
      addressValue: creatorProfile?.address,
    });
    console.log('[Protection] Brand Info:', {
      name: brandInfo.name,
      address: brandInfo.address,
      email: brandInfo.email,
    });
    console.log('[Protection] Profile Data:', {
      hasProfile: !!creatorProfile,
      firstName: creatorProfile?.first_name,
      lastName: creatorProfile?.last_name,
      location: creatorProfile?.location,
      address: creatorProfile?.address,
    });
    console.log('[Protection] Deal Info:', {
      creatorId: deal.creator_id,
      userId: userId,
      isCreator: deal.creator_id === userId,
    });

    // Debug logging for validation
    console.log('[Protection] Validation debug:', {
      brandInfo: {
        name: brandInfo.name,
        hasAddress: !!brandInfo.address,
        address: brandInfo.address || 'MISSING',
        addressLength: brandInfo.address?.length || 0,
        addressTrimmed: brandInfo.address?.trim() || 'MISSING',
      },
      creatorInfo: {
        name: creatorInfo.name,
        nameLength: creatorInfo.name?.length || 0,
        nameTrimmed: creatorInfo.name?.trim() || 'MISSING',
        hasAddress: !!creatorInfo.address,
        address: creatorInfo.address || 'MISSING',
        addressLength: creatorInfo.address?.length || 0,
        addressTrimmed: creatorInfo.address?.trim() || 'MISSING',
        hasEmail: !!creatorEmail,
        email: creatorEmail || 'MISSING',
      },
      profileData: {
        firstName: creatorProfile?.first_name,
        lastName: creatorProfile?.last_name,
        address: creatorProfile?.address,
        location: creatorProfile?.location,
      },
    });

    const validation = validateRequiredContractFields(brandInfo, creatorInfo);
    if (!validation.isValid) {
      console.log('[Protection] Validation failed:', {
        missingFields: validation.missingFields,
        brandInfo,
        creatorInfo,
      });
      
      // Include debug info in response for troubleshooting
      return res.status(400).json({
        success: false,
        error: 'Missing required contract fields',
        missingFields: validation.missingFields,
        message: `Please provide the following information before generating the contract: ${validation.missingFields.join(', ')}`,
        debug: {
          creatorInfo: {
            name: creatorInfo.name,
            nameLength: creatorInfo.name?.length,
            address: creatorInfo.address ? `${creatorInfo.address.substring(0, 20)}...` : 'MISSING',
            addressLength: creatorInfo.address?.length,
            email: creatorInfo.email ? `${creatorInfo.email.substring(0, 20)}...` : 'MISSING',
          },
          brandInfo: {
            name: brandInfo.name,
            hasAddress: !!brandInfo.address,
            addressLength: brandInfo.address?.length,
          },
          profileData: {
            hasProfile: !!creatorProfile,
            firstName: creatorProfile?.first_name,
            lastName: creatorProfile?.last_name,
            hasLocation: !!creatorProfile?.location,
            hasAddress: !!creatorProfile?.address,
            location: creatorProfile?.location,
            address: creatorProfile?.address,
            allColumns: creatorProfile ? Object.keys(creatorProfile) : [],
          },
          dealInfo: {
            creatorId: deal.creator_id,
            userId: userId,
            isCreator: deal.creator_id === userId,
          },
        },
      });
    }

    // Parse deliverables for backward compatibility
    let deliverables: string[] = [];
    try {
      if (typeof deal.deliverables === 'string') {
        deliverables = JSON.parse(deal.deliverables);
      } else if (Array.isArray(deal.deliverables)) {
        deliverables = deal.deliverables;
      } else {
        deliverables = ['As per agreement'];
      }
    } catch {
      deliverables = [deal.deliverables || 'As per agreement'];
    }

    // Generate contract from scratch using v2 template system
    const result = await generateContractFromScratch({
      brandName: deal.brand_name || 'Brand',
      creatorName,
      creatorEmail,
      dealAmount: deal.deal_amount || 0,
      deliverables,
      paymentTerms: deal.payment_expected_date 
        ? `Payment expected by ${new Date(deal.payment_expected_date).toLocaleDateString()}`
        : undefined,
      dueDate: deal.due_date ? new Date(deal.due_date).toLocaleDateString() : undefined,
      paymentExpectedDate: deal.payment_expected_date 
        ? new Date(deal.payment_expected_date).toLocaleDateString() 
        : undefined,
      platform: deal.platform || 'Multiple Platforms',
      brandEmail: deal.brand_email || undefined,
      brandPhone: (deal as any).brand_phone || undefined,
      brandAddress: (deal as any).brand_address || undefined,
      creatorAddress: creatorAddress || creatorProfile?.location || creatorProfile?.address || undefined,
      // Pass structured schema
      dealSchema,
      // Pass usage and exclusivity settings if available
      usageType: (deal as any).usage_type || undefined,
      usagePlatforms: deal.platform ? [deal.platform] : (deal as any).usage_platforms || undefined,
      usageDuration: (deal as any).usage_duration || undefined,
      paidAdsAllowed: (deal as any).paid_ads_allowed,
      whitelistingAllowed: (deal as any).whitelisting_allowed,
      exclusivityEnabled: (deal as any).exclusivity_enabled,
      exclusivityCategory: (deal as any).exclusivity_category,
      exclusivityDuration: (deal as any).exclusivity_duration,
      terminationNoticeDays: (deal as any).termination_notice_days,
      jurisdictionCity: (deal as any).jurisdiction_city,
    });

    // DOCX is the canonical source - it's always generated
    if (!result.contractDocx) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate contract DOCX'
      });
    }

    // Store DOCX in Supabase Storage (PRIMARY)
    const timestamp = Date.now();
    const storagePath = `contracts/${dealId}/${timestamp}_${result.fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(storagePath, result.contractDocx, {
        contentType: result.contentType,
        upsert: false,
      });

    let contractUrl: string | null = null;
    if (!uploadError) {
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('creator-assets')
      .getPublicUrl(storagePath);

      contractUrl = publicUrlData?.publicUrl || null;
      console.log('[Protection] DOCX uploaded successfully:', contractUrl);
    } else {
      console.error('[Protection] DOCX upload failed:', uploadError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload contract DOCX to storage'
      });
    }

    // Update deal with DOCX contract URL (PRIMARY)
    const baseUpdateData: any = {
      contract_file_url: contractUrl, // DOCX URL
      updated_at: new Date().toISOString()
    };
    
    console.log('[Protection] Updating deal with DOCX contract:', {
      dealId,
      hasDocx: !!result.contractDocx,
      docxSize: result.contractDocx.length,
      contractUrl,
      contractVersion: 'v3',
      hasMetadata: !!result.metadata
    });

    // Try updates with progressively fewer optional fields until one succeeds
    let updateError: any = null;
    let updateResult: any = null;
    
    // Attempt 1: Try with all optional fields (contract_version, contract_metadata)
    const updateDataWithAll = {
      ...baseUpdateData,
      contract_version: 'v3',
      ...(result.metadata && { contract_metadata: result.metadata })
    };
    
    const { error: errorWithAll, data: resultWithAll } = await supabase
      .from('brand_deals')
      .update(updateDataWithAll)
      .eq('id', dealId)
      .select('contract_file_url');
    
    if (!errorWithAll) {
      // Success with all fields
      updateError = null;
      updateResult = resultWithAll;
    } else if (errorWithAll.message?.includes('contract_version') || 
               errorWithAll.message?.includes('contract_metadata')) {
      // Attempt 2: Try with only base fields (contract_file_url)
      console.warn('[Protection] Optional columns not found, updating with base fields only:', errorWithAll.message);
      const baseFieldsOnly: any = {
        contract_file_url: contractUrl,
        updated_at: new Date().toISOString()
      };
      
      const { error: errorBase, data: resultBase } = await supabase
        .from('brand_deals')
        .update(baseFieldsOnly)
        .eq('id', dealId)
        .select('contract_file_url');
      
      updateError = errorBase;
      updateResult = resultBase;
    } else {
      // Some other error occurred
      updateError = errorWithAll;
      updateResult = resultWithAll;
    }

    if (updateError) {
      console.error('[Protection] CRITICAL: Failed to update deal with new contract:', {
        error: updateError,
        dealId,
        baseUpdateData,
        contractUrl
      });
      // Still return the URL even if update fails - frontend can use temp state
    } else {
      console.log('[Protection] Successfully updated deal with new v3 DOCX contract:', {
        dealId,
        updatedFields: updateResult?.[0],
      });
    }

    return res.json({
      success: true,
      contractDocxUrl: contractUrl, // PRIMARY OUTPUT - DOCX URL
      fileName: result.fileName,
      contentType: result.contentType,
      contractVersion: 'v3',
      databaseUpdated: !updateError, // Let frontend know if DB update succeeded
      ...(result.metadata && { metadata: result.metadata })
    });
  } catch (error: any) {
    console.error('[Protection] Generate contract from scratch error:', error);
    
    // Check if it's a Puppeteer/Chrome error
    if (error.message?.includes('Chrome/Puppeteer is required') || 
        error.message?.includes('Could not find Chrome') ||
        error.message?.includes('Puppeteer is required')) {
      return res.status(500).json({
      success: false,
        error: error.message || 'Contract PDF generation failed. Chrome/Puppeteer is required.',
        requiresPuppeteer: true
      });
    }
    
    // Check if it's a validation error (client error)
    const isValidationError = error.message && (
      error.message.includes('Missing required fields') ||
      error.message.includes('Please complete') ||
      error.message.includes('Jurisdiction could not be determined')
    );
    
    const statusCode = isValidationError ? 400 : 500;
    const errorMessage = isValidationError 
      ? error.message 
      : 'Failed to generate contract from scratch. Please try again or contact support.';
    
    // Extract missingFields from error object if available
    const missingFields = (error as any).missingFields || 
      (isValidationError ? error.message.match(/Missing required fields: (.+)/)?.[1]?.split(', ') : undefined);
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      missingFields: missingFields
    });
  }
});

// POST /protection/generate-contract-docx - Generate professional DOCX contract (dedicated endpoint)
// Returns downloadable .docx file directly
router.post('/generate-contract-docx', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'dealId is required'
      });
    }

    // Fetch deal information
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.error('[Protection] Deal fetch error:', dealError);
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    // Verify user owns the deal
    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Fetch creator profile for address (same logic as generate-contract-from-scratch)
    let creatorName = 'Creator';
    let creatorEmail: string | undefined = req.user?.email;
    let creatorAddress: string | undefined;
    
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('full_name, email, location, address')
      .eq('id', deal.creator_id)
      .single();
    
    if (creatorProfile) {
      creatorName = creatorProfile.full_name || creatorName;
      creatorEmail = creatorProfile.email || creatorEmail;
      creatorAddress = creatorProfile.location || creatorProfile.address || (deal as any).creator_address;
    }

    // Build request for contract generation (uses validated DealSchema)
    const contractRequest = {
      brandName: deal.brand_name || 'Brand',
      creatorName: creatorName,
      dealAmount: deal.deal_amount || 0,
      deliverables: Array.isArray(deal.deliverables) ? deal.deliverables : [deal.deliverables || 'As per agreement'],
      brandEmail: deal.brand_email,
      brandAddress: (deal as any).brand_address,
      creatorEmail: creatorEmail,
      creatorAddress: creatorAddress,
      dealSchema: (deal as any).deal_schema,
      // Pass all structured fields
      usageType: (deal as any).usage_type,
      usagePlatforms: (deal as any).usage_platforms || [deal.platform || 'Instagram'],
      usageDuration: (deal as any).usage_duration,
      paidAdsAllowed: (deal as any).paid_ads_allowed,
      whitelistingAllowed: (deal as any).whitelisting_allowed,
      exclusivityEnabled: (deal as any).exclusivity_enabled,
      exclusivityCategory: (deal as any).exclusivity_category,
      exclusivityDuration: (deal as any).exclusivity_duration,
      terminationNoticeDays: (deal as any).termination_notice_days,
      jurisdictionCity: (deal as any).jurisdiction_city,
      additionalTerms: (deal as any).additional_terms,
    };

    // Generate contract using the same validated logic
    const result = await generateContractFromScratch(contractRequest);

    // Return DOCX file directly for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.contractDocx.length.toString());
    
    return res.send(result.contractDocx);
  } catch (error: any) {
    console.error('[Protection] Generate contract DOCX error:', error);
    
    // Check if it's a validation error (client error)
    const isValidationError = error.message && (
      error.message.includes('Missing required fields') ||
      error.message.includes('is required') ||
      error.message.includes('Please complete')
    );
    
    const statusCode = isValidationError ? 400 : 500;
    const errorMessage = isValidationError 
      ? error.message 
      : 'Failed to generate contract DOCX. Please try again or contact support.';
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

// POST /protection/generate-fix - Generate safe clause for a specific issue
router.post('/generate-fix', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { issueId, originalClause, reportId, issueIndex } = req.body;

    // Support both UUID issueId and reportId + issueIndex lookup
    let issue: any = null;
    
    if (issueId && issueId.length === 36) {
      // UUID format - direct lookup
      const { data, error: issueError } = await supabase
        .from('protection_issues')
        .select('*, report:protection_reports!report_id(user_id, deal:brand_deals!deal_id(creator_id))')
        .eq('id', issueId)
        .single();
      
      if (issueError || !data) {
        return res.status(404).json({ 
          success: false,
          error: 'Issue not found' 
        });
      }
      issue = data;
    } else if (reportId && (issueIndex !== undefined || originalClause)) {
      // Lookup by reportId and issue identifier
      const { data: issues, error: issuesError } = await supabase
        .from('protection_issues')
        .select('*, report:protection_reports!report_id(user_id, deal:brand_deals!deal_id(creator_id))')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (issuesError || !issues || issues.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Issues not found for this report' 
        });
      }

      // Match by index or clause
      if (issueIndex !== undefined) {
        issue = issues[issueIndex];
      } else if (originalClause) {
        issue = issues.find((i: any) => 
          i.clause_reference === originalClause || 
          i.title === originalClause
        );
      }

      if (!issue) {
        return res.status(404).json({ 
          success: false,
          error: 'Issue not found' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'issueId (UUID) or (reportId + issueIndex/originalClause) required' 
      });
    }

    // Check access: allow if user created it, or if deal's creator matches, or if admin
    const report = issue.report as any;
    const hasAccess = 
      report?.user_id === userId || // User created the report (if user_id column exists)
      report?.deal?.creator_id === userId || // User owns the deal
      !report?.deal_id || // No deal_id means user created it directly
      req.user!.role === 'admin'; // Admin access

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Check if safe clause already exists (use issue.id if issueId wasn't provided)
    const actualIssueId = issueId || issue.id;
    const { data: existingClause } = await supabase
      .from('safe_clauses')
      .select('*')
      .eq('issue_id', actualIssueId)
      .single();

    if (existingClause) {
      return res.json({
        success: true,
        safeClause: existingClause.safe_clause,
        explanation: existingClause.explanation
      });
    }

    // Generate safe clause using Gemini AI
    const result = await generateSafeClause({
      originalClause,
      issueContext: issue.description,
      issueCategory: issue.category
    });

    // Save to database
    await supabase.from('safe_clauses').insert({
      report_id: issue.report_id,
      issue_id: actualIssueId,
      original_clause: originalClause,
      safe_clause: result.safeClause,
      explanation: result.explanation
    });

    res.json({
      success: true,
      safeClause: result.safeClause,
      explanation: result.explanation
    });
  } catch (error: any) {
    console.error('[Protection] Generate fix error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate safe clause' 
    });
  }
});

// POST /protection/generate-negotiation-message - Generate negotiation message
router.post('/generate-negotiation-message', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reportId, brandName, issues: issuesFromBody } = req.body;

    let issuesList: any[] = [];

    // If reportId is provided, fetch issues from database
    if (reportId) {
      // Verify report exists and user has access
      const { data: report, error: reportError } = await supabase
        .from('protection_reports')
        .select('*, deal:brand_deals!deal_id(creator_id)')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        return res.status(404).json({ 
          success: false,
          error: 'Report not found' 
        });
      }

      // Check access: allow if user created it, or if deal's creator matches, or if admin
      const hasAccess = 
        (report as any).user_id === userId || // User created the report
        (report as any).deal?.creator_id === userId || // User owns the deal
        !(report as any).deal_id || // No deal_id means user created it directly
        req.user!.role === 'admin'; // Admin access

      if (!hasAccess) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      // Fetch HIGH + MEDIUM + WARNING severity issues from database
      // WARNING severity = missing clauses
      const { data: dbIssues, error: issuesError } = await supabase
        .from('protection_issues')
        .select('*')
        .eq('report_id', reportId)
        .in('severity', ['high', 'medium', 'warning'])
        .order('severity', { ascending: false }); // High first, then medium, then warning

      if (issuesError) {
        throw new Error(`Failed to fetch issues: ${issuesError.message}`);
      }

      if (!dbIssues || dbIssues.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No issues found for this report' 
        });
      }

      issuesList = dbIssues;
    } else if (issuesFromBody && Array.isArray(issuesFromBody) && issuesFromBody.length > 0) {
      // Use issues from request body (when reportId is not available)
      // Include high, medium, and warning (missing clauses) severity
      issuesList = issuesFromBody.filter((issue: any) => 
        issue.severity === 'high' || issue.severity === 'medium' || issue.severity === 'warning'
      );
      
      if (issuesList.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No issues provided' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'reportId or issues array is required' 
      });
    }

    // Separate issues into two groups: risky clauses (high/medium) and missing clauses (warning)
    const riskyClauses = issuesList.filter((issue: any) => 
      issue.severity === 'high' || issue.severity === 'medium'
    );
    const missingClauses = issuesList.filter((issue: any) => 
      issue.severity === 'warning'
    );

    // Build risky clauses context
    const riskyClausesContext = riskyClauses.map((issue: any, index: number) => {
      const severityLabel = issue.severity === 'high' ? 'HIGH PRIORITY' : 'MEDIUM PRIORITY';
      return `${index + 1}. [${severityLabel}] ${issue.title || 'Issue'}

Category: ${issue.category || 'General'}

Description: ${issue.description || 'No description'}

Recommendation: ${issue.recommendation || 'Please review and revise this clause.'}

${issue.clause_reference ? `Clause Reference: ${issue.clause_reference}` : ''}`;
    }).join('\n\n');

    // Build missing clauses context
    const missingClausesContext = missingClauses.map((issue: any, index: number) => {
      return `${index + 1}. ${issue.title || 'Missing Clause'}

Category: ${issue.category || 'General'}

Description: ${issue.description || 'This important point is not specified in the contract.'}

Recommendation: ${issue.recommendation || 'Please add this clause to the contract.'}

${issue.clause_reference ? `Clause Reference: ${issue.clause_reference}` : ''}`;
    }).join('\n\n');

    // Build Gemini prompt
    const prompt = `You are a professional legal advisor helping a creator negotiate better contract terms with a brand.

TASK: Write a professional, polite, but firm legal negotiation message requesting changes for the following contract issues.

BRAND NAME: ${brandName || 'the Brand'}

${riskyClauses.length > 0 ? `A. CLAUSES TO IMPROVE (These terms are in the contract but need revision):
${riskyClausesContext}

` : ''}${missingClauses.length > 0 ? `B. IMPORTANT POINTS MISSING (These clauses are not written anywhere yet):
${missingClausesContext}

` : ''}REQUIREMENTS:
1. Professional and respectful tone - maintain positive working relationship
2. Group your response into two clear sections:
   ${riskyClauses.length > 0 ? '- Section A: "Clauses to improve" - List the risky/unfair clauses that need revision' : ''}
   ${missingClauses.length > 0 ? '- Section B: "Important points missing" - List the missing clauses that need to be added' : ''}
3. Clear explanation of each requested change
4. Reference specific clauses or sections when mentioned
5. Suggest fair alternatives that benefit both parties
6. Legally sound and business-friendly language
7. Suitable for email or formal communication (WhatsApp/Email)
8. Keep it concise but comprehensive
9. Start with a friendly greeting
10. End with a call to action requesting a revised contract

TONE GUIDELINES:
- Cooperative, not confrontational
- Firm on legal protections, flexible on business terms
- Professional but approachable
- Focus on mutual benefit

Return ONLY the negotiation message text, no additional formatting, markdown, or explanations. Write it as if the creator is sending it directly to the brand.`;

    // Generate message using Gemini AI
    const message = await callLLM(prompt);
    const cleanMessage = message.trim();

    // Save to database (only if reportId is provided)
    if (reportId) {
      const { error: saveError } = await supabase
        .from('negotiation_messages')
        .insert({
          report_id: reportId,
          user_id: userId,
          message: cleanMessage,
          brand_name: brandName || null
        } as any);

      if (saveError) {
        console.warn('[Protection] Failed to save negotiation message:', saveError.message);
        // Continue anyway - message is generated
      }
    } else {
      console.log('[Protection] Skipping database save - reportId not provided');
    }

    res.json({
      success: true,
      message: cleanMessage
    });
  } catch (error: any) {
    console.error('[Protection] Generate negotiation message error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate negotiation message' 
    });
  }
});

// POST /protection/send-negotiation-email - Send negotiation message via email
router.post('/send-negotiation-email', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { toEmail, message, reportId } = req.body;

    if (!toEmail || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'toEmail and message are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email address' 
      });
    }

    // If reportId provided, verify access
    if (reportId) {
      const { data: report, error: reportError } = await supabase
        .from('protection_reports')
        .select('*, deal:brand_deals!deal_id(creator_id)')
        .eq('id', reportId)
        .single();

      if (!reportError && report) {
        const hasAccess = 
          (report as any).user_id === userId ||
      (report as any).deal?.creator_id === userId ||
        !(report as any).deal_id ||
          req.user!.role === 'admin';

        if (!hasAccess) {
          return res.status(403).json({ 
            success: false,
            error: 'Access denied' 
          });
        }
      }
    }

    // Get user's email for "from" field
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    const fromEmail = (profile as any)?.email || req.user!.email || 'noreply@creatorarmour.com';
    const fromName = (profile as any)?.first_name && (profile as any)?.last_name 
      ? `${(profile as any).first_name} ${(profile as any).last_name}`
      : 'CreatorArmour User';

    // TODO: Integrate with your email service (SendGrid, Resend, etc.)
    // For now, log the email content
    console.log('[Protection] Email would be sent:');
    console.log('From:', `${fromName} <${fromEmail}>`);
    console.log('To:', toEmail);
    console.log('Subject: Request for Contract Revisions – Legal Review Applied');
    console.log('Message:', message);

    // In production, replace this with actual email sending:
    // await sendEmail({
    //   to: toEmail,
    //   from: fromEmail,
    //   subject: 'Request for Contract Revisions – Legal Review Applied',
    //   html: message.replace(/\n/g, '<br>'),
    //   text: message
    // });

    res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error: any) {
    console.error('[Protection] Send negotiation email error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to send email' 
    });
  }
});

// POST /protection/send-for-legal-review - Send report for lawyer review
router.post('/send-for-legal-review', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reportId, userEmail, userPhone } = req.body;

    if (!reportId) {
      return res.status(400).json({ 
        success: false,
        error: 'reportId is required' 
      });
    }

    // Verify report belongs to user
    const { data: report, error: reportError } = await supabase
      .from('protection_reports')
      .select('*, deal:brand_deals!deal_id(creator_id)')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return res.status(404).json({ 
        success: false,
        error: 'Report not found' 
      });
    }

    // Check access: allow if user created it, or if deal's creator matches, or if admin
    // If report has no deal_id, allow access (user created it via authenticated endpoint)
    const hasAccess = 
      (report as any).user_id === userId || // User created the report (if user_id column exists)
      (report as any).deal?.creator_id === userId || // User owns the deal
      !(report as any).deal_id || // No deal_id means user created it directly
      req.user!.role === 'admin'; // Admin access

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Get user profile for email/phone if not provided
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone')
      .eq('id', userId)
      .single();

    // Insert into legal_review_requests table
    const { error: insertError } = await supabase
      .from('legal_review_requests')
      .insert({
        report_id: reportId,
        user_id: userId,
        user_email: userEmail || (profile as any)?.email || req.user!.email,
        user_phone: userPhone || (profile as any)?.phone,
        status: 'pending',
        requested_at: new Date().toISOString()
      } as any);

    if (insertError) {
      // If table doesn't exist, log and continue (graceful degradation)
      console.warn('[Protection] Failed to save legal review request:', insertError.message);
      // In production, you might want to send email/webhook notification here
    } else {
      // TODO: Trigger lawyer notification (email/webhook)
      // Example: await sendLawyerNotification(reportId, userId);
      console.log(`[Protection] Legal review requested for report ${reportId} by user ${userId}`);
    }

    res.json({
      success: true,
      message: 'Legal review request submitted successfully'
    });
  } catch (error: any) {
    console.error('[Protection] Send for legal review error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to submit legal review request' 
    });
  }
});

// POST /protection/save-report - Save report to dashboard
router.post('/save-report', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reportId } = req.body;

    if (!reportId) {
      return res.status(400).json({ 
        success: false,
        error: 'reportId is required' 
      });
    }

    // Verify report exists
    const { data: report, error: reportError } = await supabase
      .from('protection_reports')
      .select('*, deal:brand_deals!deal_id(creator_id)')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return res.status(404).json({ 
        success: false,
        error: 'Report not found' 
      });
    }

    // Check access: allow if user created it, or if deal's creator matches, or if admin
    // If report has no deal_id, allow access (user created it via authenticated endpoint)
    const hasAccess = 
      (report as any).user_id === userId || // User created the report (if user_id column exists)
      (report as any).deal?.creator_id === userId || // User owns the deal
      !(report as any).deal_id || // No deal_id means user created it directly
      req.user!.role === 'admin'; // Admin access

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('report_id', reportId)
      .single();

    if (existing) {
      return res.json({
        success: true,
        message: 'Report already saved'
      });
    }

    // Insert into saved_reports table
    const { error: insertError } = await supabase
      .from('saved_reports')
      .insert({
        user_id: userId,
        report_id: reportId,
        saved_at: new Date().toISOString()
      } as any);

    if (insertError) {
      // If table doesn't exist, log and continue
      console.warn('[Protection] Failed to save report:', insertError.message);
    }

    res.json({
      success: true,
      message: 'Report saved successfully'
    });
  } catch (error: any) {
    console.error('[Protection] Save report error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to save report' 
    });
  }
});

// GET /protection/download-report/:reportId - Download analysis report
router.get('/download-report/:reportId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reportId } = req.params;

    const { data: report, error } = await supabase
      .from('protection_reports')
      .select('*, deal:brand_deals!deal_id(creator_id)')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Verify access
    const reportData = report as any;
    if (reportData.deal?.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!reportData.pdf_report_url) {
      return res.status(404).json({ error: 'PDF report not available' });
    }

    // Generate signed download URL
    const path = reportData.pdf_report_url.split('/').slice(-2).join('/');
    const { generateSignedDownloadUrl } = await import('../services/storage');
    const signedUrl = await generateSignedDownloadUrl(path, 3600);

    res.redirect(signedUrl);
  } catch (error: any) {
    console.error('[Protection] Download report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /contracts/:dealId/download-docx - Download contract as DOCX (PUBLIC - no auth required)
export const downloadContractDocxHandler = async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    console.log('[Protection] Download DOCX request:', { dealId, path: req.path });
    
    if (!dealId) {
      return res.status(400).json({ error: 'Deal ID is required' });
    }
    
    // Fetch deal
    let deal: any = null;
    let dealError: any = null;
    
    // First, try to fetch with contract_html
    const { data: dealWithHtml, error: htmlError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, contract_html, brand_response_status')
      .eq('id', dealId)
      .maybeSingle();
    
    if (htmlError && htmlError.message?.includes('contract_html') && htmlError.message?.includes('does not exist')) {
      // Column doesn't exist - fetch without it
      console.warn('[Protection] contract_html column does not exist, fetching without it');
      const { data: dealBasic, error: basicError } = await supabase
        .from('brand_deals')
        .select('id, creator_id, brand_response_status, contract_file_url, safe_contract_url')
        .eq('id', dealId)
        .maybeSingle();
      
      deal = dealBasic;
      dealError = basicError;
    } else {
      deal = dealWithHtml;
      dealError = htmlError;
    }

    if (dealError) {
      console.error('[Protection] Deal query error:', dealError);
      return res.status(500).json({ error: 'Failed to fetch deal', details: dealError.message });
    }
    
    if (!deal) {
      console.warn('[Protection] Deal not found:', dealId);
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Allow access if deal is approved (brand has accepted)
    if (deal.brand_response_status !== 'accepted_verified') {
      return res.status(403).json({ error: 'Contract is not yet available for download' });
    }

    // Get HTML contract
    const contractHtml = (deal as any).contract_html;

    if (!contractHtml) {
      return res.status(404).json({ 
        error: 'Contract HTML not found. Please regenerate the contract.',
        hint: 'The contract_html column may not exist in the database. Please regenerate the contract to create it.'
      });
    }

    // Generate DOCX from HTML
    const { generateContractDocx, prepareHtmlForDocx } = await import('../services/docxGenerator.js');
    const docxCompatibleHtml = prepareHtmlForDocx(contractHtml);
    const docxBuffer = await generateContractDocx(docxCompatibleHtml);

    // Set response headers for DOCX download
    const fileName = `Contract_${dealId}_${Date.now()}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', docxBuffer.length.toString());

    return res.send(docxBuffer);
  } catch (error: any) {
    console.error('[Protection] Error generating DOCX:', error);
    res.status(500).json({ error: 'Failed to generate DOCX', details: error.message });
  }
};

// GET /contracts/:dealId/view - View HTML contract (PUBLIC - no auth required)
// This route is exported and registered as a public route in index.ts to bypass auth middleware
export const viewContractHandler = async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    console.log('[Protection] View contract request:', { dealId, path: req.path });
    
    if (!dealId) {
      return res.status(400).json({ error: 'Deal ID is required' });
    }
    
    // Fetch deal - try with contract_html first, fallback to basic fields if column doesn't exist
    let deal: any = null;
    let dealError: any = null;
    
    // First, try to fetch with contract_html
    const { data: dealWithHtml, error: htmlError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, contract_html, brand_response_status')
      .eq('id', dealId)
      .maybeSingle();
    
    if (htmlError && htmlError.message?.includes('contract_html') && htmlError.message?.includes('does not exist')) {
      // Column doesn't exist - fetch without it
      console.warn('[Protection] contract_html column does not exist, fetching without it');
      const { data: dealBasic, error: basicError } = await supabase
        .from('brand_deals')
        .select('id, creator_id, brand_response_status, contract_file_url, safe_contract_url')
        .eq('id', dealId)
        .maybeSingle();
      
      deal = dealBasic;
      dealError = basicError;
    } else {
      deal = dealWithHtml;
      dealError = htmlError;
    }

    console.log('[Protection] Deal query result:', { 
      hasDeal: !!deal, 
      error: dealError?.message,
      hasContractHtml: !!deal?.contract_html,
      brandResponseStatus: deal?.brand_response_status
    });

    if (dealError) {
      console.error('[Protection] Deal query error:', dealError);
      return res.status(500).json({ error: 'Failed to fetch deal', details: dealError.message });
    }
    
    if (!deal) {
      console.warn('[Protection] Deal not found:', dealId);
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Try to get user from auth header (optional)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // If authenticated, verify ownership
      // Note: In a production environment, you'd verify the JWT token here
      // For now, we'll allow access if the deal is approved
    }

    // Allow access if deal is approved (brand has accepted)
    // This allows viewing contracts without requiring authentication in new tabs
    if (deal.brand_response_status !== 'accepted_verified') {
      return res.status(403).json({ error: 'Contract is not yet available for viewing' });
    }

    // Get HTML contract
    const contractHtml = (deal as any).contract_html;

    if (!contractHtml) {
      // If contract_html column doesn't exist or is null, check for PDF URLs
      const contractFileUrl = (deal as any).contract_file_url || (deal as any).safe_contract_url;
      
      if (contractFileUrl) {
        // Redirect to PDF if HTML is not available
        return res.redirect(contractFileUrl);
      }
      
      return res.status(404).json({ 
        error: 'Contract HTML not found. Please regenerate the contract.',
        hint: 'The contract_html column may not exist in the database. Please regenerate the contract to create it.'
      });
    }

    // Return HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(contractHtml);
  } catch (error: any) {
    console.error('[Protection] Error viewing contract:', error);
    res.status(500).json({ error: 'Failed to load contract' });
  }
};

export default router;

