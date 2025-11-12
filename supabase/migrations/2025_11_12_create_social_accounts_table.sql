CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create social_accounts table
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform text NOT NULL CHECK (platform IN ('instagram', 'youtube', 'tiktok', 'twitter')),
    username text NOT NULL,
    access_token bytea NOT NULL,
    refresh_token bytea,
    followers integer DEFAULT 0,
    profile_url text,
    profile_picture_url text,
    verified boolean DEFAULT false,
    connected_at timestamp with time zone DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_user_platform_idx
    ON public.social_accounts (user_id, platform);

-- Trigger to auto update updated_at
CREATE OR REPLACE FUNCTION public.set_social_accounts_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_social_accounts_updated_at ON public.social_accounts;
CREATE TRIGGER set_social_accounts_updated_at
    BEFORE UPDATE ON public.social_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_social_accounts_updated_at();

-- Enable Row Level Security and policies
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Social accounts are viewable by owner" ON public.social_accounts;
CREATE POLICY "Social accounts are viewable by owner"
    ON public.social_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Social accounts are insertable by owner" ON public.social_accounts;
CREATE POLICY "Social accounts are insertable by owner"
    ON public.social_accounts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Social accounts are updateable by owner" ON public.social_accounts;
CREATE POLICY "Social accounts are updateable by owner"
    ON public.social_accounts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Social accounts are deleteable by owner" ON public.social_accounts;
CREATE POLICY "Social accounts are deleteable by owner"
    ON public.social_accounts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.social_account_link_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform text NOT NULL,
    success boolean DEFAULT false,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS social_account_link_attempts_user_platform_created_at_idx
    ON public.social_account_link_attempts (user_id, platform, created_at DESC);

-- Function to store social accounts with encryption
CREATE OR REPLACE FUNCTION public.store_social_account(
    p_user_id uuid,
    p_platform text,
    p_username text,
    p_profile_url text,
    p_profile_picture_url text,
    p_followers integer,
    p_verified boolean,
    p_access_token text,
    p_refresh_token text,
    p_encryption_key text
) RETURNS public.social_accounts
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
DECLARE
    v_encrypted_access_token bytea;
    v_encrypted_refresh_token bytea;
    v_result public.social_accounts;
BEGIN
    IF p_encryption_key IS NULL OR length(trim(p_encryption_key)) = 0 THEN
        RAISE EXCEPTION 'Encryption key is required';
    END IF;

    v_encrypted_access_token := pgp_sym_encrypt(p_access_token, p_encryption_key);
    IF p_refresh_token IS NOT NULL THEN
        v_encrypted_refresh_token := pgp_sym_encrypt(p_refresh_token, p_encryption_key);
    ELSE
        v_encrypted_refresh_token := NULL;
    END IF;

    INSERT INTO public.social_accounts (
        user_id,
        platform,
        username,
        profile_url,
        profile_picture_url,
        followers,
        verified,
        access_token,
        refresh_token,
        connected_at
    ) VALUES (
        p_user_id,
        p_platform,
        p_username,
        p_profile_url,
        p_profile_picture_url,
        COALESCE(p_followers, 0),
        COALESCE(p_verified, false),
        v_encrypted_access_token,
        v_encrypted_refresh_token,
        timezone('utc', now())
    )
    ON CONFLICT (user_id, platform)
    DO UPDATE SET
        username = EXCLUDED.username,
        profile_url = EXCLUDED.profile_url,
        profile_picture_url = EXCLUDED.profile_picture_url,
        followers = EXCLUDED.followers,
        verified = EXCLUDED.verified,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        connected_at = EXCLUDED.connected_at,
        updated_at = timezone('utc', now())
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.store_social_account(
    uuid,
    text,
    text,
    text,
    text,
    integer,
    boolean,
    text,
    text,
    text
) TO authenticated, service_role;
