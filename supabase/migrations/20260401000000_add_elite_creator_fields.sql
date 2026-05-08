-- Add missing Elite Creator fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS is_elite_verified boolean DEFAULT false;

-- Update types/index.ts is not needed as it's a generated file but we should update our local types if manual
-- Actually we use src/types/index.ts for our local development.

-- Comments for postgraphile or other tools if needed
COMMENT ON COLUMN public.profiles.whatsapp_number IS 'WhatsApp Business number for direct brand communication';
COMMENT ON COLUMN public.profiles.is_elite_verified IS 'Whether the creator has been manually verified for the Elite program';
