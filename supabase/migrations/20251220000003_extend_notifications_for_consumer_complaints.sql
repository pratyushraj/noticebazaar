-- Extend notifications table to support consumer complaints
-- Adds consumer_complaint type and entity_id field for linking to complaints

-- Add 'consumer_complaint' to the type enum
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in a transaction block
-- So we'll use a workaround by recreating the constraint

-- First, drop the existing check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with 'consumer_complaint' included
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('payment', 'deal', 'contract', 'tax', 'message', 'system', 'reminder', 'consumer_complaint'));

-- Add entity_id column for linking to consumer_complaints
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Add index for entity_id lookups
CREATE INDEX IF NOT EXISTS idx_notifications_entity_id ON public.notifications(entity_id);

-- Update comment
COMMENT ON COLUMN public.notifications.entity_id IS 'References the entity this notification is about (e.g., consumer_complaints.id)';

