
-- Drop existing tables that will be recreated with new structure
DROP TABLE IF EXISTS public.placement_tests CASCADE;
DROP TABLE IF EXISTS public.placement_test_questions CASCADE;
DROP TABLE IF EXISTS public.inscriptions CASCADE;
DROP TABLE IF EXISTS public.professional_profiles CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;

-- Create ski_schools table
CREATE TABLE public.ski_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  director_name TEXT,
  director_phone TEXT,
  observations TEXT,
  UNIQUE(name)
);

-- Create instructors table
CREATE TABLE public.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_name TEXT,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  languages TEXT[],
  is_active BOOLEAN DEFAULT true
);

-- Create students table with updated structure
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  civility TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  street_address TEXT,
  postal_code TEXT,
  city TEXT,
  company TEXT
);

-- Create inscriptions table with complete structure
CREATE TABLE public.inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  ski_school_id UUID REFERENCES public.ski_schools(id) ON DELETE SET NULL,
  
  -- Course configuration
  modality TEXT,
  course_type TEXT,
  max_participants TEXT,
  language TEXT NOT NULL,
  certification_type TEXT,
  
  -- Location
  course_location TEXT,
  course_address TEXT,
  
  -- Dates and duration
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_hours NUMERIC,
  duration_days NUMERIC,
  hours_per_day NUMERIC,
  schedule TEXT,
  rhythm TEXT,
  
  -- Levels
  entry_test_score TEXT,
  entry_level TEXT,
  group_name TEXT,
  final_general_level TEXT,
  final_specific_level TEXT,
  
  -- Certification
  certification_date DATE,
  certification_result TEXT,
  
  -- Financial
  pedagogical_cost NUMERIC,
  price NUMERIC,
  payment_method TEXT,
  deposit_amount NUMERIC,
  deposit_date DATE,
  check_number TEXT,
  check_date DATE,
  balance_after_deposit NUMERIC,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'En cours',
  final_status TEXT,
  qualiopi_status TEXT,
  
  -- Other
  expectations TEXT,
  observations TEXT,
  course_materials TEXT,
  code TEXT UNIQUE
);

-- Create accommodations table
CREATE TABLE public.accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  inscription_id UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  dates TEXT,
  address TEXT,
  observations TEXT
);

-- Create placement_test_questions table
CREATE TABLE public.placement_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  category TEXT,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Create placement_tests table
CREATE TABLE public.placement_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  inscription_id UUID REFERENCES public.inscriptions(id) ON DELETE SET NULL,
  language TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  answers JSONB DEFAULT '[]'::jsonb,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  score_percentage NUMERIC,
  determined_level TEXT
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inscriptions_updated_at
  BEFORE UPDATE ON public.inscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate inscription code function (updated)
CREATE OR REPLACE FUNCTION public.generate_inscription_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code FROM 5 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.inscriptions
  WHERE code LIKE 'FLI-' || year_suffix || '%';
  new_code := 'FLI-' || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_code;
END;
$$;

-- Create view for complete inscriptions
CREATE OR REPLACE VIEW public.inscriptions_complete AS
SELECT 
  i.*,
  s.first_name || ' ' || s.last_name as student_name,
  s.email as student_email,
  s.phone as student_phone,
  s.city as student_city,
  s.company as student_company,
  ins.first_name || ' ' || ins.last_name as instructor_name,
  ins.email as instructor_email,
  ins.phone as instructor_phone,
  sk.name as ski_school_name,
  sk.director_name as ski_school_director,
  sk.director_phone as ski_school_director_phone
FROM public.inscriptions i
LEFT JOIN public.students s ON i.student_id = s.id
LEFT JOIN public.instructors ins ON i.instructor_id = ins.id
LEFT JOIN public.ski_schools sk ON i.ski_school_id = sk.id;

-- Enable RLS on all tables
ALTER TABLE public.ski_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ski_schools
CREATE POLICY "Authenticated users can view ski_schools" ON public.ski_schools
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ski_schools" ON public.ski_schools
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ski_schools" ON public.ski_schools
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for instructors
CREATE POLICY "Authenticated users can view instructors" ON public.instructors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert instructors" ON public.instructors
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update instructors" ON public.instructors
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for students
CREATE POLICY "Authenticated users can view students" ON public.students
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students" ON public.students
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update students" ON public.students
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Public can insert students" ON public.students
  FOR INSERT TO anon WITH CHECK (true);

-- RLS Policies for inscriptions
CREATE POLICY "Authenticated users can view inscriptions" ON public.inscriptions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inscriptions" ON public.inscriptions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update inscriptions" ON public.inscriptions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Public can insert inscriptions" ON public.inscriptions
  FOR INSERT TO anon WITH CHECK (true);

-- RLS Policies for accommodations
CREATE POLICY "Authenticated users can view accommodations" ON public.accommodations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert accommodations" ON public.accommodations
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for placement_test_questions
CREATE POLICY "Anyone can view active questions" ON public.placement_test_questions
  FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage questions" ON public.placement_test_questions
  FOR ALL TO authenticated USING (true);

-- RLS Policies for placement_tests
CREATE POLICY "Public can view placement_tests" ON public.placement_tests
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert placement_tests" ON public.placement_tests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update placement_tests" ON public.placement_tests
  FOR UPDATE USING (true);
