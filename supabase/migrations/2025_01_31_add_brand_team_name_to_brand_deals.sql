-- Add brand_team_name column to brand_deals table
-- This allows brands to optionally provide their name/team when responding

ALTER TABLE public.brand_deals
ADD COLUMN IF NOT EXISTS brand_team_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.brand_deals.brand_team_name IS 'Optional name/team of the brand representative who submitted the response';

