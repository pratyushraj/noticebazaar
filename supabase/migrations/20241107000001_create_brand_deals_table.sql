-- Drop existing brand_deals table if it exists to ensure a clean creation
-- WARNING: This will delete all data in the brand_deals table if it exists.
-- If you have existing data you want to keep, you would need to manually alter the table.
DROP TABLE IF EXISTS public.brand_deals CASCADE;

-- Create the brand_deals table
CREATE TABLE public.brand_deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    creator_id uuid NOT NULL,
    brand_name text NOT NULL,
    deal_amount numeric NOT NULL,
    deliverables text,
    contract_file_url text,
    due_date date NOT NULL,
    payment_expected_date date NOT NULL,
    contact_person text,
    platform text,
    status text DEFAULT 'Drafting'::text NOT NULL,
    invoice_file_url text,
    payment_received_date date,
    utr_number text,
    brand_email text,
    CONSTRAINT brand_deals_pkey PRIMARY KEY (id),
    CONSTRAINT brand_deals_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS) for the brand_deals table
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;

-- Create an RLS policy to allow authenticated users (creators) to view and manage only their own brand deals
CREATE POLICY "Creators can view and manage their own brand deals."
ON public.brand_deals FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Add the new social media columns to the profiles table if they don't exist
-- These commands will only add the columns if they are not already present.
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_handle text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube_channel_id text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_handle text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_profile_url text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_handle text;
END $$;