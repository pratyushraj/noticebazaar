ALTER TABLE public.brand_deals
ADD COLUMN creator_id uuid NULL; -- Start with NULL to avoid issues with existing rows

-- Add a foreign key constraint to link to the profiles table
ALTER TABLE public.brand_deals
ADD CONSTRAINT fk_creator_id
FOREIGN KEY (creator_id) REFERENCES public.profiles(id)
ON DELETE CASCADE; -- This will delete brand deals if the creator profile is deleted

-- Update existing rows if necessary (e.g., if you have old data without creator_id)
-- For new tables, you can make it NOT NULL after adding the foreign key.
-- ALTER TABLE public.brand_deals ALTER COLUMN creator_id SET NOT NULL;