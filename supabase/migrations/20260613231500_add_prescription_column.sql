-- Add prescription column to dental_patients
ALTER TABLE public.dental_patients ADD COLUMN IF NOT EXISTS prescription TEXT;
