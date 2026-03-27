-- Enable RLS for brand_deals table
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Creators can see their own deals
DROP POLICY IF EXISTS "Creators can view their own brand deals." ON public.brand_deals;
CREATE POLICY "Creators can view their own brand deals."
ON public.brand_deals FOR SELECT USING (auth.uid() = creator_id);

-- Policy for INSERT: Creators can insert their own deals
DROP POLICY IF EXISTS "Creators can insert their own brand deals." ON public.brand_deals;
CREATE POLICY "Creators can insert their own brand deals."
ON public.brand_deals FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policy for UPDATE: Creators can update their own deals
DROP POLICY IF EXISTS "Creators can update their own brand deals." ON public.brand_deals;
CREATE POLICY "Creators can update their own brand deals."
ON public.brand_deals FOR UPDATE USING (auth.uid() = creator_id);

-- Policy for DELETE: Creators can delete their own deals
DROP POLICY IF EXISTS "Creators can delete their own brand deals." ON public.brand_deals;
CREATE POLICY "Creators can delete their own brand deals."
ON public.brand_deals FOR DELETE USING (auth.uid() = creator_id);