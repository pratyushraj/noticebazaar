-- Create Dental Appointments Table
CREATE TABLE IF NOT EXISTS public.dental_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.dental_patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL, -- e.g. "11:00 AM"
  doctor_name TEXT NOT NULL,
  treatment_name TEXT,
  status TEXT CHECK (status IN ('Confirmed', 'Completed', 'Cancelled')) DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dental_appointments ENABLE ROW LEVEL SECURITY;

-- Policies for dental_appointments
CREATE POLICY "Select appointments for owned clinics" 
  ON public.dental_appointments FOR SELECT USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Insert appointments for owned clinics" 
  ON public.dental_appointments FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Update appointments for owned clinics" 
  ON public.dental_appointments FOR UPDATE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Delete appointments for owned clinics" 
  ON public.dental_appointments FOR DELETE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );
