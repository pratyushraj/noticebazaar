-- Table: tax_settings
CREATE TABLE public.tax_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    gst_rate numeric DEFAULT 0.18 NOT NULL, -- Default 18%
    tds_rate numeric DEFAULT 0.10 NOT NULL, -- Default 10%
    itr_slab text DEFAULT 'basic' NOT NULL, -- e.g., 'basic', 'high'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can see and update their own tax settings
CREATE POLICY "Creators can view and update own tax settings"
ON public.tax_settings FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);


-- Table: tax_filings
CREATE TABLE public.tax_filings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filing_type text NOT NULL, -- e.g., 'gst_q1', 'itr', 'tds'
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    details text,
    status text DEFAULT 'pending' NOT NULL, -- 'pending', 'filed', 'overdue'
    filed_date date,
    filing_document_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can see their own tax filings
CREATE POLICY "Creators can view own tax filings"
ON public.tax_filings FOR SELECT
USING (auth.uid() = creator_id);

-- Policy: Creators can insert/update their own tax filings (e.g., marking as filed)
CREATE POLICY "Creators can insert and update own tax filings"
ON public.tax_filings FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own tax filings"
ON public.tax_filings FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);