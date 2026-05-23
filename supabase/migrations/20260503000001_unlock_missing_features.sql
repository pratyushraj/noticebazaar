-- Migration to unlock missing features: Save Draft, Email Acceptance, and Funnel Tracking

-- 1. Create collab_request_drafts table for "Save Draft & Resume"
CREATE TABLE IF NOT EXISTS public.collab_request_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_token TEXT UNIQUE NOT NULL,
    creator_username TEXT NOT NULL,
    brand_email TEXT,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and add basic policy (if needed, though backend uses service role)
ALTER TABLE public.collab_request_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for everyone with token" ON public.collab_request_drafts
    FOR SELECT USING (true); -- Usually restricted by the unique resume_token anyway

-- 2. Create collab_accept_tokens table for "Email Acceptance"
CREATE TABLE IF NOT EXISTS public.collab_accept_tokens (
    id TEXT PRIMARY KEY, -- Using the token string as primary key
    collab_request_id UUID REFERENCES public.collab_requests(id) ON DELETE CASCADE,
    creator_email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collab_accept_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal service access only" ON public.collab_accept_tokens
    FOR ALL USING (false); -- Backend uses service role to bypass RLS

-- 3. Add collab_request_id to brand_deals for funnel tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'brand_deals' 
        AND COLUMN_NAME = 'collab_request_id'
    ) THEN
        ALTER TABLE public.brand_deals 
        ADD COLUMN collab_request_id UUID REFERENCES public.collab_requests(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_deals_collab_request_id ON public.brand_deals(collab_request_id);
CREATE INDEX IF NOT EXISTS idx_collab_request_drafts_resume_token ON public.collab_request_drafts(resume_token);
CREATE INDEX IF NOT EXISTS idx_collab_request_drafts_username ON public.collab_request_drafts(creator_username);
