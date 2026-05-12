-- Inbound brand inquiries from public landing pages.
-- Keep separate from brand_leads, which is used for outbound/cold outreach.

CREATE TABLE IF NOT EXISTS brand_inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name text NOT NULL,
    work_email text NOT NULL,
    website text,
    category text,
    budget text,
    timeline text,
    notes text,
    source text DEFAULT 'brands_landing',
    status text DEFAULT 'new',
    user_agent text,
    referrer text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE brand_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage brand inquiries" ON brand_inquiries
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE OR REPLACE FUNCTION update_brand_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_brand_inquiries_updated_at ON brand_inquiries;
CREATE TRIGGER update_brand_inquiries_updated_at
    BEFORE UPDATE ON brand_inquiries
    FOR EACH ROW
    EXECUTE PROCEDURE update_brand_inquiries_updated_at();

CREATE INDEX IF NOT EXISTS idx_brand_inquiries_status ON brand_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_brand_inquiries_created_at ON brand_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_inquiries_work_email ON brand_inquiries(work_email);
