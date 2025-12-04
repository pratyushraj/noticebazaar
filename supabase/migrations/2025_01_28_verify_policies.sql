-- Verify all policies on conversations table
SELECT 
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'conversations'
ORDER BY cmd, policyname;

