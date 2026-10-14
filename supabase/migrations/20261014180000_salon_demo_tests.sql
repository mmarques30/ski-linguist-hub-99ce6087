-- Formulaire salon des directeurs (/salon) : capture légère
-- nom / prénom / école ESF + résultat du test adaptatif (hors inscription).

CREATE TABLE IF NOT EXISTS public.salon_demo_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  ski_network text NOT NULL DEFAULT 'ESF',
  ski_school_code text,
  ski_school_name text NOT NULL,
  language text NOT NULL,
  determined_level text,
  score_percentage numeric,
  correct_answers integer,
  total_questions integer,
  answers jsonb,
  summary jsonb,
  source text NOT NULL DEFAULT 'salon_directeurs',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salon_demo_tests_ski_network_check CHECK (ski_network = 'ESF'),
  CONSTRAINT salon_demo_tests_names_check CHECK (
    char_length(btrim(first_name)) >= 1
    AND char_length(btrim(last_name)) >= 1
    AND char_length(btrim(ski_school_name)) >= 1
  )
);

CREATE INDEX IF NOT EXISTS idx_salon_demo_tests_created_at
  ON public.salon_demo_tests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salon_demo_tests_school_code
  ON public.salon_demo_tests (ski_school_code);

COMMENT ON TABLE public.salon_demo_tests IS
  'Essais test de niveau au salon des directeurs (/salon) — hors parcours /register.';

ALTER TABLE public.salon_demo_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_salon_demo_tests_select_staff" ON public.salon_demo_tests;
CREATE POLICY "rls_salon_demo_tests_select_staff"
  ON public.salon_demo_tests
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "rls_salon_demo_tests_delete_admin" ON public.salon_demo_tests;
CREATE POLICY "rls_salon_demo_tests_delete_admin"
  ON public.salon_demo_tests
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Insertion publique uniquement via RPC (pas d'INSERT anon direct).
CREATE OR REPLACE FUNCTION public.submit_salon_demo_test(
  p_first_name text,
  p_last_name text,
  p_ski_school_code text,
  p_ski_school_name text,
  p_language text,
  p_determined_level text DEFAULT NULL,
  p_score_percentage numeric DEFAULT NULL,
  p_correct_answers integer DEFAULT NULL,
  p_total_questions integer DEFAULT NULL,
  p_answers jsonb DEFAULT NULL,
  p_summary jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_first text := btrim(COALESCE(p_first_name, ''));
  v_last text := btrim(COALESCE(p_last_name, ''));
  v_school_name text := btrim(COALESCE(p_ski_school_name, ''));
  v_school_code text := NULLIF(btrim(COALESCE(p_ski_school_code, '')), '');
  v_language text := btrim(COALESCE(p_language, ''));
  v_dir_name text;
BEGIN
  IF v_first = '' OR v_last = '' THEN
    RAISE EXCEPTION 'Nom et prénom obligatoires';
  END IF;
  IF v_school_name = '' THEN
    RAISE EXCEPTION 'École ESF obligatoire';
  END IF;
  IF v_language = '' THEN
    RAISE EXCEPTION 'Langue du test obligatoire';
  END IF;
  IF char_length(v_first) > 80 OR char_length(v_last) > 80 THEN
    RAISE EXCEPTION 'Nom trop long';
  END IF;
  IF char_length(v_school_name) > 200 THEN
    RAISE EXCEPTION 'Nom d''école trop long';
  END IF;

  -- Si un code référentiel est fourni, on vérifie qu'il est ESF actif.
  IF v_school_code IS NOT NULL AND v_school_code <> '__autre__' THEN
    SELECT nom_affiche INTO v_dir_name
    FROM public.ski_school_directory
    WHERE code = v_school_code
      AND reseau = 'ESF'
      AND is_active = true
    LIMIT 1;

    IF v_dir_name IS NULL THEN
      RAISE EXCEPTION 'École ESF inconnue';
    END IF;
    v_school_name := v_dir_name;
  END IF;

  INSERT INTO public.salon_demo_tests (
    first_name,
    last_name,
    ski_network,
    ski_school_code,
    ski_school_name,
    language,
    determined_level,
    score_percentage,
    correct_answers,
    total_questions,
    answers,
    summary,
    source
  ) VALUES (
    v_first,
    v_last,
    'ESF',
    CASE WHEN v_school_code = '__autre__' THEN NULL ELSE v_school_code END,
    v_school_name,
    v_language,
    NULLIF(btrim(COALESCE(p_determined_level, '')), ''),
    p_score_percentage,
    p_correct_answers,
    p_total_questions,
    p_answers,
    p_summary,
    'salon_directeurs'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.submit_salon_demo_test IS
  'Page publique /salon — enregistre un essai test (SECURITY DEFINER).';

GRANT EXECUTE ON FUNCTION public.submit_salon_demo_test(
  text, text, text, text, text, text, numeric, integer, integer, jsonb, jsonb
) TO anon, authenticated;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'salon_demo_tests_created',
  'salon_demo_tests',
  jsonb_build_object('migration', '20261014180000_salon_demo_tests')
);
