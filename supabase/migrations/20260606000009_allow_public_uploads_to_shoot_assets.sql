-- Create policy to allow anonymous/public inserts under the 'shoot-assets' folder in the creator-assets bucket
DROP POLICY IF EXISTS "Allow public uploads to shoot-assets" ON storage.objects;

CREATE POLICY "Allow public uploads to shoot-assets"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'creator-assets' AND
  (storage.foldername(name))[1] = 'shoot-assets'
);
