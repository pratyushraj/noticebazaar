-- Ensure username is NEVER generated from instagram_handle
-- Username should only be generated from first_name + last_name (or email as fallback)

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

-- Add comment to clarify
COMMENT ON FUNCTION generate_username_if_needed() IS 'Auto-generates username ONLY from first_name + last_name (or email as fallback). Instagram handle and other social media handles are NEVER used for username generation.';

