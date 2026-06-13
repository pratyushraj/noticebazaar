ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE public.dental_patients ADD COLUMN IF NOT EXISTS before_after_photos TEXT[] DEFAULT '{}';
