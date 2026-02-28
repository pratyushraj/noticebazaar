
import express from 'express';
import { verifyActionToken } from '../utils/token.js';
import { createContractReadyToken } from '../services/contractReadyTokenService.js';
import { sendCollabRequestAcceptedEmail, sendCollabRequestDeclinedEmail, sendCollabRequestCounterEmail } from '../services/collabRequestEmailService.js';
import { getEffectiveReelRate } from '../services/creatorRateService.js';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// GET /api/collab-action/details?token=...
// Returns deal summary for the confirmation screen
router.get('/details', async (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Token required' });
    }

    const { valid, requestId, action, expired } = verifyActionToken(token);

    if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid or tampered token' });
    }
    if (expired) {
        return res.status(410).json({ success: false, error: 'Token expired' });
    }

    try {
        // Fetch request details
        const { data: request, error } = await supabase
            .from('collab_requests')
            .select(`
        id,
        creator_id,
        brand_name,
        collab_type,
        deliverables,
        budget_range,
        exact_budget,
        barter_value,
        barter_description,
        deadline,
        campaign_description,
        status,
        created_at
      `)
            .eq('id', requestId)
            .single();

        if (error || !request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        if (request.status !== 'pending' && request.status !== 'countered') {
            // Request already handled
            return res.json({
                success: true,
                data: request,
                status_message: `This request is already ${request.status}.`
            });
        }

        // Fetch creator rate info
        const { data: profile } = await supabase
            .from('profiles')
            .select('avg_rate_reel, learned_avg_rate_reel, learned_deal_count, instagram_followers')
            .eq('id', request.creator_id)
            .single();

        let suggested_reel_rate = null;
        if (profile) {
            suggested_reel_rate = getEffectiveReelRate(profile);
        }

        res.json({ success: true, data: request, action, suggested_reel_rate });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/collab-action/confirm
// Executes the acceptance and contract generation
router.post('/confirm', async (req, res) => {
    const { token } = req.body;

    if (!token) return res.status(400).json({ success: false, error: 'Token required' });

    const { valid, requestId, action } = verifyActionToken(token);
    if (!valid || action !== 'accept') { // Ensure token is meant for acceptance
        return res.status(401).json({ success: false, error: 'Invalid token for acceptance' });
    }

    try {
        // 1. Fetch Request
        const { data: request } = await supabase
            .from('collab_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        if (request.status !== 'pending' && request.status !== 'countered') {
            return res.status(400).json({ success: false, error: 'Request already processed' });
        }

        // 2. Create Brand Deal (Contract Generation Logic)
        const dealData = {
            brand_id: request.brand_id,
            creator_id: request.creator_id,
            brand_name: request.brand_name,
            brand_email: request.brand_email,
            deal_type: request.collab_type === 'both' ? 'paid' : request.collab_type,
            deal_amount: request.collab_type === 'paid' || request.collab_type === 'both' ? request.exact_budget : request.barter_value,
            currency: 'INR',
            deliverables: request.deliverables,
            status: 'contract_ready',
            platform: 'instagram',
            collab_request_id: request.id
        };

        const { data: deal, error: dealError } = await supabase
            .from('brand_deals')
            .insert(dealData)
            .select()
            .single();

        if (dealError) throw dealError;

        // 3. Update Request Status
        await supabase
            .from('collab_requests')
            .update({ status: 'accepted', deal_id: deal.id })
            .eq('id', request.id);

        // 4. Generate Contract Ready Token
        const contractToken = await createContractReadyToken({
            dealId: deal.id,
            creatorId: request.creator_id,
            expiresAt: null
        });

        // 5. Send Email to Brand
        const { data: profile } = await supabase.from('profiles').select('first_name, last_name, id').eq('id', request.creator_id).single();
        const creatorName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Creator';

        await sendCollabRequestAcceptedEmail(request.brand_email, {
            creatorName,
            brandName: request.brand_name,
            dealType: dealData.deal_type as 'paid' | 'barter',
            dealAmount: dealData.deal_amount,
            deliverables: dealData.deliverables,
            contractReadyToken: contractToken.id,
            barterValue: request.barter_value
        });

        res.json({ success: true, dealId: deal.id, contractReadyToken: contractToken.id });

    } catch (err: any) {
        console.error('Confirm Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/collab-action/decline
router.post('/decline', async (req, res) => {
    const { token, reason } = req.body;

    const { valid, requestId, action } = verifyActionToken(token);
    if (!valid || action !== 'decline') return res.status(401).json({ success: false, error: 'Invalid token' });

    try {
        const { data: request } = await supabase.from('collab_requests').select('*').eq('id', requestId).single();
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

        await supabase.from('collab_requests').update({ status: 'declined', decline_reason: reason }).eq('id', requestId);

        // Notify Brand
        const { data: profile } = await supabase.from('profiles').select('first_name, last_name, username').eq('id', request.creator_id).single();
        const creatorName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Creator';

        await sendCollabRequestDeclinedEmail(request.brand_email, {
            brandName: request.brand_name,
            creatorName,
            creatorUsername: profile?.username || 'creator'
        });

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/collab-action/counter
router.post('/counter', async (req, res) => {
    const { token, counterBudget, counterDeliverables, counterTimeline, notes } = req.body;

    const { valid, requestId, action } = verifyActionToken(token);
    if (!valid || action !== 'counter') return res.status(401).json({ success: false, error: 'Invalid token' });

    try {
        const { data: request } = await supabase.from('collab_requests').select('*').eq('id', requestId).single();
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

        await supabase.from('collab_requests').update({
            status: 'countered',
            counter_offer: {
                budget: counterBudget,
                deliverables: counterDeliverables,
                timeline: counterTimeline,
                notes: notes
            }
        }).eq('id', requestId);

        // Notify Brand
        const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', request.creator_id).single();
        const creatorName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Creator';

        await sendCollabRequestCounterEmail(request.brand_email, {
            brandName: request.brand_name,
            creatorName,
            originalBudget: request.exact_budget,
            counterPrice: counterBudget,
            counterDeliverables: Array.isArray(counterDeliverables) ? counterDeliverables.join(', ') : counterDeliverables,
            counterTimeline: counterTimeline,
            counterNotes: notes,
            requestId: request.id
        });

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
