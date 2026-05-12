-- Migration: Add D2C/UGC Features for Creator Armour
-- Created: 2026-05-12

-- 1. Update profiles table with UGC-specific attributes
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ugc_capabilities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delivery_speed_days int4,
ADD COLUMN IF NOT EXISTS has_home_studio boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ugc_samples jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS speaking_languages text[] DEFAULT '{}';

-- 2. Create brand_leads table for tracking D2C outreach
CREATE TABLE IF NOT EXISTS brand_leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name text NOT NULL,
    website text,
    instagram_handle text,
    email text,
    category text, -- e.g., 'Skincare', 'Beauty', 'Fashion'
    status text DEFAULT 'pending', -- 'pending', 'contacted', 'replied', 'bounced', 'not_interested'
    outreach_count int4 DEFAULT 0,
    last_contacted_at timestamptz,
    replied_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on brand_leads
ALTER TABLE brand_leads ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for brand_leads (Admin only for now)
-- Assuming service_role or admin user can access. 
-- For now, let's allow authenticated users with 'admin' role if such a system exists, 
-- or just keep it restricted to service_role/manual access.
CREATE POLICY "Admin can manage brand leads" ON brand_leads
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 5. Add trigger for updated_at on brand_leads
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brand_leads_updated_at
    BEFORE UPDATE ON brand_leads
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 6. Add indexes for faster outreach selection
CREATE INDEX IF NOT EXISTS idx_brand_leads_status ON brand_leads(status);
CREATE INDEX IF NOT EXISTS idx_brand_leads_category ON brand_leads(category);
