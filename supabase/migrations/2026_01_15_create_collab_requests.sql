-- Create collab_requests table for collaboration request link feature
CREATE TABLE IF NOT EXISTS public.collab_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_name text NOT NULL,
    brand_email text NOT NULL,
    brand_phone text,
    brand_website text,
    brand_instagram text,
    collab_type text NOT NULL CHECK (collab_type IN ('paid', 'barter', 'both')),
    budget_range text,
    exact_budget numeric,
    barter_description text,
    barter_value numeric,
    campaign_description text NOT NULL,
    deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
    usage_rights boolean DEFAULT false,
    deadline date,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'countered', 'declined')),
    counter_offer jsonb,
    deal_id uuid REFERENCES public.brand_deals(id) ON DELETE SET NULL,
    submitted_ip text,
    submitted_user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add username field to profiles table for collab links
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for username lookups (public access)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Create index for creator collab requests
CREATE INDEX IF NOT EXISTS idx_collab_requests_creator_id ON public.collab_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_status ON public.collab_requests(status);
CREATE INDEX IF NOT EXISTS idx_collab_requests_created_at ON public.collab_requests(created_at DESC);

-- Create index for rate limiting (by email and IP)
CREATE INDEX IF NOT EXISTS idx_collab_requests_brand_email ON public.collab_requests(brand_email);
CREATE INDEX IF NOT EXISTS idx_collab_requests_submitted_ip ON public.collab_requests(submitted_ip);

-- Enable Row Level Security
ALTER TABLE public.collab_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can view and manage their own collab requests
CREATE POLICY "Creators can view their own collab requests"
ON public.collab_requests
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own collab requests"
ON public.collab_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- RLS Policy: Public can insert collab requests (for brand submissions)
CREATE POLICY "Public can submit collab requests"
ON public.collab_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collab_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_collab_requests_updated_at
BEFORE UPDATE ON public.collab_requests
FOR EACH ROW
EXECUTE FUNCTION update_collab_requests_updated_at();

-- Function to generate username from first_name and last_name if not set
CREATE OR REPLACE FUNCTION generate_username_if_needed()
RETURNS TRIGGER AS $$
DECLARE
    base_username text;
    final_username text;
    counter integer := 0;
BEGIN
    -- Only generate if username is null and user is a creator
    IF NEW.username IS NULL AND NEW.role = 'creator' THEN
        -- Generate base username from first_name and last_name
        base_username := LOWER(
            COALESCE(
                REGEXP_REPLACE(NEW.first_name || COALESCE('-' || NEW.last_name, ''), '[^a-z0-9-]', '', 'g'),
                SPLIT_PART(NEW.email, '@', 1)
            )
        );
        
        -- Remove special characters and ensure it's valid
        base_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
        base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
        base_username := TRIM(BOTH '-' FROM base_username);
        
        -- Ensure minimum length
        IF LENGTH(base_username) < 3 THEN
            base_username := 'creator-' || SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6);
        END IF;
        
        final_username := base_username;
        
        -- Check if username exists, if so append number
        WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username AND id != NEW.id) LOOP
            counter := counter + 1;
            final_username := base_username || '-' || counter::text;
        END LOOP;
        
        NEW.username := final_username;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate username
CREATE TRIGGER generate_username_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.username IS NULL AND NEW.role = 'creator')
EXECUTE FUNCTION generate_username_if_needed();

-- Comments
COMMENT ON TABLE public.collab_requests IS 'Collaboration requests submitted by brands via creator collab links';
COMMENT ON COLUMN public.collab_requests.collab_type IS 'Type of collaboration: paid, barter, or both';
COMMENT ON COLUMN public.collab_requests.deliverables IS 'JSON array of requested deliverables (e.g., ["Instagram Reel", "Post"])';
COMMENT ON COLUMN public.collab_requests.counter_offer IS 'JSON object with counter offer details if creator counters';
COMMENT ON COLUMN public.profiles.username IS 'Unique username for public collab links (e.g., creatorarmour.com/collab/username)';

