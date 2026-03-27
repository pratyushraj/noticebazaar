-- Brand bookmarks (move from localStorage to database for persistence)
-- Allows creators to save/bookmark brands they're interested in

CREATE TABLE IF NOT EXISTS public.brand_bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT brand_bookmarks_unique UNIQUE (creator_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_bookmarks_creator_id ON public.brand_bookmarks(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_bookmarks_brand_id ON public.brand_bookmarks(brand_id);

-- Enable Row Level Security
ALTER TABLE public.brand_bookmarks ENABLE ROW LEVEL SECURITY;

-- Creators can view their own bookmarks
CREATE POLICY "Creators can view their own bookmarks"
ON public.brand_bookmarks FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Creators can manage their own bookmarks
CREATE POLICY "Creators can manage their own bookmarks"
ON public.brand_bookmarks FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

COMMENT ON TABLE public.brand_bookmarks IS 'Creator bookmarks/favorites for brands they want to track';

