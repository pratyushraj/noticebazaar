// Public Brand Response API - No authentication required
// Allows brands to respond to contract change requests via public link

import { Router, Request, Response } from 'express';
import { supabase } from '../index.js';

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
    const validStatuses = ['accepted', 'negotiating', 'rejected'];
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

    if (dealError || !deal) {
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
    if (status === 'accepted') {
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

    // Fetch deal with analysis_report_id
    const { data: deal, error } = await supabase
      .from('brand_deals')
      .select('id, brand_name, brand_response_status, brand_response_message, brand_response_at, analysis_report_id')
      .eq('id', dealId)
      .single();

    if (error || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    // Fetch requested changes (issues + missing clauses) from protection_issues
    let requestedChanges: any[] = [];
    if (deal.analysis_report_id) {
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
    }

    return res.json({
      success: true,
      deal: {
        id: deal.id,
        brand_name: deal.brand_name,
        response_status: deal.brand_response_status || 'pending',
        response_message: deal.brand_response_message,
        response_at: deal.brand_response_at
      },
      requested_changes: requestedChanges
    });

  } catch (error: any) {
    console.error('[BrandResponse] GET Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;

