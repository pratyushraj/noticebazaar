-- Add the PAN column to the profiles table (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan TEXT NULL;