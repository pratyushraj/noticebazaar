-- Add WhatsApp API columns to dental_clinics table
ALTER TABLE public.dental_clinics 
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_business_phone TEXT;

-- Update Shree Ram Dental Clinic (Clinic ID fd9f532d-10c2-4429-8b1b-e2694314f373)
UPDATE public.dental_clinics 
SET 
  whatsapp_phone_number_id = '1179722595225188',
  whatsapp_business_phone = '+917544860350',
  phone = '+917544860350'
WHERE id = 'fd9f532d-10c2-4429-8b1b-e2694314f373';
