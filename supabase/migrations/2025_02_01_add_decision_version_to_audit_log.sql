-- Add decision_version column to brand_reply_audit_log
-- Tracks version number for decision-related actions (incrementing integer)

ALTER TABLE public.brand_reply_audit_log
ADD COLUMN IF NOT EXISTS decision_version integer;

-- Create index for decision_version lookups
CREATE INDEX IF NOT EXISTS idx_brand_reply_audit_log_decision_version 
ON public.brand_reply_audit_log(deal_id, decision_version DESC) 
WHERE decision_version IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.brand_reply_audit_log.decision_version IS 
'Incrementing version number for decision-related actions. NULL for non-decision actions (e.g., "viewed").';


