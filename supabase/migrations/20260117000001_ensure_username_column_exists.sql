-- Ensure username column exists in profiles table
-- This migration is idempotent and safe to run multiple times

-- Add username column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Create unique constraint on username (optional, but recommended for collab links)
-- Only create if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_username_key'
    ) THEN
        CREATE UNIQUE INDEX profiles_username_key ON public.profiles(username) WHERE username IS NOT NULL;
    END IF;
END $$;

-- Ensure the trigger function exists (recreate if needed)
CREATE OR REPLACE FUNCTION generate_username_if_needed()
RETURNS TRIGGER AS $$
DECLARE
    base_username text;
    final_username text;
    counter integer := 0;
BEGIN
    -- Only generate if username is null and user is a creator
    IF NEW.username IS NULL AND NEW.role = 'creator' THEN
        -- Generate base username ONLY from first_name and last_name
        -- DO NOT use instagram_handle or any other social media handles
        -- Note: email is in auth.users, not profiles table, so we can't use it here
        base_username := LOWER(
            REGEXP_REPLACE(
                COALESCE(NEW.first_name, '') || 
                CASE 
                    WHEN NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN '-' || NEW.last_name
                    WHEN NEW.last_name IS NOT NULL THEN NEW.last_name
                    ELSE ''
                END,
                '[^a-z0-9-]', '', 'g'
            )
        );
        
        -- Remove special characters and ensure it's valid
        base_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
        base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
        base_username := TRIM(BOTH '-' FROM base_username);
        
        -- Ensure minimum length - if no name provided, use ID-based fallback
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

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS generate_username_trigger ON public.profiles;

CREATE TRIGGER generate_username_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.username IS NULL AND NEW.role = 'creator')
EXECUTE FUNCTION generate_username_if_needed();

-- Add comment
COMMENT ON COLUMN public.profiles.username IS 'Unique username for creator collab links. Auto-generated from first_name + last_name when profile is created/updated. Never generated from Instagram handle or other social media.';

-- Generate usernames for existing creators who don't have one
-- This will trigger the function for existing rows
UPDATE public.profiles
SET username = username  -- This triggers the BEFORE UPDATE trigger
WHERE role = 'creator' 
  AND username IS NULL
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Add comment for the function
COMMENT ON FUNCTION generate_username_if_needed() IS 'Auto-generates username ONLY from first_name + last_name. If name is too short, uses ID-based fallback. Instagram handle and other social media handles are NEVER used for username generation.';

