-- Create passkeys table for WebAuthn/passkey storage
CREATE TABLE IF NOT EXISTS public.passkeys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id text NOT NULL UNIQUE, -- Base64URL encoded credential ID
    public_key text NOT NULL, -- Base64URL encoded public key
    counter bigint DEFAULT 0, -- Signature counter for replay protection
    device_name text, -- User-friendly device name (e.g., "iPhone 15 Pro")
    created_at timestamp with time zone DEFAULT now(),
    last_used_at timestamp with time zone,
    is_active boolean DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX idx_passkeys_user_id ON public.passkeys(user_id);
CREATE INDEX idx_passkeys_credential_id ON public.passkeys(credential_id);
CREATE INDEX idx_passkeys_active ON public.passkeys(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own passkeys
CREATE POLICY "Users can view their own passkeys"
ON public.passkeys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passkeys"
ON public.passkeys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passkeys"
ON public.passkeys FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passkeys"
ON public.passkeys FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to update last_used_at timestamp
CREATE OR REPLACE FUNCTION update_passkey_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_used_at
CREATE TRIGGER update_passkey_last_used_trigger
    BEFORE UPDATE OF counter ON public.passkeys
    FOR EACH ROW
    WHEN (NEW.counter > OLD.counter)
    EXECUTE FUNCTION update_passkey_last_used();

