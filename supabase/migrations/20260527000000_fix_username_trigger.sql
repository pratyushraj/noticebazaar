-- Fix generate_username_if_needed trigger function to not reference NEW.email since profiles table does not have email column.
-- It should fetch the user email from auth.users when first_name and last_name are not available.

CREATE OR REPLACE FUNCTION generate_username_if_needed()
RETURNS TRIGGER AS $$
DECLARE
    user_email text;
    base_username text;
    final_username text;
    counter integer := 0;
BEGIN
    -- Only generate if username is null and user is a creator
    IF NEW.username IS NULL AND NEW.role = 'creator' THEN
        -- Try generating from first_name and last_name first
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
        
        -- Clean up base_username
        base_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
        base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
        base_username := TRIM(BOTH '-' FROM base_username);
        
        -- If name is empty/null, try to use email from auth.users
        IF base_username IS NULL OR base_username = '' THEN
            SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
            IF user_email IS NOT NULL THEN
                base_username := LOWER(SPLIT_PART(user_email, '@', 1));
                base_username := REGEXP_REPLACE(base_username, '[^a-z0-9-]', '', 'g');
                base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
                base_username := TRIM(BOTH '-' FROM base_username);
            END IF;
        END IF;
        
        -- If still empty or too short, use ID-based fallback
        IF base_username IS NULL OR base_username = '' OR LENGTH(base_username) < 3 THEN
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

-- Drop and recreate the trigger to ensure it's pointing to the updated function correctly
DROP TRIGGER IF EXISTS generate_username_trigger ON public.profiles;

CREATE TRIGGER generate_username_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.username IS NULL AND NEW.role = 'creator')
EXECUTE FUNCTION generate_username_if_needed();

COMMENT ON FUNCTION generate_username_if_needed() IS 'Auto-generates username ONLY from first_name + last_name, falling back to auth.users email local-part or MD5 hash of their user ID. Never uses Instagram or social handles.';
