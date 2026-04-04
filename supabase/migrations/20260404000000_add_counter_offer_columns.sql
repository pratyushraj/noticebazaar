-- Add counter offer columns to collab_requests
ALTER TABLE collab_requests
ADD COLUMN IF NOT EXISTS counter_price INTEGER,
ADD COLUMN IF NOT EXISTS counter_notes TEXT,
ADD COLUMN IF NOT EXISTS countered_at TIMESTAMPTZ;
