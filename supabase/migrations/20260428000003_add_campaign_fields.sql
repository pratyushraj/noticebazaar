-- Add campaign_category and campaign_goal to collab_requests and collab_request_leads
ALTER TABLE public.collab_requests 
ADD COLUMN IF NOT EXISTS campaign_category text,
ADD COLUMN IF NOT EXISTS campaign_goal text;

ALTER TABLE public.collab_request_leads
ADD COLUMN IF NOT EXISTS campaign_category text,
ADD COLUMN IF NOT EXISTS campaign_goal text;

COMMENT ON COLUMN public.collab_requests.campaign_category IS 'The broad category of the campaign (e.g., General, Beauty, Tech)';
COMMENT ON COLUMN public.collab_requests.campaign_goal IS 'The specific goal or package name of the campaign';
