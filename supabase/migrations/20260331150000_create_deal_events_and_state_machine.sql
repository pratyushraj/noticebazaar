-- ============================================================
-- DEAL STATE MACHINE AND EVENTS SYSTEM
-- ============================================================
-- This migration creates the deal_events table and adds the
-- current_state column to brand_deals for proper state machine
-- tracking.
-- ============================================================

-- ============================================================
-- 1. CREATE DEAL_STATE ENUM
-- ============================================================

CREATE TYPE deal_state AS (
  value TEXT
);

-- Create a check constraint for valid states
-- We use TEXT with a check constraint instead of ENUM for flexibility
-- This allows us to add new states without database migrations

-- ============================================================
-- 2. ADD CURRENT_STATE COLUMN TO BRAND_DEALS
-- ============================================================

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS current_state TEXT;

-- Add check constraint for valid states
ALTER TABLE public.brand_deals
DROP CONSTRAINT IF EXISTS valid_deal_state;

ALTER TABLE public.brand_deals
ADD CONSTRAINT valid_deal_state
CHECK (
  current_state IS NULL OR
  current_state IN (
    'OFFER_SENT',
    'OFFER_ACCEPTED',
    'CONTRACT_SENT',
    'CONTRACT_SIGNED',
    'CONTENT_IN_PROGRESS',
    'CONTENT_SUBMITTED',
    'REVISION_REQUESTED',
    'APPROVED',
    'PAYMENT_PENDING',
    'PAID',
    'COMPLETED',
    'CANCELLED',
    'DISPUTE'
  )
);

-- Create index for state queries
CREATE INDEX IF NOT EXISTS idx_brand_deals_current_state
ON public.brand_deals(current_state)
WHERE current_state IS NOT NULL;

-- Comment on the column
COMMENT ON COLUMN public.brand_deals.current_state IS 'Current state in the deal lifecycle state machine. Synced with status column for backward compatibility.';

-- ============================================================
-- 3. CREATE DEAL_EVENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IN ('creator', 'brand', 'system', 'admin')),
  previous_state TEXT,
  new_state TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for event types
ALTER TABLE public.deal_events
DROP CONSTRAINT IF EXISTS valid_event_type;

ALTER TABLE public.deal_events
ADD CONSTRAINT valid_event_type
CHECK (
  event_type IN (
    -- Offer events
    'offer_sent',
    'offer_accepted',
    'offer_declined',
    'offer_expired',
    
    -- Contract events
    'contract_generated',
    'contract_sent',
    'contract_signed_by_brand',
    'contract_signed_by_creator',
    'contract_fully_signed',
    'contract_rejected',
    
    -- Content events
    'work_started',
    'content_submitted',
    'revision_requested',
    'revision_submitted',
    'content_approved',
    'content_rejected',
    
    -- Payment events
    'payment_marked',
    'payment_confirmed',
    'payment_disputed',
    'invoice_generated',
    
    -- Lifecycle events
    'deal_completed',
    'deal_cancelled',
    'dispute_opened',
    'dispute_resolved',
    
    -- Admin events
    'status_override',
    'deal_reopened'
  )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deal_events_deal_id
ON public.deal_events(deal_id);

CREATE INDEX IF NOT EXISTS idx_deal_events_event_type
ON public.deal_events(event_type);

CREATE INDEX IF NOT EXISTS idx_deal_events_created_at
ON public.deal_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deal_events_actor_id
ON public.deal_events(actor_id)
WHERE actor_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.deal_events IS 'Event log for deal lifecycle transitions. Powers timeline, notifications, and audit.';
COMMENT ON COLUMN public.deal_events.event_type IS 'Type of event that occurred';
COMMENT ON COLUMN public.deal_events.actor_id IS 'User who triggered the event';
COMMENT ON COLUMN public.deal_events.actor_role IS 'Role of the actor: creator, brand, system, or admin';
COMMENT ON COLUMN public.deal_events.previous_state IS 'State before this event';
COMMENT ON COLUMN public.deal_events.new_state IS 'State after this event';
COMMENT ON COLUMN public.deal_events.metadata IS 'Additional event data (reason, amounts, etc.)';

-- ============================================================
-- 4. ENABLE RLS ON DEAL_EVENTS
-- ============================================================

ALTER TABLE public.deal_events ENABLE ROW LEVEL SECURITY;

-- Creators can view events for their deals
CREATE POLICY "Creators can view their deal events"
ON public.deal_events
FOR SELECT
USING (
  deal_id IN (
    SELECT id FROM public.brand_deals WHERE creator_id = auth.uid()
  )
);

-- Brands can view events for deals they're involved in
CREATE POLICY "Brands can view their deal events"
ON public.deal_events
FOR SELECT
USING (
  deal_id IN (
    SELECT id FROM public.brand_deals 
    WHERE brand_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Admins can view all events
CREATE POLICY "Admins can view all deal events"
ON public.deal_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert events
CREATE POLICY "Service role can insert deal events"
ON public.deal_events
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

-- ============================================================
-- 5. MIGRATE EXISTING DATA
-- ============================================================

-- Migrate existing status values to current_state
UPDATE public.brand_deals
SET current_state = CASE
  WHEN LOWER(status) IN ('pending', 'sent') THEN 'OFFER_SENT'
  WHEN LOWER(status) IN ('accepted') THEN 'OFFER_ACCEPTED'
  WHEN LOWER(status) IN ('contract_sent', 'awaiting_brand_signature', 'awaiting_creator_signature') THEN 'CONTRACT_SENT'
  WHEN LOWER(status) IN ('signed_by_brand', 'signed_by_creator', 'fully_executed') THEN 'CONTRACT_SIGNED'
  WHEN LOWER(status) IN ('content_making') THEN 'CONTENT_IN_PROGRESS'
  WHEN LOWER(status) IN ('content_submitted', 'revision_done') THEN 'CONTENT_SUBMITTED'
  WHEN LOWER(status) IN ('revision_requested') THEN 'REVISION_REQUESTED'
  WHEN LOWER(status) IN ('content_approved', 'approved') THEN 'APPROVED'
  WHEN LOWER(status) IN ('payment_released', 'payment_pending') THEN 'PAYMENT_PENDING'
  WHEN LOWER(status) IN ('paid') THEN 'PAID'
  WHEN LOWER(status) IN ('completed') THEN 'COMPLETED'
  WHEN LOWER(status) IN ('cancelled') THEN 'CANCELLED'
  WHEN LOWER(status) IN ('dispute') THEN 'DISPUTE'
  ELSE NULL
END
WHERE current_state IS NULL AND status IS NOT NULL;

-- ============================================================
-- 6. CREATE TRIGGER FOR AUTO-LOGGING
-- ============================================================

-- Function to automatically create deal_event on status change
CREATE OR REPLACE FUNCTION log_deal_state_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status or current_state changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.current_state IS DISTINCT FROM NEW.current_state
  )) OR TG_OP = 'INSERT' THEN
    
    INSERT INTO public.deal_events (
      deal_id,
      event_type,
      actor_id,
      actor_role,
      previous_state,
      new_state,
      metadata
    ) VALUES (
      NEW.id,
      CASE
        WHEN TG_OP = 'INSERT' THEN 'offer_sent'
        ELSE 'status_override'
      END,
      auth.uid(),
      'system',
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.current_state ELSE NULL END,
      COALESCE(NEW.current_state, NEW.status),
      jsonb_build_object(
        'source', 'trigger',
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_log_deal_state_change ON public.brand_deals;

-- Create the trigger
CREATE TRIGGER trigger_log_deal_state_change
AFTER INSERT OR UPDATE ON public.brand_deals
FOR EACH ROW
EXECUTE FUNCTION log_deal_state_change();

-- ============================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================

-- Function to get deal timeline
CREATE OR REPLACE FUNCTION get_deal_timeline(p_deal_id UUID)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  actor_id UUID,
  actor_role TEXT,
  previous_state TEXT,
  new_state TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.event_type,
    de.actor_id,
    de.actor_role,
    de.previous_state,
    de.new_state,
    de.metadata,
    de.created_at
  FROM public.deal_events de
  WHERE de.deal_id = p_deal_id
  ORDER BY de.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get deals by state
CREATE OR REPLACE FUNCTION get_deals_by_state(p_state TEXT, p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  creator_id UUID,
  brand_name TEXT,
  brand_email TEXT,
  deal_type TEXT,
  deal_amount NUMERIC,
  current_state TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bd.id,
    bd.creator_id,
    bd.brand_name,
    bd.brand_email,
    bd.deal_type,
    bd.deal_amount,
    bd.current_state,
    bd.created_at
  FROM public.brand_deals bd
  WHERE bd.current_state = p_state OR bd.status = p_state
  ORDER BY bd.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment creator deals count (called on deal completion)
CREATE OR REPLACE FUNCTION increment_creator_deals(
  p_creator_id UUID,
  p_deal_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_deals = COALESCE(total_deals, 0) + 1,
    total_earnings = COALESCE(total_earnings, 0) + p_deal_amount,
    first_deal_at = COALESCE(first_deal_at, NOW())
  WHERE id = p_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. GRANT PERMISSIONS
-- ============================================================

GRANT SELECT ON public.deal_events TO authenticated;
GRANT SELECT ON public.deal_events TO anon;
GRANT INSERT ON public.deal_events TO service_role;

-- ============================================================
-- DONE
-- ============================================================
