-- Create the complaint-proofs storage bucket
-- This bucket stores proof files uploaded with consumer complaints
-- 
-- NOTE: Storage policies must be created via Supabase Dashboard or using the Supabase CLI
-- This migration only creates the bucket. Policies should be set up manually or via Dashboard.
--
-- To create policies manually in Supabase Dashboard:
-- 1. Go to Storage → Buckets → complaint-proofs → Policies
-- 2. Create the following policies:
--
-- Policy 1: "Users can upload complaint proofs"
--   Type: INSERT
--   Target roles: authenticated
--   USING expression: bucket_id = 'complaint-proofs' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- Policy 2: "Users can read their own complaint proofs"
--   Type: SELECT
--   Target roles: authenticated
--   USING expression: bucket_id = 'complaint-proofs' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- Policy 3: "Lawyers can read all complaint proofs"
--   Type: SELECT
--   Target roles: authenticated
--   USING expression: bucket_id = 'complaint-proofs' AND EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.role IN ('lawyer', 'admin')
--   )

-- Insert bucket into storage.buckets table
-- This requires superuser permissions, so it may need to be done via Dashboard
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-proofs',
  'complaint-proofs',
  false, -- Private bucket (files require authentication)
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[] -- Allow images and PDFs
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[];

-- Note: Storage policies cannot be created via SQL migration due to permissions.
-- Please create the policies manually in Supabase Dashboard:
-- Storage → Buckets → complaint-proofs → Policies → New Policy

