-- Update social_accounts table to support OAuth tokens and full functionality
-- Drop existing table if it exists and recreate with new schema
DROP TABLE IF EXISTS public.social_accounts CASCADE;

CREATE TABLE public.social_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform text NOT NULL CHECK (platform IN ('instagram', 'youtube', 'tiktok', 'twitter')),
    account_username text NOT NULL,
    account_id text,
    access_token text, -- Will be encrypted via RLS/vault
    refresh_token text, -- Will be encrypted via RLS/vault
    token_expiry timestamp with time zone,
    follower_count integer DEFAULT 0,
    profile_picture_url text,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT social_accounts_user_platform_unique UNIQUE (user_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own social accounts
CREATE POLICY "Users can view their own social accounts"
ON public.social_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts"
ON public.social_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts"
ON public.social_accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts"
ON public.social_accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_social_accounts_user_id ON public.social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON public.social_accounts(platform);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_social_accounts_updated_at
    BEFORE UPDATE ON public.social_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_social_accounts_updated_at();

