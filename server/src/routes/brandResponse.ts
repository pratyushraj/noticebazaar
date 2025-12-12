// Public Brand Response API - No authentication required
// Allows brands to respond to contract change requests via public link

import { Router, Request, Response } from 'express';
import { supabase, supabaseInitialized } from '../index.js';

const router = Router();

// POST /api/brand-response/:dealId
// Public endpoint - no auth required
router.post('/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const { status, message, brand_team_name } = req.body;

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

    // Get client IP address
    const clientIp = req.ip || 
                     req.headers['x-forwarded-for']?.toString().split(',')[0] || 
                     req.headers['x-real-ip']?.toString() || 
                     req.socket.remoteAddress || 
                     'unknown';

    // Check if deal exists
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, brand_name, status')
      .eq('id', dealId)
      .single();

    if (dealError) {
      console.error('[BrandResponse] POST Error fetching deal:', {
        dealId,
        errorCode: dealError.code,
        errorMessage: dealError.message,
        errorDetails: dealError.details,
        errorHint: dealError.hint
      });
      
      // Check if it's a "not found" error - handle all possible error codes
      const isNotFoundError = 
        dealError.code === 'PGRST116' || 
        dealError.code === '42P01' ||
        (dealError as any).status === 404 ||
        dealError.message?.includes('No rows') ||
        dealError.message?.includes('not found') ||
        dealError.message?.includes('does not exist') ||
        dealError.message?.includes('could not find') ||
        dealError.message?.toLowerCase().includes('no rows returned');
      
      if (isNotFoundError) {
        return res.status(404).json({
          success: false,
          error: 'Deal not found'
        });
      }
      
      // For other errors, return 500
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch deal information'
      });
    }

    if (!deal) {
      console.warn('[BrandResponse] POST Deal not found:', dealId);
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

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

    // If OTP verified, trigger invoice generation
    if (status === 'accepted_verified') {
      try {
        const { generateInvoice } = await import('../services/invoiceService.js');
        console.log('[BrandResponse] Generating invoice for OTP-verified deal...');
        await generateInvoice(dealId);
        console.log('[BrandResponse] Invoice generated successfully');
      } catch (invoiceError: any) {
        console.error('[BrandResponse] Invoice generation failed (non-fatal):', invoiceError.message);
        // Don't fail the response if invoice generation fails
      }
    }

    if (newDealStatus !== deal.status) {
      updateData.status = newDealStatus;
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(updateData)
      .eq('id', dealId);

    if (updateError) {
      console.error('[BrandResponse] Update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save brand response'
      });
    }

    return res.json({
      success: true,
      message: 'Brand response saved successfully',
      dealId: dealId,
      status: status
    });

  } catch (error: any) {
    console.error('[BrandResponse] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/brand-response/:dealId
// Public endpoint to check current response status and fetch requested changes
router.get('/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;

    if (!dealId || typeof dealId !== 'string' || dealId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid deal ID'
      });
    }

    // Fetch deal with analysis_report_id
    // Use service role key to bypass RLS for public brand response endpoint
    console.log('[BrandResponse] GET Fetching deal:', {
      dealId: dealId.trim(),
      timestamp: new Date().toISOString(),
      supabaseInitialized,
      hasSupabaseClient: !!supabase
    });
    
    if (!supabaseInitialized) {
      console.error('[BrandResponse] GET Supabase not initialized - service role key may be missing');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }
    
    // Fetch deal with all required fields
    // Service role key should bypass RLS
    // Note: Some columns might not exist, so we'll select all and filter what we need
    let { data: deal, error } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId.trim())
      .maybeSingle();
    
    // If no deal found, test service role access and try alternative queries
    if (!deal && !error) {
      console.log('[BrandResponse] GET Deal not found, testing service role access...');
      
      // Test 1: Can we access the table at all?
      const { data: testDeals, error: testError } = await supabase
        .from('brand_deals')
        .select('id, creator_id, status, brand_name')
        .limit(5);
      
      console.log('[BrandResponse] GET Service role test:', {
        canAccessTable: !testError,
        testError: testError?.message,
        sampleDealsCount: testDeals?.length || 0,
        sampleDealIds: testDeals?.map(d => d.id) || []
      });
      
      // Test 2: Try querying all deals to see if the specific deal exists
      const { data: allDeals, error: allError } = await supabase
        .from('brand_deals')
        .select('id, creator_id, status, brand_name')
        .eq('id', dealId.trim());
      
      console.log('[BrandResponse] GET Direct ID query test:', {
        found: !!allDeals && allDeals.length > 0,
        count: allDeals?.length || 0,
        error: allError?.message,
        deals: allDeals
      });
    }
    
    console.log('[BrandResponse] GET Deal query result:', {
      dealId: dealId.trim(),
      hasData: !!deal,
      dealIdFromData: deal?.id,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint
    });
    
    // If no data and no error, deal doesn't exist
    if (!deal && !error) {
      console.warn('[BrandResponse] GET Deal does not exist in database:', dealId.trim());
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    if (error) {
      console.error('[BrandResponse] GET Error fetching deal:', {
        dealId,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      });
      
      // Check if it's a "not found" error - handle all possible error codes
      const isNotFoundError = 
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.code === '23505' ||
        (error as any).status === 404 ||
        (error as any).statusCode === 404 ||
        error.message?.includes('No rows') ||
        error.message?.includes('not found') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('could not find') ||
        error.message?.toLowerCase().includes('no rows returned') ||
        error.message?.toLowerCase().includes('relation') ||
        error.details?.includes('No rows');
      
      if (isNotFoundError) {
        // Log for debugging
        console.warn('[BrandResponse] GET Deal not found:', {
          dealId,
          errorCode: error.code,
          errorMessage: error.message
        });
        return res.status(404).json({
          success: false,
          error: 'Deal not found'
        });
      }
      
      // For other errors, return 500 with more details in dev
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch deal information',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            code: error.code,
            message: error.message,
            hint: error.hint
          }
        })
      });
    }

    if (!deal) {
      console.warn('[BrandResponse] GET Deal not found (no data returned):', {
        dealId,
        note: 'This could be due to RLS policies or the deal not existing in the database'
      });
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }
    
    console.log('[BrandResponse] GET Deal found:', {
      dealId: deal.id,
      brandName: deal.brand_name,
      responseStatus: deal.brand_response_status
    });

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

    return res.json({
      success: true,
      deal: {
        id: deal.id,
        brand_name: deal.brand_name,
        response_status: deal.brand_response_status || 'pending',
        response_message: deal.brand_response_message,
        response_at: deal.brand_response_at,
        deal_amount: deal.deal_amount || null,
        deliverables: deal.deliverables || null
      },
      requested_changes: requestedChanges,
      analysis_data: analysisData
    });

  } catch (error: any) {
    console.error('[BrandResponse] GET Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Debug endpoint to check deal existence (dev only)
router.get('/debug/:dealId', async (req: Request, res: Response) => {
  const { dealId } = req.params;
  
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Debug endpoint disabled in production' });
  }
  
  try {
    console.log('[BrandResponse] DEBUG Checking deal:', dealId);
    
    // Test 1: Check if Supabase is initialized
    const initStatus = {
      supabaseInitialized,
      hasSupabaseClient: !!supabase
    };
    
    // Test 2: Try to query the deal
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, brand_name, creator_id, status, created_at')
      .eq('id', dealId.trim())
      .maybeSingle();
    
    // Test 3: Check if we can access the table at all
    const { data: allDeals, error: allError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, status, brand_name')
      .limit(5);
    
    // Test 4: Count total deals
    const { count, error: countError } = await supabase
      .from('brand_deals')
      .select('*', { count: 'exact', head: true });
    
    return res.json({
      dealId: dealId.trim(),
      supabaseStatus: initStatus,
      dealQuery: {
        found: !!deal,
        deal: deal || null,
        error: dealError ? {
          code: dealError.code,
          message: dealError.message,
          details: dealError.details
        } : null
      },
      tableAccess: {
        canAccess: !allError,
        sampleDeals: allDeals || [],
        error: allError ? {
          code: allError.code,
          message: allError.message
        } : null
      },
      totalDeals: count,
      countError: countError ? {
        code: countError.code,
        message: countError.message
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

