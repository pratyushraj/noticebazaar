-- Add user_id column to protection_reports table
-- This allows tracking which user created each protection report
-- (useful when reports are created directly via /api/protection/analyze without a deal_id)

ALTER TABLE public.protection_reports
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_protection_reports_user_id 
ON public.protection_reports(user_id);

-- Update RLS policy to allow users to see their own reports (even without deal_id)
-- The existing policy already handles reports via deal_id, but we need to also allow direct user access
DROP POLICY IF EXISTS "protection_reports_select_user" ON public.protection_reports;
CREATE POLICY "protection_reports_select_user"
  ON public.protection_reports FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.brand_deals bd
      WHERE bd.id = protection_reports.deal_id
        AND bd.creator_id = auth.uid()
    )
  );

-- Allow users to insert their own reports
DROP POLICY IF EXISTS "protection_reports_insert_user" ON public.protection_reports;
CREATE POLICY "protection_reports_insert_user"
  ON public.protection_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own reports
DROP POLICY IF EXISTS "protection_reports_update_user" ON public.protection_reports;
CREATE POLICY "protection_reports_update_user"
  ON public.protection_reports FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON COLUMN public.protection_reports.user_id IS 'User who created this protection report (can be null if created via deal)';

