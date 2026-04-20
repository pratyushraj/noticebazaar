-- Storage policies for creator-discovery bucket

-- Allow authenticated users to upload their own discovery media
CREATE POLICY "Allow authenticated uploads to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-discovery' 
  AND auth.uid()::text = (/storage.foldername(name))[1]
);

-- Allow users to update their own discovery media  
CREATE POLICY "Allow authenticated updates to own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-discovery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to discovery media
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'creator-discovery'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete to own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'creator-discovery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);