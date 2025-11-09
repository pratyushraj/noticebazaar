-- Add the PAN column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN pan TEXT NULL;

-- Optional: Add index for faster lookups if PAN is frequently queried
-- CREATE INDEX profiles_pan_idx ON public.profiles (pan);

-- Ensure RLS policy allows SELECT/UPDATE on this new column for relevant roles (usually covered by existing policies)