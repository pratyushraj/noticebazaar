-- Add deal milestones columns to brand_deals table
ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS content_submission_url TEXT,
ADD COLUMN IF NOT EXISTS content_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS brand_approval_status TEXT DEFAULT 'pending_submission',
ADD COLUMN IF NOT EXISTS brand_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS brand_feedback TEXT,
ADD COLUMN IF NOT EXISTS milestone_status TEXT DEFAULT 'awaiting_draft';

COMMENT ON COLUMN public.brand_deals.content_submission_url IS 'URL to the content draft or live link submitted by creator';
COMMENT ON COLUMN public.brand_deals.content_submitted_at IS 'When the creator submitted the content for review';
COMMENT ON COLUMN public.brand_deals.brand_approval_status IS 'Current approval state: pending_submission, awaiting_approval, changes_requested, approved';
COMMENT ON COLUMN public.brand_deals.brand_approved_at IS 'When the brand approved the content';
COMMENT ON COLUMN public.brand_deals.brand_feedback IS 'Feedback from the brand on the submitted content';
COMMENT ON COLUMN public.brand_deals.milestone_status IS 'Current high-level milestone: awaiting_draft, content_submitted, feedback_given, approved, completed';
