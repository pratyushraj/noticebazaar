-- Migration: Replace eSign system with Fast2SMS OTP-based contract acceptance

-- Step 1: Remove old eSign fields from brand_deals
ALTER TABLE public.brand_deals
  DROP COLUMN IF EXISTS esign_provider,
  DROP COLUMN IF EXISTS esign_status,
  DROP COLUMN IF EXISTS esign_document_id,
  DROP COLUMN IF EXISTS esign_url,
  DROP COLUMN IF EXISTS esign_invitation_id,
  DROP COLUMN IF EXISTS signed_pdf_url,
  DROP COLUMN IF EXISTS signed_at;

-- Step 2: Add OTP-related fields to brand_deals
ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_last_sent_at TIMESTAMPTZ;

-- Add indexes for OTP queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_otp_hash ON public.brand_deals(otp_hash) WHERE otp_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_brand_deals_otp_expires_at ON public.brand_deals(otp_expires_at) WHERE otp_expires_at IS NOT NULL;

-- Step 3: Create deal_action_logs table
CREATE TABLE IF NOT EXISTS public.deal_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_deal_action_logs_deal_id ON public.deal_action_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_action_logs_event ON public.deal_action_logs(event);
CREATE INDEX IF NOT EXISTS idx_deal_action_logs_created_at ON public.deal_action_logs(created_at);

-- Add RLS policies for deal_action_logs
ALTER TABLE public.deal_action_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view logs for their own deals
CREATE POLICY "deal_action_logs_select_creator"
  ON public.deal_action_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_deals bd
      WHERE bd.id = deal_action_logs.deal_id
        AND bd.creator_id = auth.uid()
    )
  );

-- Policy: System can insert logs (via service role)
CREATE POLICY "deal_action_logs_insert_service"
  ON public.deal_action_logs FOR INSERT
  WITH CHECK (true); -- Service role will handle auth

-- Comments
COMMENT ON COLUMN public.brand_deals.otp_hash IS 'SHA256 hash of the OTP sent to brand for contract acceptance verification';
COMMENT ON COLUMN public.brand_deals.otp_expires_at IS 'Timestamp when the OTP expires (typically 5 minutes after generation)';
COMMENT ON COLUMN public.brand_deals.otp_verified IS 'Whether the OTP has been successfully verified';
COMMENT ON COLUMN public.brand_deals.otp_verified_at IS 'Timestamp when OTP was verified';
COMMENT ON COLUMN public.brand_deals.otp_attempts IS 'Number of failed OTP verification attempts';
COMMENT ON COLUMN public.brand_deals.otp_last_sent_at IS 'Timestamp when OTP was last sent';
COMMENT ON TABLE public.deal_action_logs IS 'Logs all actions related to deals (OTP sends, verifications, etc.)';

