-- Create ai_request_queue table
CREATE TABLE ai_request_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_type text NOT NULL, -- e.g., 'contract_scan', 'secure_vault_query', 'copyright_scan'
  payload jsonb NOT NULL, -- Input data for the job (can include retry_count, retry_after)
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  result jsonb, -- Output result or error details
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_at timestamp with time zone
);

ALTER TABLE ai_request_queue ENABLE ROW LEVEL SECURITY;

-- Policies for ai_request_queue
-- Creators/Clients can only see their own jobs
CREATE POLICY "Creators/Clients can view their own AI jobs"
ON public.ai_request_queue FOR SELECT
USING (auth.uid() = user_id);

-- Creators/Clients can insert their own jobs
CREATE POLICY "Creators/Clients can insert their own AI jobs"
ON public.ai_request_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create ai_cache table
CREATE TABLE ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL, -- Hash of (user_id + job_type + payload)
  response jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add index for faster lookup
CREATE INDEX idx_ai_cache_key ON public.ai_cache (cache_key);