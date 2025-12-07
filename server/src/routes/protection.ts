// Protection/Contract Analysis API routes

import { Router, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { analyzeContract } from '../services/contractAnalysis.js';
import { generateReportPdf } from '../services/pdfGenerator.js';
import { generateSafeClause } from '../services/clauseGenerator.js';
import { generateSafeContract } from '../services/safeContractGenerator.js';
import { callLLM } from '../services/aiContractAnalysis.js';

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

    // Analyze contract (HARD validation happens inside analyzeContract)
    let analysis;
    try {
      analysis = await analyzeContract(contractBuffer);
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
      
      // Handle PDF parsing errors
      if (err.message?.includes('Invalid PDF') || err.message?.includes('PDF structure')) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid PDF file. Please ensure the file is a valid PDF document.',
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

    // Save protection report (optional - if table doesn't exist, continue without saving)
    let reportId: string | null = null;
    try {
      const { data: report, error: reportError } = await supabase
        .from('protection_reports')
        .insert({
          deal_id: deal_id || null,
          user_id: userId, // Track who created the report
          contract_file_url: contract_url,
          pdf_report_url: pdfUrl, // Can be null if PDF generation failed
          protection_score: analysis.protectionScore,
          negotiation_power_score: analysis.negotiationPowerScore || null, // Negotiation Power Score
          overall_risk: analysis.overallRisk,
          analysis_json: analysis
        })
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
                protection_score: analysis.protectionScore,
                negotiation_power_score: analysis.negotiationPowerScore || null, // Negotiation Power Score
                overall_risk: analysis.overallRisk,
                analysis_json: analysis
              })
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
    const { reportId, originalFilePath } = req.body;

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

    // If file buffer is returned directly, send it as download (bypasses storage upload)
    if (result.fileBuffer) {
      res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName || 'safe-contract.pdf'}"`);
      res.setHeader('Content-Length', result.fileBuffer.length.toString());
      return res.send(result.fileBuffer);
    }

    // Fallback to URL if uploaded to storage
    res.json({
      success: true,
      safeContractUrl: result.safeContractUrl
    });
  } catch (error: any) {
    console.error('[Protection] Generate safe contract error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate safe contract' 
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
        .select('*, report:protection_reports!report_id(deal:brand_deals!deal_id(creator_id))')
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
        .select('*, report:protection_reports!report_id(deal:brand_deals!deal_id(creator_id))')
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

    // Check access
    const report = issue.report as any;
    if (report?.deal?.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Check if safe clause already exists
    const { data: existingClause } = await supabase
      .from('safe_clauses')
      .select('*')
      .eq('issue_id', issueId)
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
      issue_id: issueId,
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

      // Fetch HIGH + MEDIUM severity issues from database
      const { data: dbIssues, error: issuesError } = await supabase
        .from('protection_issues')
        .select('*')
        .eq('report_id', reportId)
        .in('severity', ['high', 'medium'])
        .order('severity', { ascending: false }); // High first, then medium

      if (issuesError) {
        throw new Error(`Failed to fetch issues: ${issuesError.message}`);
      }

      if (!dbIssues || dbIssues.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No high or medium severity issues found for this report' 
        });
      }

      issuesList = dbIssues;
    } else if (issuesFromBody && Array.isArray(issuesFromBody) && issuesFromBody.length > 0) {
      // Use issues from request body (when reportId is not available)
      issuesList = issuesFromBody.filter((issue: any) => 
        issue.severity === 'high' || issue.severity === 'medium'
      );
      
      if (issuesList.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No high or medium severity issues provided' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'reportId or issues array is required' 
      });
    }

    // Build issues context for Gemini prompt
    const issuesContext = issuesList.map((issue: any, index: number) => {
      const severityLabel = issue.severity === 'high' ? 'HIGH PRIORITY' : 'MEDIUM PRIORITY';
      return `${index + 1}. [${severityLabel}] ${issue.title || 'Issue'}

Category: ${issue.category || 'General'}

Description: ${issue.description || 'No description'}

Recommendation: ${issue.recommendation || 'Please review and revise this clause.'}

${issue.clause_reference ? `Clause Reference: ${issue.clause_reference}` : ''}`;
    }).join('\n\n');

    // Build Gemini prompt
    const prompt = `You are a professional legal advisor helping a creator negotiate better contract terms with a brand.

TASK: Write a professional, polite, but firm legal negotiation message requesting changes for the following contract issues.

BRAND NAME: ${brandName || 'the Brand'}

CONTRACT ISSUES REQUIRING REVISION:
${issuesContext}

REQUIREMENTS:
1. Professional and respectful tone - maintain positive working relationship
2. Clear explanation of each requested change
3. Reference specific clauses or sections when mentioned
4. Suggest fair alternatives that benefit both parties
5. Legally sound and business-friendly language
6. Suitable for email or formal communication (WhatsApp/Email)
7. Keep it concise but comprehensive
8. Start with a friendly greeting
9. End with a call to action requesting a revised contract

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

    const fromEmail = (profile as any)?.email || req.user!.email || 'noreply@noticebazaar.com';
    const fromName = (profile as any)?.first_name && (profile as any)?.last_name 
      ? `${(profile as any).first_name} ${(profile as any).last_name}`
      : 'NoticeBazaar User';

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

export default router;

