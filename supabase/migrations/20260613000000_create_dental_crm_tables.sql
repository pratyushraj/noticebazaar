-- 1. Create Dental Clinics Table
CREATE TABLE IF NOT EXISTS public.dental_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  working_hours TEXT DEFAULT '9:00 AM - 8:00 PM',
  timings_note TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Clinics
ALTER TABLE public.dental_clinics ENABLE ROW LEVEL SECURITY;

-- 2. Create Dental Patients Table
CREATE TABLE IF NOT EXISTS public.dental_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  last_visit DATE DEFAULT CURRENT_DATE,
  service TEXT,
  total_spend NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('Active', 'Inactive', 'New Lead', 'Follow Up Needed')) DEFAULT 'Active',
  notes TEXT,
  avatar_color TEXT,
  problem_teeth INT[] DEFAULT '{}',
  xrays TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  medical_conditions TEXT[] DEFAULT '{}',
  tooth_notes JSONB DEFAULT '{}'::jsonb,
  tooth_conditions JSONB DEFAULT '{}'::jsonb,
  vitals JSONB DEFAULT '{}'::jsonb,
  active_program_id TEXT,
  program_enrollment_date DATE,
  program_current_step INT,
  program_status TEXT CHECK (program_status IN ('Active', 'Paused', 'Completed')),
  estimates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Patients
ALTER TABLE public.dental_patients ENABLE ROW LEVEL SECURITY;

-- 3. Create Clinic Services Table
CREATE TABLE IF NOT EXISTS public.clinic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration INT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Services
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;

-- 4. Create Clinic Staff Table
CREATE TABLE IF NOT EXISTS public.clinic_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  days TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Staff
ALTER TABLE public.clinic_staff ENABLE ROW LEVEL SECURITY;

-- 5. Create Clinic Notices Table
CREATE TABLE IF NOT EXISTS public.clinic_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Notices
ALTER TABLE public.clinic_notices ENABLE ROW LEVEL SECURITY;

-- 6. Create Clinic FAQs Table
CREATE TABLE IF NOT EXISTS public.clinic_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for FAQs
ALTER TABLE public.clinic_faqs ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════
-- RLS POLICIES FOR SECURE MULTI-CLINIC SEGREGATION
-- ═══════════════════════════════════════════════════════════════════

-- Policies for dental_clinics (Only clinic owner can read/write their clinic)
CREATE POLICY "Clinic owners can select their own clinic" 
  ON public.dental_clinics FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Clinic owners can insert their own clinic" 
  ON public.dental_clinics FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Clinic owners can update their own clinic" 
  ON public.dental_clinics FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Clinic owners can delete their own clinic" 
  ON public.dental_clinics FOR DELETE USING (owner_id = auth.uid());


-- Policies for dental_patients
CREATE POLICY "Select patients for owned clinics" 
  ON public.dental_patients FOR SELECT USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Insert patients for owned clinics" 
  ON public.dental_patients FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Update patients for owned clinics" 
  ON public.dental_patients FOR UPDATE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Delete patients for owned clinics" 
  ON public.dental_patients FOR DELETE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );


-- Policies for clinic_services
CREATE POLICY "Select services for owned clinics" 
  ON public.clinic_services FOR SELECT USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Insert services for owned clinics" 
  ON public.clinic_services FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Update services for owned clinics" 
  ON public.clinic_services FOR UPDATE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Delete services for owned clinics" 
  ON public.clinic_services FOR DELETE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );


-- Policies for clinic_staff
CREATE POLICY "Select staff for owned clinics" 
  ON public.clinic_staff FOR SELECT USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Insert staff for owned clinics" 
  ON public.clinic_staff FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Update staff for owned clinics" 
  ON public.clinic_staff FOR UPDATE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Delete staff for owned clinics" 
  ON public.clinic_staff FOR DELETE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );


-- Policies for clinic_notices
CREATE POLICY "Select notices for owned clinics" 
  ON public.clinic_notices FOR SELECT USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Insert notices for owned clinics" 
  ON public.clinic_notices FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Update notices for owned clinics" 
  ON public.clinic_notices FOR UPDATE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Delete notices for owned clinics" 
  ON public.clinic_notices FOR DELETE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );


-- Policies for clinic_faqs
CREATE POLICY "Select faqs for owned clinics" 
  ON public.clinic_faqs FOR SELECT USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

-- Insert policy
CREATE POLICY "Insert faqs for owned clinics" 
  ON public.clinic_faqs FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Update faqs for owned clinics" 
  ON public.clinic_faqs FOR UPDATE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );

CREATE POLICY "Delete faqs for owned clinics" 
  ON public.clinic_faqs FOR DELETE USING (
    clinic_id IN (SELECT id FROM public.dental_clinics WHERE owner_id = auth.uid())
  );
