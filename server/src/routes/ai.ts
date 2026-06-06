// @ts-nocheck
// AI-powered features API routes
// Includes counter-proposal generation and other AI features

import { Router, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { generateAICounterProposal, CounterProposalRequest } from '../services/counterProposalGenerator.js';
import { callLLM } from '../services/aiContractAnalysis.js';

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

// POST /api/ai/pitch
// Generate AI-powered pitch or notice response text
router.post('/pitch', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { input, type, tone } = req.body as {
      input?: string;
      type?: 'pitch' | 'notice';
      tone?: number;
    };
    const userId = req.user!.id;

    if (!input || typeof input !== 'string' || input.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'input is required and must be at least 10 characters'
      });
    }

    const mode = type === 'notice' ? 'notice' : 'pitch';
    const toneValue = typeof tone === 'number' ? Math.max(0, Math.min(100, tone)) : 50;
    const toneLabel = toneValue < 33 ? 'firm' : toneValue > 66 ? 'friendly' : 'neutral';

    const systemPrompt = `
You are an expert creator economy copywriter. Write a clear, persuasive ${mode === 'pitch' ? 'brand collaboration pitch' : 'response to a legal notice'}.

Rules:
- Output only the final text, no markdown, no explanations.
- Keep it under 220 words.
- Use a confident, professional tone.
- Be specific and concrete, avoid fluff.
- Include a short subject line for pitches only.
${mode === 'notice' ? `- Tone should be ${toneLabel}.` : ''}`.trim();

    const userPrompt = `
Context:
${input.trim()}
`.trim();

    const output = await callLLM(`${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY the final text.`);

    if (!output || typeof output !== 'string') {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate response'
      });
    }

    let savedId: string | null = null;
    let savedAt: string | null = null;
    try {
      const { data: saved, error: saveError } = await supabase
        .from('ai_pitch_history')
        .insert({
          user_id: userId,
          type: mode,
          tone: mode === 'notice' ? toneLabel : null,
          input: input.trim(),
          output: output.trim()
        })
        .select('id, created_at')
        .maybeSingle();

      if (!saveError && saved) {
        savedId = saved.id;
        savedAt = saved.created_at;
      } else if (saveError) {
        console.warn('[AI Pitch] Failed to save history:', saveError.message);
      }
    } catch (saveErr: any) {
      console.warn('[AI Pitch] Save exception:', saveErr.message);
    }

    return res.json({
      success: true,
      data: {
        output: output.trim(),
        id: savedId,
        created_at: savedAt
      }
    });
  } catch (error: any) {
    console.error('[AI Pitch] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate pitch'
    });
  }
});

// GET /api/ai/pitch/history
// Fetch recent AI pitch history for the current user
router.get('/pitch/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from('ai_pitch_history')
      .select('id, input, output, type, tone, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to load history'
      });
    }

    return res.json({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error('[AI Pitch] History error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load history'
    });
  }
});

// POST /api/ai/pitch/history
// Sync locally queued history items to the server
router.post('/pitch/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { items } = req.body as {
      items?: Array<{
        input: string;
        output: string;
        type: 'pitch' | 'notice';
        tone?: string;
        created_at?: string;
      }>;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'items array is required'
      });
    }

    const rows = items.map((item) => ({
      user_id: userId,
      type: item.type === 'notice' ? 'notice' : 'pitch',
      tone: item.type === 'notice' ? item.tone || null : null,
      input: item.input,
      output: item.output,
      created_at: item.created_at || undefined
    }));

    const { data, error } = await supabase
      .from('ai_pitch_history')
      .insert(rows)
      .select('id, created_at');

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to sync history'
      });
    }

    return res.json({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error('[AI Pitch] History sync error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync history'
    });
  }
});

// POST /api/ai/google-reviews/generate-reply
// Generate context-aware, professional reply to Google Business reviews using LLM
router.post('/google-reviews/generate-reply', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commenterName, starRating, comment, businessName } = req.body;

    if (!commenterName || typeof starRating !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'commenterName and starRating (number) are required'
      });
    }

    const business = businessName || 'Smile Dental Clinic';
    const rating = Math.max(1, Math.min(5, starRating));

    const systemPrompt = `
You are a professional customer experience manager for "${business}". Generate a concise, polite, and personalized reply to a Google Business review.

Guidelines:
1. If rating is 4 or 5 stars: Be warm, thank the customer by name (${commenterName}), mention specific highlights if they wrote a comment, and invite them back.
2. If rating is 1, 2, or 3 stars: Be professional and empathetic. Apologize for the inconvenience without admitting legal liability. Direct them to email manager@smiledental.com or call +91 98765 43210 to resolve their concerns.
3. Keep the reply under 3 sentences. Output ONLY the response text itself, no explanations, no wrappers, and no quote marks.
`.trim();

    const userPrompt = `
Customer: ${commenterName}
Rating: ${rating}/5 Stars
Review: "${comment || 'Left a rating without comment.'}"
`.trim();

    const output = await callLLM(`${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY the final response text.`);

    return res.json({
      success: true,
      data: {
        reply: output.trim()
      }
    });
  } catch (error: any) {
    console.error('[AI Google Review] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate review reply'
    });
  }
});

// POST /api/ai/google-reviews/webhook
// Webhook endpoint to receive real-time Pub/Sub review notifications from Google Business Profile
router.post('/google-reviews/webhook', async (req: express.Request, res: Response) => {
  try {
    // Google Cloud Pub/Sub sends notifications wrapped in a message payload
    // If it's a test notification or mock notification, parse accordingly
    const data = req.body.message?.data 
      ? JSON.parse(Buffer.from(req.body.message.data, 'base64').toString())
      : req.body;

    const { reviewId, locationId, commenterName, starRating, comment } = data;

    if (!commenterName || typeof starRating !== 'number') {
      // Return 200 to acknowledge Pub/Sub even if payload is invalid
      return res.json({ success: false, warning: 'Invalid payload elements' });
    }

    // Generate reply via LLM
    const businessName = 'Smile Dental Clinic';
    const systemPrompt = `
You are a professional customer experience manager for "${businessName}". Generate a concise, polite, and personalized reply to a Google Business review.

Guidelines:
1. If rating is 4 or 5 stars: Be warm, thank the customer by name (${commenterName}), mention specific highlights if they wrote a comment, and invite them back.
2. If rating is 1, 2, or 3 stars: Be professional and empathetic. Apologize for the inconvenience without admitting legal liability. Direct them to email manager@smiledental.com or call +91 98765 43210 to resolve their concerns.
3. Keep the reply under 3 sentences. Output ONLY the response text itself, no explanations, no wrappers, and no quote marks.
`.trim();

    const userPrompt = `
Customer: ${commenterName}
Rating: ${starRating}/5 Stars
Review: "${comment || 'Left a rating without comment.'}"
`.trim();

    const replyText = await callLLM(`${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY the final response text.`);

    // Log action to simulate posting to Google Business Profile My Business Reviews API
    console.log(`[Google Reviews Autoreply] Replying to Review ${reviewId} on location ${locationId}`);
    console.log(`[Google Reviews Autoreply] Review by ${commenterName} (${starRating} stars): "${comment || ''}"`);
    console.log(`[Google Reviews Autoreply] Auto Reply text: "${replyText.trim()}"`);

    // In production, you would call:
    // await mybusinessreviews.accounts.locations.reviews.updateReply({ name: ..., requestBody: { comment: replyText } })

    return res.json({
      success: true,
      data: {
        reviewId,
        commenterName,
        starRating,
        autoReply: replyText.trim(),
        status: 'replied_successfully'
      }
    });
  } catch (error: any) {
    console.error('[AI Google Review Webhook] Error:', error);
    // Return 200 so Pub/Sub doesn't continuously retry on webhook failure during demos
    return res.json({
      success: false,
      error: error.message || 'Webhook processing failed'
    });
  }
});

export default router;
