// AI-powered features API routes
// Includes counter-proposal generation and other AI features

import { Router, Response } from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateAICounterProposal, CounterProposalRequest } from '../services/counterProposalGenerator';

const router = Router();

// POST /api/ai/counter-proposal
// Generate AI-powered counter-proposal for contract negotiations
router.post('/counter-proposal', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      deal_id,
      deal_value,
      issues,
      missing_clauses,
      creator_category,
      brand_response_message,
      previous_negotiation_message,
      tone_preference
    } = req.body;

    // Validate required fields
    if (!deal_id) {
      return res.status(400).json({
        success: false,
        error: 'deal_id is required'
      });
    }

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one issue is required'
      });
    }

    // Fetch deal to get brand_name and verify access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, brand_name, creator_id, deal_amount, brand_response_message')
      .eq('id', deal_id)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    // Verify user has access to this deal
    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Prepare request for counter-proposal generator
    const counterProposalRequest: CounterProposalRequest = {
      deal_value: deal_value || deal.deal_amount,
      issues: issues,
      missing_clauses: missing_clauses || [],
      creator_category: creator_category,
      brand_response_message: brand_response_message || deal.brand_response_message,
      previous_negotiation_message: previous_negotiation_message,
      brand_name: deal.brand_name,
      tone_preference: tone_preference || 'firm'
    };

    // Generate counter-proposal
    const result = await generateAICounterProposal(counterProposalRequest);

    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('[AI Counter-Proposal] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate counter-proposal'
    });
  }
});

export default router;

