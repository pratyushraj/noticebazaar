-- Create brand_reply_audit_log table for immutable audit trail
-- All brand actions on reply links are logged here (append-only)

CREATE TABLE IF NOT EXISTS public.brand_reply_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reply_token_id uuid NOT NULL REFERENCES public.brand_reply_tokens(id) ON DELETE CASCADE,
    deal_id uuid NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    
    -- Action details
    action_type text NOT NULL CHECK (action_type IN ('viewed', 'accepted', 'negotiation_requested', 'rejected', 'updated_response')),
    action_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    action_source text NOT NULL DEFAULT 'brand_reply_link',
    
    -- Request metadata (for security/analytics)
    user_agent text,
    ip_address_hash text, -- Hashed or partially masked IP for privacy
    ip_address_partial text, -- First 3 octets only (e.g., "192.168.1.xxx")
    
    -- Optional comment from brand
    optional_comment text,
    
    -- Response data (for history)
    response_status text, -- 'accepted', 'accepted_verified', 'negotiating', 'rejected'
    brand_team_name text,
    
    -- Indexes for fast queries
    CONSTRAINT brand_reply_audit_log_reply_token_id_fkey FOREIGN KEY (reply_token_id) REFERENCES public.brand_reply_tokens(id) ON DELETE CASCADE,
    CONSTRAINT brand_reply_audit_log_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.brand_deals(id) ON DELETE CASCADE
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_brand_reply_audit_log_token_id ON public.brand_reply_audit_log(reply_token_id);
CREATE INDEX IF NOT EXISTS idx_brand_reply_audit_log_deal_id ON public.brand_reply_audit_log(deal_id);
CREATE INDEX IF NOT EXISTS idx_brand_reply_audit_log_timestamp ON public.brand_reply_audit_log(action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_brand_reply_audit_log_action_type ON public.brand_reply_audit_log(action_type);

-- Enable Row Level Security
ALTER TABLE public.brand_reply_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can view audit logs for their deals
CREATE POLICY "Creators can view audit logs for their deals"
ON public.brand_reply_audit_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.brand_deals
        WHERE id = deal_id AND creator_id = auth.uid()
    )
);

-- Prevent any modifications (immutable audit log)
-- No INSERT, UPDATE, or DELETE policies for authenticated users
-- Only service role can insert (via backend)

-- Add comment
-- Audit logs are for transparency and record-keeping, not legal binding or advice.
COMMENT ON TABLE public.brand_reply_audit_log IS 'Immutable audit trail for brand reply actions. Append-only log for record-keeping. Audit logs are for transparency and record-keeping, not legal binding or advice.';

-- Function to hash IP address (simple hash for privacy)
CREATE OR REPLACE FUNCTION hash_ip_address(ip text)
RETURNS text AS $$
BEGIN
    -- Return first 3 octets + 'xxx' for privacy
    -- Example: '192.168.1.100' -> '192.168.1.xxx'
    IF ip IS NULL OR ip = 'unknown' THEN
        RETURN NULL;
    END IF;
    
    -- Extract first 3 octets
    RETURN regexp_replace(ip, '^(\d+\.\d+\.\d+)\.\d+$', '\1.xxx');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

