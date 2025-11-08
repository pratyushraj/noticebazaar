-- Create tax_settings table
CREATE TABLE public.tax_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone,
    gst_rate numeric NOT NULL DEFAULT 0.18,
    tds_rate numeric NOT NULL DEFAULT 0.1,
    itr_slab text NOT NULL DEFAULT 'basic',
    CONSTRAINT tax_settings_pkey PRIMARY KEY (id),
    CONSTRAINT tax_settings_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

-- Create tax_filings table
CREATE TABLE public.tax_filings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    filing_type text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    filed_date date,
    filing_document_url text,
    details text,
    CONSTRAINT tax_filings_pkey PRIMARY KEY (id),
    CONSTRAINT tax_filings_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;

-- RLS for tax_settings
CREATE POLICY "Creators can view and update their own tax settings."
ON public.tax_settings
FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- RLS for tax_filings
CREATE POLICY "Creators can view and update their own tax filings."
ON public.tax_filings
FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);