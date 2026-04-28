-- Ensure shipping related columns exist in brand_deals
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_deals' AND column_name = 'brand_address') THEN
        ALTER TABLE public.brand_deals ADD COLUMN brand_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_deals' AND column_name = 'brand_phone') THEN
        ALTER TABLE public.brand_deals ADD COLUMN brand_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_deals' AND column_name = 'contact_person') THEN
        ALTER TABLE public.brand_deals ADD COLUMN contact_person TEXT;
    END IF;

    -- Ensure company_address exists in brands (for default address persistence)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'company_address') THEN
            ALTER TABLE public.brands ADD COLUMN company_address TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'instagram_handle') THEN
            ALTER TABLE public.brands ADD COLUMN instagram_handle TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'whatsapp_handle') THEN
            ALTER TABLE public.brands ADD COLUMN whatsapp_handle TEXT;
        END IF;
    END IF;
END $$;
