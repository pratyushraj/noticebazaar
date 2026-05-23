-- Create tax_settings table
CREATE TABLE public.tax_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    gst_rate numeric DEFAULT 0.18 NOT NULL,
    tds_rate numeric DEFAULT 0.10 NOT NULL,
    itr_slab text DEFAULT 'basic' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view and update their own tax settings"
ON public.tax_settings
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Create tax_filings table
CREATE TABLE public.tax_filings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filing_type text NOT NULL, -- e.g., gst_q1, tds_q2, itr_annual
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'pending' NOT NULL, -- pending, filed, overdue
    filed_date date,
    filing_document_url text,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view and update their own tax filings"
ON public.tax_filings
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);