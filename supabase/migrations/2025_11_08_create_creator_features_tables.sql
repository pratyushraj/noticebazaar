-- Table: contracts
CREATE TABLE public.contracts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES public.brand_deals(id) ON DELETE SET NULL, -- Can be nullable if contract is not linked to a specific deal yet
    file_url text NOT NULL,
    extracted_clauses jsonb,
    risk_flags jsonb,
    usage_rights_issues jsonb,
    exclusivity_risks jsonb,
    termination_risks jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Optional RLS policies for contracts
-- CREATE POLICY "Enable read access for authenticated creator's contracts" ON public.contracts FOR SELECT USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable insert for authenticated creator's contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = creator_id);
-- CREATE POLICY "Enable update for authenticated creator's contracts" ON public.contracts FOR UPDATE USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable delete for authenticated creator's contracts" ON public.contracts FOR DELETE USING (auth.uid() = creator_id);


-- Table: copyright_sources
CREATE TABLE public.copyright_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
    source_url text NOT NULL,
    watermark_text text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.copyright_sources ENABLE ROW LEVEL SECURITY;

-- Optional RLS policies for copyright_sources
-- CREATE POLICY "Enable read access for authenticated creator's copyright sources" ON public.copyright_sources FOR SELECT USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable insert for authenticated creator's copyright sources" ON public.copyright_sources FOR INSERT WITH CHECK (auth.uid() = creator_id);
-- CREATE POLICY "Enable update for authenticated creator's copyright sources" ON public.copyright_sources FOR UPDATE USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable delete for authenticated creator's copyright sources" ON public.copyright_sources FOR DELETE USING (auth.uid() = creator_id);


-- Table: copyright_matches
CREATE TABLE public.copyright_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
    source_id uuid REFERENCES public.copyright_sources(id) ON DELETE CASCADE,
    repost_url text NOT NULL,
    similarity_score integer DEFAULT 0 NOT NULL,
    platform text NOT NULL,
    detected_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.copyright_matches ENABLE ROW LEVEL SECURITY;

-- Optional RLS policies for copyright_matches
-- CREATE POLICY "Enable read access for authenticated creator's copyright matches" ON public.copyright_matches FOR SELECT USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable insert for authenticated creator's copyright matches" ON public.copyright_matches FOR INSERT WITH CHECK (auth.uid() = creator_id);
-- CREATE POLICY "Enable update for authenticated creator's copyright matches" ON public.copyright_matches FOR UPDATE USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable delete for authenticated creator's copyright matches" ON public.copyright_matches FOR DELETE USING (auth.uid() = creator_id);


-- Table: tax_status
CREATE TABLE public.tax_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
    gst_last_filed date,
    itr_last_filed date,
    upcoming_due_dates jsonb,
    compliance_warnings jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tax_status ENABLE ROW LEVEL SECURITY;

-- Optional RLS policies for tax_status
-- CREATE POLICY "Enable read access for authenticated creator's tax status" ON public.tax_status FOR SELECT USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable insert for authenticated creator's tax status" ON public.tax_status FOR INSERT WITH CHECK (auth.uid() = creator_id);
-- CREATE POLICY "Enable update for authenticated creator's tax status" ON public.tax_status FOR UPDATE USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable delete for authenticated creator's tax status" ON public.tax_status FOR DELETE USING (auth.uid() = creator_id);