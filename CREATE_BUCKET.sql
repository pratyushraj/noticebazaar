-- Create the creator-assets storage bucket
-- This bucket stores contracts, invoices, expenses, and other creator files

-- Insert bucket into storage.buckets table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-assets',
  'creator-assets',
  true, -- Public bucket (files can be accessed via public URL)
  52428800, -- 50MB file size limit
  NULL -- Allow all MIME types
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = NULL;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;

-- Policy 1: Allow authenticated users to upload their own files
-- Files must be in a folder named with the user's UUID
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Allow public read access (since bucket is public)
-- This allows contract files to be viewed via public URLs
CREATE POLICY "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-assets');

-- Add comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for NoticeBazaar application';
COMMENT ON POLICY "Users can upload their own files" ON storage.objects IS 'Allows authenticated users to upload files to their own folder in creator-assets bucket';
COMMENT ON POLICY "Users can read their own files" ON storage.objects IS 'Allows authenticated users to read files from their own folder in creator-assets bucket';
COMMENT ON POLICY "Public can read files" ON storage.objects IS 'Allows public read access to all files in creator-assets bucket (for public URLs)';

