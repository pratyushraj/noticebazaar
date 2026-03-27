
import express from 'express';

import { supabase } from '../lib/supabase.js';

const feedbackRouter = express.Router();


// Submit feedback for a deal
feedbackRouter.post('/submit', async (req, res) => {
    const {
        deal_id,
        creator_id,
        brand_name,
        delivered_on_time,
        followed_brief,
        smooth_communication,
        content_brand_ready,
        easy_to_work_with,
        would_collaborate_again,
        would_recommend,
        additional_comments
    } = req.body;

    if (!deal_id || !creator_id) {
        return res.status(400).json({ success: false, error: 'Missing deal_id or creator_id' });
    }

    try {
        // Check if feedback already exists for this deal
        const { data: existing, error: checkError } = await supabase
            .from('brand_feedback')
            .select('id')
            .eq('deal_id', deal_id)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ success: false, error: 'Feedback already submitted for this deal' });
        }

        // Insert feedback
        const { data, error } = await supabase
            .from('brand_feedback')
            .insert({
                deal_id,
                creator_id,
                brand_name: brand_name || 'Anonymous Brand',
                delivered_on_time: !!delivered_on_time,
                followed_brief: !!followed_brief,
                smooth_communication: !!smooth_communication,
                content_brand_ready: !!content_brand_ready,
                easy_to_work_with: !!easy_to_work_with,
                would_collaborate_again: !!would_collaborate_again,
                would_recommend: !!would_recommend,
                additional_comments,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('[Feedback] Insert error:', error);
            return res.status(500).json({ success: false, error: 'Failed to submit feedback' });
        }

        res.json({ success: true, feedback_id: data.id });
    } catch (err: any) {
        console.error('[Feedback] Exception:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get aggregated trust metrics for a creator
feedbackRouter.get('/creator/:creatorId/trust-metrics', async (req, res) => {
    const { creatorId } = req.params;

    try {
        const { data: feedbacks, error } = await supabase
            .from('brand_feedback')
            .select('*')
            .eq('creator_id', creatorId);

        if (error) {
            return res.status(500).json({ success: false, error: 'Failed to fetch feedback' });
        }

        const total = feedbacks?.length || 0;

        if (total === 0) {
            return res.json({
                success: true,
                metrics: {
                    total_reviews: 0,
                    on_time_percentage: null,
                    brief_compliance_percentage: null,
                    quality_percentage: null,
                    collaboration_ease_percentage: null,
                    repeat_intent_percentage: null,
                    brand_advocacy_percentage: null
                }
            });
        }

        const metrics = {
            total_reviews: total,
            on_time_percentage: Math.round((feedbacks.filter(f => f.delivered_on_time).length / total) * 100),
            brief_compliance_percentage: Math.round((feedbacks.filter(f => f.followed_brief).length / total) * 100),
            quality_percentage: Math.round((feedbacks.filter(f => f.content_brand_ready).length / total) * 100),
            collaboration_ease_percentage: Math.round((feedbacks.filter(f => f.easy_to_work_with).length / total) * 100),
            repeat_intent_percentage: Math.round((feedbacks.filter(f => f.would_collaborate_again).length / total) * 100),
            brand_advocacy_percentage: Math.round((feedbacks.filter(f => f.would_recommend).length / total) * 100)
        };

        res.json({ success: true, metrics });
    } catch (err: any) {
        console.error('[Feedback] Metrics Exception:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default feedbackRouter;
