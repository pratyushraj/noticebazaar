-- Create GST company cache table for storing GSTIN lookup results
-- This table caches GST API responses to minimize API calls and costs

CREATE TABLE IF NOT EXISTS gst_company_cache (
  gstin TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Cancelled', 'Suspended')),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on fetched_at for efficient cache expiry queries
CREATE INDEX IF NOT EXISTS idx_gst_company_cache_fetched_at ON gst_company_cache(fetched_at);

-- Add comment
COMMENT ON TABLE gst_company_cache IS 'Cache for GSTIN lookup results from external API. Data is cached for 30 days.';
