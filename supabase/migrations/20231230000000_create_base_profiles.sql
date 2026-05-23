-- Base schema migration to create profiles and organizations tables
-- Date: 2023-12-30

-- Create org_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_type' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.org_type AS ENUM ('sme', 'creator_account', 'agency');
    END IF;
END
$$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    avatar_url text,
    role text NOT NULL DEFAULT 'client',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    business_name text,
    gstin text,
    business_entity_type text,
    organization_id uuid
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    org_type public.org_type NOT NULL,
    owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    gstin text,
    industry text
);

-- Add foreign key constraint for organization_id on profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_organization_id_fkey' AND table_name = 'profiles' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS Policies
DROP POLICY IF EXISTS "Allow public read-only access for profiles" ON public.profiles;
CREATE POLICY "Allow public read-only access for profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
CREATE POLICY "Allow users to insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow public read-only access for organizations" ON public.organizations;
CREATE POLICY "Allow public read-only access for organizations" ON public.organizations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow owners to update organizations" ON public.organizations;
CREATE POLICY "Allow owners to update organizations" ON public.organizations FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Allow users to create organizations" ON public.organizations;
CREATE POLICY "Allow users to create organizations" ON public.organizations FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Grants
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
