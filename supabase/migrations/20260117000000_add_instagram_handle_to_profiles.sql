-- Add instagram_handle column to profiles table
-- This column stores Instagram username without @ symbol
-- Used for displaying on collab links and creator directory

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.instagram_handle IS 'Instagram username without @ symbol. Used for public display on collab links and creator directory.';

-- Create index for faster lookups (optional but helpful for directory searches)
CREATE INDEX IF NOT EXISTS idx_profiles_instagram_handle ON public.profiles(instagram_handle) WHERE instagram_handle IS NOT NULL;

-- RLS: Creators can update their own instagram_handle
-- (This is already covered by existing RLS policies on profiles table, but ensuring it's clear)
-- The existing RLS policy allows users to update their own profile, so instagram_handle is automatically included

