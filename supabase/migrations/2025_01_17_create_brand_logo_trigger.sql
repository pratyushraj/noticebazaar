-- Create a function to trigger brand logo fetching
CREATE OR REPLACE FUNCTION public.trigger_fetch_brand_logo()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if brand_name is provided and brand_logo_url is not already set
  IF NEW.brand_name IS NOT NULL AND (NEW.brand_logo_url IS NULL OR NEW.brand_logo_url = '') THEN
    -- Call the edge function asynchronously using pg_net or http extension
    -- Note: This requires the http extension to be enabled
    -- For now, we'll use a database trigger that calls the function via Supabase Edge Function
    
    -- Store the trigger data in a queue table or call the function directly
    -- Since we can't directly call Edge Functions from triggers, we'll use a different approach:
    -- The frontend will call the edge function after insert/update
    -- OR we can use Supabase's database webhooks feature
    
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS brand_deals_fetch_logo_on_insert ON public.brand_deals;
CREATE TRIGGER brand_deals_fetch_logo_on_insert
  AFTER INSERT ON public.brand_deals
  FOR EACH ROW
  WHEN (NEW.brand_name IS NOT NULL AND (NEW.brand_logo_url IS NULL OR NEW.brand_logo_url = ''))
  EXECUTE FUNCTION public.trigger_fetch_brand_logo();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS brand_deals_fetch_logo_on_update ON public.brand_deals;
CREATE TRIGGER brand_deals_fetch_logo_on_update
  AFTER UPDATE ON public.brand_deals
  FOR EACH ROW
  WHEN (
    NEW.brand_name IS NOT NULL 
    AND (NEW.brand_logo_url IS NULL OR NEW.brand_logo_url = '')
    AND (OLD.brand_name IS DISTINCT FROM NEW.brand_name OR OLD.brand_domain IS DISTINCT FROM NEW.brand_domain)
  )
  EXECUTE FUNCTION public.trigger_fetch_brand_logo();

