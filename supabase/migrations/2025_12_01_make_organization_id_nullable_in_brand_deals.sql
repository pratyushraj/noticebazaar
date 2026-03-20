-- Make organization_id nullable in brand_deals table
-- This allows deals to be created without an organization (for individual creators)

-- First, check if the column exists and add it if it doesn't
DO $$ 
BEGIN
    -- Add organization_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_deals' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.brand_deals
        ADD COLUMN organization_id uuid;
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'brand_deals' 
            AND constraint_name = 'brand_deals_organization_id_fkey'
        ) THEN
            ALTER TABLE public.brand_deals
            ADD CONSTRAINT brand_deals_organization_id_fkey 
            FOREIGN KEY (organization_id) 
            REFERENCES public.organizations(id) 
            ON DELETE SET NULL;
        END IF;
    ELSE
        -- Column exists, just make sure it's nullable
        ALTER TABLE public.brand_deals
        ALTER COLUMN organization_id DROP NOT NULL;
        
        -- Update foreign key constraint to allow NULL (SET NULL on delete)
        -- Drop and recreate the constraint if it exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public' 
            AND table_name = 'brand_deals' 
            AND constraint_name = 'brand_deals_organization_id_fkey'
        ) THEN
            ALTER TABLE public.brand_deals
            DROP CONSTRAINT IF EXISTS brand_deals_organization_id_fkey;
            
            ALTER TABLE public.brand_deals
            ADD CONSTRAINT brand_deals_organization_id_fkey 
            FOREIGN KEY (organization_id) 
            REFERENCES public.organizations(id) 
            ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

