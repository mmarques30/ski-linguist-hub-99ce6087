-- =============================================
-- MODULE: Tests d'Évaluation FLI
-- Phase 1: Data Structure
-- =============================================

-- 1. Table: schools_invoice_policy
-- Écoles autorisées à payer par facture (pas de Stripe)
CREATE TABLE public.schools_invoice_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ski_school_id uuid NOT NULL REFERENCES public.ski_schools(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ski_school_id)
);

ALTER TABLE public.schools_invoice_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schools_invoice_policy"
  ON public.schools_invoice_policy FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage schools_invoice_policy"
  ON public.schools_invoice_policy FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 2. Table: test_candidates
-- Stocke les informations des candidats aux tests
CREATE TABLE public.test_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  profession text NOT NULL CHECK (profession IN ('moniteur', 'pisteur', 'rm', 'caissier', 'controleur', 'autre')),
  profession_autre text,
  ski_school_id uuid NOT NULL REFERENCES public.ski_schools(id) ON DELETE RESTRICT,
  carte_syndicale text,
  photo_id_url text,
  photo_face_url text,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view test_candidates"
  ON public.test_candidates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage test_candidates"
  ON public.test_candidates FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert test_candidates"
  ON public.test_candidates FOR INSERT
  TO anon WITH CHECK (true);

-- Trigger: Auto-match candidate with existing student
CREATE OR REPLACE FUNCTION public.match_candidate_to_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT id INTO NEW.student_id
  FROM students
  WHERE LOWER(email) = LOWER(NEW.email) OR phone = NEW.phone
  LIMIT 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_match_candidate
  BEFORE INSERT ON public.test_candidates
  FOR EACH ROW EXECUTE FUNCTION public.match_candidate_to_student();

-- 3. Table: test_bookings
-- Gère les réservations de tests
CREATE TABLE public.test_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.test_candidates(id) ON DELETE CASCADE,
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL,
  language text NOT NULL CHECK (language IN ('anglais', 'portugais', 'espagnol', 'russe', 'italien', 'neerlandais', 'allemand', 'chinois', 'fle')),
  datetime timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show')),
  payment_type text NOT NULL CHECK (payment_type IN ('stripe', 'school_invoice')),
  stripe_payment_id text,
  google_meet_link text,
  google_event_id text,
  previous_test boolean NOT NULL DEFAULT false,
  previous_result text,
  source text NOT NULL DEFAULT 'online_form' CHECK (source IN ('online_form', 'esf_import', 'dsf_import', 'manual')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view test_bookings"
  ON public.test_bookings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage test_bookings"
  ON public.test_bookings FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert test_bookings"
  ON public.test_bookings FOR INSERT
  TO anon WITH CHECK (true);

-- 4. Table: test_evaluations
-- Compte-rendu du formateur après le test
CREATE TABLE public.test_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.test_bookings(id) ON DELETE CASCADE UNIQUE,
  scoring_system text NOT NULL DEFAULT 'sur_5' CHECK (scoring_system IN ('sur_5', 'sur_20')),
  score_comprehension decimal NOT NULL CHECK (score_comprehension >= 0),
  score_expression decimal NOT NULL CHECK (score_expression >= 0),
  score_structure decimal NOT NULL CHECK (score_structure >= 0),
  score_technique decimal NOT NULL CHECK (score_technique >= 0),
  score_conversation decimal NOT NULL CHECK (score_conversation >= 0),
  score_general decimal NOT NULL CHECK (score_general >= 0),
  appreciation_intro text,
  appreciation_comprehension text,
  appreciation_grammar text,
  appreciation_technique text,
  appreciation_conclusion text,
  grammar_points text[],
  vocabulary_examples text[],
  criteria_checklist jsonb DEFAULT '{}',
  comments text,
  attestation_type text NOT NULL CHECK (attestation_type IN ('generique', 'alpe_huez', 'prosneige', 'dsf')),
  attestation_url text,
  attestation_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view test_evaluations"
  ON public.test_evaluations FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage test_evaluations"
  ON public.test_evaluations FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 5. Table: test_phrases
-- Phrases pré-rédigées pour les appréciations
CREATE TABLE public.test_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  category text NOT NULL CHECK (category IN ('introduction', 'comprehension', 'expression', 'grammar', 'technique', 'conclusion')),
  profession text CHECK (profession IN ('moniteur', 'pisteur', 'rm', 'caissier', 'controleur', 'autre')),
  level_min text CHECK (level_min IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  level_max text CHECK (level_max IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  text_fr text NOT NULL,
  is_positive boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active test_phrases"
  ON public.test_phrases FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage test_phrases"
  ON public.test_phrases FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 6. Table: test_criteria
-- Grille du référentiel par niveau CECRL
CREATE TABLE public.test_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  level text NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  category text NOT NULL CHECK (category IN ('general', 'specifique', 'structures', 'vocab_general', 'vocab_specifique')),
  criterion_text text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active test_criteria"
  ON public.test_criteria FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage test_criteria"
  ON public.test_criteria FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 7. Table: instructor_availabilities
-- Disponibilités des formateurs pour les tests
CREATE TABLE public.instructor_availabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  datetime timestamptz NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  booking_id uuid REFERENCES public.test_bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, datetime)
);

ALTER TABLE public.instructor_availabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view instructor_availabilities"
  ON public.instructor_availabilities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage instructor_availabilities"
  ON public.instructor_availabilities FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_test_candidates_email ON public.test_candidates(email);
CREATE INDEX idx_test_candidates_phone ON public.test_candidates(phone);
CREATE INDEX idx_test_candidates_ski_school ON public.test_candidates(ski_school_id);
CREATE INDEX idx_test_bookings_candidate ON public.test_bookings(candidate_id);
CREATE INDEX idx_test_bookings_instructor ON public.test_bookings(instructor_id);
CREATE INDEX idx_test_bookings_datetime ON public.test_bookings(datetime);
CREATE INDEX idx_test_bookings_status ON public.test_bookings(status);
CREATE INDEX idx_test_evaluations_booking ON public.test_evaluations(booking_id);
CREATE INDEX idx_instructor_availabilities_instructor ON public.instructor_availabilities(instructor_id);
CREATE INDEX idx_instructor_availabilities_datetime ON public.instructor_availabilities(datetime);
CREATE INDEX idx_test_phrases_language ON public.test_phrases(language);
CREATE INDEX idx_test_phrases_category ON public.test_phrases(category);
CREATE INDEX idx_test_criteria_language_level ON public.test_criteria(language, level);

-- =============================================
-- VIEW: test_bookings_complete
-- Consolidation des données pour affichage
-- =============================================
CREATE OR REPLACE VIEW public.test_bookings_complete AS
SELECT 
  tb.id,
  tb.candidate_id,
  tb.instructor_id,
  tb.language,
  tb.datetime,
  tb.status,
  tb.payment_type,
  tb.stripe_payment_id,
  tb.google_meet_link,
  tb.google_event_id,
  tb.previous_test,
  tb.previous_result,
  tb.source,
  tb.created_at,
  -- Candidate info
  tc.name as candidate_name,
  tc.email as candidate_email,
  tc.phone as candidate_phone,
  tc.profession as candidate_profession,
  tc.photo_face_url as candidate_photo,
  tc.student_id,
  -- Ski school info
  ss.name as ski_school_name,
  ss.id as ski_school_id,
  -- Instructor info
  CONCAT(i.first_name, ' ', i.last_name) as instructor_name,
  i.email as instructor_email,
  -- Evaluation info
  te.id as evaluation_id,
  te.score_general,
  te.attestation_url,
  te.attestation_sent_at
FROM public.test_bookings tb
LEFT JOIN public.test_candidates tc ON tb.candidate_id = tc.id
LEFT JOIN public.ski_schools ss ON tc.ski_school_id = ss.id
LEFT JOIN public.instructors i ON tb.instructor_id = i.id
LEFT JOIN public.test_evaluations te ON tb.id = te.booking_id;