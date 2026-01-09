
-- Função para gerar código de inscrição automaticamente (FLI-YYXXXX)
CREATE OR REPLACE FUNCTION public.generate_inscription_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(inscription_code FROM 5 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.inscriptions
  WHERE inscription_code LIKE 'FLI-' || year_suffix || '%';
  
  new_code := 'FLI-' || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_code;
END;
$$;

-- =============================================
-- TABELA: students
-- =============================================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  civility TEXT CHECK (civility IN ('madame', 'monsieur')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  has_handicap BOOLEAN DEFAULT FALSE,
  identity_document_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert students"
  ON public.students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view students"
  ON public.students FOR SELECT
  USING (true);

-- =============================================
-- TABELA: professional_profiles
-- =============================================
CREATE TABLE public.professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE UNIQUE NOT NULL,
  profession TEXT CHECK (profession IN ('ski_instructor', 'other')),
  ski_school TEXT,
  cfp_contribution_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert professional_profiles"
  ON public.professional_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view professional_profiles"
  ON public.professional_profiles FOR SELECT
  USING (true);

-- =============================================
-- TABELA: inscriptions
-- =============================================
CREATE TABLE public.inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  inscription_code TEXT UNIQUE,
  funding_type TEXT CHECK (funding_type IN ('opco', 'company', 'self')),
  modality TEXT CHECK (modality IN ('in_person', 'online_individual', 'online_group')),
  language TEXT CHECK (language IN ('english', 'portuguese', 'russian', 'dutch', 'spanish', 'german', 'italian', 'chinese', 'japanese')),
  duration_hours INTEGER CHECK (duration_hours IN (6, 12, 15, 18, 20)),
  location TEXT,
  preferred_time TEXT CHECK (preferred_time IN ('morning', 'afternoon', 'flexible')),
  total_price DECIMAL(10,2),
  fifpl_coverage DECIMAL(10,2),
  student_payment DECIMAL(10,2),
  initial_level TEXT CHECK (initial_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  expectations TEXT,
  certification TEXT CHECK (certification IN ('linguaskill', 'bright', 'none')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  terms_accepted BOOLEAN DEFAULT FALSE,
  rgpd_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert inscriptions"
  ON public.inscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view inscriptions"
  ON public.inscriptions FOR SELECT
  USING (true);

-- Trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION public.set_inscription_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.inscription_code IS NULL THEN
    NEW.inscription_code := public.generate_inscription_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_inscription_code
  BEFORE INSERT ON public.inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_inscription_code();

-- =============================================
-- TABELA: placement_tests
-- =============================================
CREATE TABLE public.placement_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  inscription_id UUID REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2),
  determined_level TEXT CHECK (determined_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  answers JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert placement_tests"
  ON public.placement_tests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update placement_tests"
  ON public.placement_tests FOR UPDATE
  USING (true);

CREATE POLICY "Public can view placement_tests"
  ON public.placement_tests FOR SELECT
  USING (true);

-- =============================================
-- TABELA: placement_test_questions
-- =============================================
CREATE TABLE public.placement_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  category TEXT CHECK (category IN ('grammar', 'vocabulary', 'ski_terminology')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.placement_test_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions"
  ON public.placement_test_questions FOR SELECT
  USING (is_active = true);

-- =============================================
-- STORAGE: Bucket para documentos
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

CREATE POLICY "Anyone can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

-- =============================================
-- ÍNDICES para performance
-- =============================================
CREATE INDEX idx_students_email ON public.students(email);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_inscriptions_student_id ON public.inscriptions(student_id);
CREATE INDEX idx_inscriptions_status ON public.inscriptions(status);
CREATE INDEX idx_inscriptions_code ON public.inscriptions(inscription_code);
CREATE INDEX idx_placement_tests_student ON public.placement_tests(student_id);
CREATE INDEX idx_placement_questions_language ON public.placement_test_questions(language, is_active);
