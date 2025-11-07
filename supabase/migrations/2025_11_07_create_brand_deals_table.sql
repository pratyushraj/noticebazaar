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

-- Optional: Add the new social media columns to the profiles table if you haven't already
-- You can run these individually if you prefer, or check your profiles table first.
ALTER TABLE public.profiles
ADD COLUMN instagram_handle text,
ADD COLUMN youtube_channel_id text,
ADD COLUMN tiktok_handle text,
ADD COLUMN facebook_profile_url text,
ADD COLUMN twitter_handle text;