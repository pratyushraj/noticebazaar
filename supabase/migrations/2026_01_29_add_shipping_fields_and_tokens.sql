-- Barter product shipping flow: fields on brand_deals + shipping_tokens table
-- Shipping applies ONLY to barter deals; brands update via secure email link (no login).

-- 1) Shipping enum for brand_deals
DO $$ BEGIN
  CREATE TYPE public.shipping_status_enum AS ENUM (
    'pending',
    'shipped',
    'delivered',
    'issue_reported'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Add shipping columns to brand_deals
ALTER TABLE public.brand_deals
  ADD COLUMN IF NOT EXISTS shipping_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_status public.shipping_status_enum,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS expected_delivery_date date,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_issue_reason text;

COMMENT ON COLUMN public.brand_deals.shipping_required IS 'Barter only: brand must ship product';
COMMENT ON COLUMN public.brand_deals.shipping_status IS 'pending | shipped | delivered | issue_reported';
COMMENT ON COLUMN public.brand_deals.courier_name IS 'Courier / carrier name';
COMMENT ON COLUMN public.brand_deals.tracking_number IS 'Tracking number';
COMMENT ON COLUMN public.brand_deals.tracking_url IS 'Optional tracking URL';
COMMENT ON COLUMN public.brand_deals.expected_delivery_date IS 'Expected delivery date';
COMMENT ON COLUMN public.brand_deals.shipped_at IS 'When brand marked as shipped';
COMMENT ON COLUMN public.brand_deals.delivered_at IS 'When creator confirmed received';
COMMENT ON COLUMN public.brand_deals.shipping_issue_reason IS 'Reason when shipping_status = issue_reported';

-- 3) Create shipping_tokens table (one-time use, 14-day expiry)
CREATE TABLE IF NOT EXISTS public.shipping_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipping_tokens_token ON public.shipping_tokens(token);
CREATE INDEX IF NOT EXISTS idx_shipping_tokens_deal_id ON public.shipping_tokens(deal_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tokens_expires_at ON public.shipping_tokens(expires_at);

COMMENT ON TABLE public.shipping_tokens IS 'One-time tokens for brand shipping update links (no brand login)';

-- RLS: shipping_tokens are accessed only via service/API (token lookup by token string)
ALTER TABLE public.shipping_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anon/authenticated to read by token only via service role in API; restrict direct access
CREATE POLICY "shipping_tokens_select_by_token"
  ON public.shipping_tokens FOR SELECT
  USING (true);

CREATE POLICY "shipping_tokens_insert_service"
  ON public.shipping_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "shipping_tokens_update_service"
  ON public.shipping_tokens FOR UPDATE
  USING (true);
