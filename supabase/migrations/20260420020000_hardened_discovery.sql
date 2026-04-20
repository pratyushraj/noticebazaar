-- Hardened Discovery System: Schema & Logic

-- 1. Ensure Swipe Tables have correct constraints
DO $$ 
BEGIN
    -- brand_swipes
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_swipes') THEN
        CREATE TABLE public.brand_swipes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            brand_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(brand_id, creator_id)
        );
    END IF;

    -- creator_swipes
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creator_swipes') THEN
        CREATE TABLE public.creator_swipes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            brand_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(creator_id, brand_id)
        );
    END IF;
END $$;

-- 2. Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(creator_id, brand_id)
);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Policies for Matches
CREATE POLICY "Users can view their own matches" ON public.matches 
FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = brand_id);

-- 3. Hardened Mutual Match Trigger
CREATE OR REPLACE FUNCTION public.handle_mutual_match()
RETURNS TRIGGER AS $$
DECLARE
    is_brand_swipe BOOLEAN;
    has_reciprocal BOOLEAN;
BEGIN
    -- Only care about right swipes
    IF NEW.direction != 'right' THEN
        RETURN NEW;
    END IF;

    is_brand_swipe := (TG_TABLE_NAME = 'brand_swipes');

    IF is_brand_swipe THEN
        -- Brand is swiping, check if creator already swiped right
        SELECT EXISTS (
            SELECT 1 FROM public.creator_swipes 
            WHERE creator_id = NEW.creator_id 
            AND brand_id = NEW.brand_id 
            AND direction = 'right'
        ) INTO has_reciprocal;
    ELSE
        -- Creator is swiping, check if brand already swiped right
        SELECT EXISTS (
            SELECT 1 FROM public.brand_swipes 
            WHERE brand_id = NEW.brand_id 
            AND creator_id = NEW.creator_id 
            AND direction = 'right'
        ) INTO has_reciprocal;
    END IF;

    -- If reciprocal right swipe found, create match record
    -- Use ON CONFLICT DO NOTHING to handle race conditions where both swipe at the exact same time
    IF has_reciprocal THEN
        INSERT INTO public.matches (creator_id, brand_id)
        VALUES (NEW.creator_id, NEW.brand_id)
        ON CONFLICT (creator_id, brand_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach Triggers (drop current if they exist from previous migration)
DROP TRIGGER IF EXISTS on_brand_swipe_match ON public.brand_swipes;
CREATE TRIGGER on_brand_swipe_match
    BEFORE INSERT OR UPDATE ON public.brand_swipes
    FOR EACH ROW EXECUTE FUNCTION public.handle_mutual_match();

DROP TRIGGER IF EXISTS on_creator_swipe_match ON public.creator_swipes;
CREATE TRIGGER on_creator_swipe_match
    BEFORE INSERT OR UPDATE ON public.creator_swipes
    FOR EACH ROW EXECUTE FUNCTION public.handle_mutual_match();
