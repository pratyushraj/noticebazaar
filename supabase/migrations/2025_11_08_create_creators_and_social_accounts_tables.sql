CREATE TABLE public.creators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text,
    business_name text,
    phone text,
    email text,
    address text,
    gst_number text,
    pan_number text,
    business_type text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.social_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
    platform text NOT NULL,
    username text NOT NULL,
    followers integer DEFAULT 0,
    linked_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Optional: Add RLS policies for creators table (example: creators can view/manage their own data)
-- CREATE POLICY "Enable read access for authenticated creators" ON public.creators FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Enable insert for authenticated creators" ON public.creators FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Enable update for authenticated creators" ON public.creators FOR UPDATE USING (auth.uid() = id);
-- CREATE POLICY "Enable delete for authenticated creators" ON public.creators FOR DELETE USING (auth.uid() = id);

-- Optional: Add RLS policies for social_accounts table (example: creators can view/manage their own social accounts)
-- CREATE POLICY "Enable read access for authenticated creator's social accounts" ON public.social_accounts FOR SELECT USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable insert for authenticated creator's social accounts" ON public.social_accounts FOR INSERT WITH CHECK (auth.uid() = creator_id);
-- CREATE POLICY "Enable update for authenticated creator's social accounts" ON public.social_accounts FOR UPDATE USING (auth.uid() = creator_id);
-- CREATE POLICY "Enable delete for authenticated creator's social accounts" ON public.social_accounts FOR DELETE USING (auth.uid() = creator_id);