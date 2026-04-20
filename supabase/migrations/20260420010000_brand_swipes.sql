-- Migration: Create swipe tables for Tinder/Bumble-style discovery
-- This tracks interests and enables mutual matching

-- 1. Brand Swipes Table
CREATE TABLE IF NOT EXISTS public.brand_swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
    is_match BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(brand_id, creator_id)
);

-- 2. Creator Swipes Table (Bumble logic: Creators also swipe on brands/deals)
CREATE TABLE IF NOT EXISTS public.creator_swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
    is_match BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(creator_id, brand_id)
);

-- Enable RLS
ALTER TABLE public.brand_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_swipes ENABLE ROW LEVEL SECURITY;

-- Policies for Brand Swipes
CREATE POLICY "Brands can view their own swipes" ON public.brand_swipes FOR SELECT USING (auth.uid() = brand_id);
CREATE POLICY "Brands can insert their own swipes" ON public.brand_swipes FOR INSERT WITH CHECK (auth.uid() = brand_id);

-- Policies for Creator Swipes
CREATE POLICY "Creators can view their own swipes" ON public.creator_swipes FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators can insert their own swipes" ON public.creator_swipes FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 3. Mutual Match Trigger
-- When a brand swipes RIGHT, check if creator already swiped RIGHT on this brand.
-- If so, update BOTH records to is_match = true.

CREATE OR REPLACE FUNCTION public.handle_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Only care about right swipes
    IF NEW.direction = 'right' THEN
        -- If this is a brand swipe
        IF TG_TABLE_NAME = 'brand_swipes' THEN
            IF EXISTS (
                SELECT 1 FROM public.creator_swipes 
                WHERE creator_id = NEW.creator_id 
                AND brand_id = NEW.brand_id 
                AND direction = 'right'
            ) THEN
                NEW.is_match := true;
                -- Update the reciprocal record too
                UPDATE public.creator_swipes 
                SET is_match = true 
                WHERE creator_id = NEW.creator_id 
                AND brand_id = NEW.brand_id;
            END IF;
        
        -- If this is a creator swipe
        ELSIF TG_TABLE_NAME = 'creator_swipes' THEN
            IF EXISTS (
                SELECT 1 FROM public.brand_swipes 
                WHERE brand_id = NEW.brand_id 
                AND creator_id = NEW.creator_id 
                AND direction = 'right'
            ) THEN
                NEW.is_match := true;
                -- Update the reciprocal record too
                UPDATE public.brand_swipes 
                SET is_match = true 
                WHERE brand_id = NEW.brand_id 
                AND creator_id = NEW.creator_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_brand_swipe_match
    BEFORE INSERT OR UPDATE ON public.brand_swipes
    FOR EACH ROW EXECUTE FUNCTION public.handle_mutual_match();

CREATE TRIGGER on_creator_swipe_match
    BEFORE INSERT OR UPDATE ON public.creator_swipes
    FOR EACH ROW EXECUTE FUNCTION public.handle_mutual_match();
