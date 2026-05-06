
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

        // Self-healing: if the deal was already created but the request link is missing,
        // restore it and avoid duplicate deal creation.
        const { data: existingDeal } = await supabase
            .from('brand_deals')
            .select('id')
            .eq('collab_request_id', request.id)
            .maybeSingle();

        if (existingDeal?.id) {
            await supabase
                .from('collab_requests')
                .update({ status: 'accepted', deal_id: existingDeal.id })
                .eq('id', request.id);

            const contractToken = await createContractReadyToken({
                dealId: existingDeal.id,
                creatorId: request.creator_id,
                expiresAt: null
            });

            return res.json({ success: true, dealId: existingDeal.id, contractReadyToken: contractToken.id });
        }

        // Parse deliverables safely
        let deliverablesArray: string[] = [];
        try {
            deliverablesArray = typeof request.deliverables === 'string'
                ? (request.deliverables.startsWith('[') ? JSON.parse(request.deliverables) : [request.deliverables])
                : (Array.isArray(request.deliverables) ? request.deliverables : []);
        } catch (e) {
            console.warn('[CollabAction] Failed to parse deliverables:', e);
            deliverablesArray = typeof request.deliverables === 'string' ? [request.deliverables] : [];
        }

        const requiresLogistics = 
            request.shipping_required === true || 
            request.collab_type === 'barter' || 
            request.collab_type === 'both' || 
            request.collab_type === 'hybrid' || 
            request.collab_type === 'paid_barter';

        const isBarter = request.collab_type === 'barter' || request.collab_type === 'paid_barter';

        // 2. Create Brand Deal
        const dealData: any = {
            brand_id: request.brand_id,
            creator_id: request.creator_id,
            brand_name: request.brand_name,
            brand_email: request.brand_email,
            deal_type: isBarter ? 'barter' : 'paid',
            deal_amount: (request.collab_type === 'paid' || request.collab_type === 'both') ? request.exact_budget : request.barter_value,
            currency: 'INR',
            deliverables: deliverablesArray,
            status: requiresLogistics ? 'AWAITING_DELIVERY_DETAILS' : 'PAYMENT_PENDING',
            progress_percentage: requiresLogistics ? 15 : 10,
            platform: 'instagram',
            collab_request_id: request.id,
            shipping_required: requiresLogistics,
            collab_type: request.collab_type || null,

            // Preserve campaign metadata
            campaign_goal: request.campaign_goal || null,
            campaign_description: request.campaign_description || null,
            campaign_category: request.campaign_category || null,
            selected_package_id: (request as any).selected_package_id || null,
            selected_package_label: (request as any).selected_package_label || null,
            selected_package_type: (request as any).selected_package_type || null,
            selected_addons: (request as any).selected_addons || [],
            content_quantity: (request as any).content_quantity || null,
            content_duration: (request as any).content_duration || null,
            content_requirements: (request as any).content_requirements || [],
            barter_types: (request as any).barter_types || [],
            form_data: (request as any).form_data || {}
        };

        const dealOptionalFields = new Set([
            'collab_request_id',
            'campaign_goal',
            'campaign_category',
            'campaign_description',
            'selected_package_id',
            'selected_package_label',
            'selected_package_type',
            'selected_addons',
            'content_quantity',
            'content_duration',
            'content_requirements',
            'barter_types',
            'form_data',
            'collab_type'
        ]);

        const extractMissingColumn = (message: string): string | null => {
            if (!message) return null;
            const quoted = message.match(/'([^']+)' column/i);
            if (quoted?.[1]) return quoted[1];
            const quotedAlt = message.match(/column\s+"([^"]+)"/i);
            if (quotedAlt?.[1]) return quotedAlt[1];
            const unquoted = message.match(/column\s+([a-z_][a-z0-9_]*)/i);
            if (unquoted?.[1]) return unquoted[1];
            return null;
        };

        const dealInsertPayload: any = { ...dealData };
        let deal: any = null;
        let dealError: any = null;

        for (let attempt = 0; attempt < 15; attempt++) {
            const result = await supabase
                .from('brand_deals')
                .insert(dealInsertPayload)
                .select()
                .single();

            deal = result.data;
            dealError = result.error;

            if (!dealError) {
                break;
            }

            const missingColumn = extractMissingColumn(String(dealError.message || ''));
            if (missingColumn && dealOptionalFields.has(missingColumn) && missingColumn in dealInsertPayload) {
                console.warn(`[CollabAction] Skipping missing column: ${missingColumn}`);
                delete dealInsertPayload[missingColumn];
                continue;
            }

            // Not a missing column error or not an optional field
            break;
        }

        if (dealError) {
            console.error('[CollabAction] Failed to create deal:', dealError);
            throw dealError;
        }

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
            deliverables: deliverablesArray,
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
