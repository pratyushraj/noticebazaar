-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create tax_filings table
CREATE TABLE public.tax_filings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filing_type text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    filed_date date,
    filing_document_url text,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create tax_settings table
CREATE TABLE public.tax_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    gst_rate numeric DEFAULT 0.18 NOT NULL,
    tds_rate numeric DEFAULT 0.1 NOT NULL,
    itr_slab text DEFAULT 'basic'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

-- Add unique constraint on creator_id for tax_settings
ALTER TABLE public.tax_settings ADD CONSTRAINT tax_settings_creator_id_key UNIQUE (creator_id);

-- 3. Set up RLS for tax_filings
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view and insert their own tax filings"
ON public.tax_filings FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- 4. Set up RLS for tax_settings
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view and update their own tax settings"
ON public.tax_settings FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);