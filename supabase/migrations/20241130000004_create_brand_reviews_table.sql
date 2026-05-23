-- Brand reviews/ratings from creators
-- Allows creators to rate and review brands based on their collaboration experience

CREATE TABLE IF NOT EXISTS public.brand_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text text,
    payment_rating integer CHECK (payment_rating >= 1 AND payment_rating <= 5),
    communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT brand_reviews_unique UNIQUE (brand_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_reviews_brand_id ON public.brand_reviews(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_creator_id ON public.brand_reviews(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_rating ON public.brand_reviews(rating);

-- Enable Row Level Security
ALTER TABLE public.brand_reviews ENABLE ROW LEVEL SECURITY;

-- Creators can view all reviews (for transparency)
CREATE POLICY "Creators can view all reviews"
ON public.brand_reviews FOR SELECT
TO authenticated
USING (true);

-- Creators can create/update their own reviews
CREATE POLICY "Creators can manage their own reviews"
ON public.brand_reviews FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Function to calculate average rating for a brand
CREATE OR REPLACE FUNCTION get_brand_avg_rating(brand_uuid uuid)
RETURNS numeric AS $$
BEGIN
    RETURN (
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
        FROM public.brand_reviews
        WHERE brand_id = brand_uuid
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.brand_reviews IS 'Creator reviews and ratings for brands based on collaboration experience';
COMMENT ON COLUMN public.brand_reviews.rating IS 'Overall rating (1-5 stars)';
COMMENT ON COLUMN public.brand_reviews.payment_rating IS 'Payment reliability rating (1-5 stars)';
COMMENT ON COLUMN public.brand_reviews.communication_rating IS 'Communication quality rating (1-5 stars)';

