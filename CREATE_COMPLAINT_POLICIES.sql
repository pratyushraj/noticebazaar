-- Storage Policies for complaint-proofs bucket
-- Run this in Supabase Dashboard → SQL Editor

-- Policy 1: Users can upload complaint proofs
DROP POLICY IF EXISTS "Users can upload complaint proofs" ON storage.objects;
CREATE POLICY "Users can upload complaint proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'complaint-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 2: Users can read their own complaint proofs
DROP POLICY IF EXISTS "Users can read their own complaint proofs" ON storage.objects;
CREATE POLICY "Users can read their own complaint proofs" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'complaint-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Lawyers can read all complaint proofs
DROP POLICY IF EXISTS "Lawyers can read all complaint proofs" ON storage.objects;
CREATE POLICY "Lawyers can read all complaint proofs" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'complaint-proofs' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'admin')
    )
  );

