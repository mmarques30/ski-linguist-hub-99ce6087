-- Corrige alertas de segurança Supabase/Lovable (RLS)

-- =============================================================================
-- 1–2. course_intakes + intake_outreach_log (RLS estava desativado na BD)
-- =============================================================================
ALTER TABLE public.course_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_outreach_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_course_intakes_select" ON public.course_intakes;
DROP POLICY IF EXISTS "rls_course_intakes_insert" ON public.course_intakes;
DROP POLICY IF EXISTS "rls_course_intakes_update" ON public.course_intakes;
DROP POLICY IF EXISTS "rls_course_intakes_delete" ON public.course_intakes;

CREATE POLICY "rls_course_intakes_select" ON public.course_intakes
  FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_course_intakes_insert" ON public.course_intakes
  FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_course_intakes_update" ON public.course_intakes
  FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_course_intakes_delete" ON public.course_intakes
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "rls_intake_outreach_select" ON public.intake_outreach_log;
DROP POLICY IF EXISTS "rls_intake_outreach_insert" ON public.intake_outreach_log;

CREATE POLICY "rls_intake_outreach_select" ON public.intake_outreach_log
  FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_intake_outreach_insert" ON public.intake_outreach_log
  FOR INSERT TO authenticated WITH CHECK (is_staff());

-- =============================================================================
-- 3–4. instructor_contracts — remover acesso anon aberto
-- =============================================================================
DROP POLICY IF EXISTS "rls_instructor_contracts_select_public" ON public.instructor_contracts;
DROP POLICY IF EXISTS "rls_instructor_contracts_update_anon" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Public can view contracts" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Public can update contracts" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Anyone can view contracts by token" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Anyone can update contracts for signature" ON public.instructor_contracts;

-- RPC seguro para assinatura futura por token
CREATE OR REPLACE FUNCTION public.get_instructor_contract_by_signature_token(p_token uuid)
RETURNS SETOF public.instructor_contracts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.instructor_contracts WHERE signature_token = p_token LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.sign_instructor_contract_by_token(
  p_token uuid,
  p_signature_data text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.instructor_contracts
  SET
    signature_data = p_signature_data,
    signed_at = now()
  WHERE signature_token = p_token
    AND signed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrat introuvable ou déjà signé';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_instructor_contract_by_signature_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_instructor_contract_by_token(uuid, text) TO anon, authenticated;

-- =============================================================================
-- 5–7. placement_tests — sem leitura/escrita pública (edge function usa service role)
-- =============================================================================
DROP POLICY IF EXISTS "rls_placement_tests_select_public" ON public.placement_tests;
DROP POLICY IF EXISTS "rls_placement_tests_insert_public" ON public.placement_tests;
DROP POLICY IF EXISTS "rls_placement_tests_update_public" ON public.placement_tests;
DROP POLICY IF EXISTS "Public can view placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Public can insert placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Public can update placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Anyone can insert placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Anyone can update placement_tests" ON public.placement_tests;

DROP POLICY IF EXISTS "rls_placement_tests_select_staff" ON public.placement_tests;
CREATE POLICY "rls_placement_tests_select_staff" ON public.placement_tests
  FOR SELECT TO authenticated USING (is_staff());

-- =============================================================================
-- 8–9. students / inscriptions — inscrição pública só via edge function
-- =============================================================================
DROP POLICY IF EXISTS "rls_students_insert_anon" ON public.students;
DROP POLICY IF EXISTS "Anon can insert students" ON public.students;
DROP POLICY IF EXISTS "rls_inscriptions_insert_anon" ON public.inscriptions;
DROP POLICY IF EXISTS "Anon can insert inscriptions" ON public.inscriptions;

-- =============================================================================
-- 10–11. test_bookings / test_candidates — sem insert anon
-- =============================================================================
DROP POLICY IF EXISTS "Anon can insert test_bookings" ON public.test_bookings;
DROP POLICY IF EXISTS "Anon can insert test_candidates" ON public.test_candidates;

DROP POLICY IF EXISTS "Staff can view test_bookings" ON public.test_bookings;
DROP POLICY IF EXISTS "Staff can insert test_bookings" ON public.test_bookings;
DROP POLICY IF EXISTS "Staff can update test_bookings" ON public.test_bookings;
CREATE POLICY "rls_test_bookings_select_staff" ON public.test_bookings
  FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_test_bookings_insert_staff" ON public.test_bookings
  FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_test_bookings_update_staff" ON public.test_bookings
  FOR UPDATE TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "Staff can view test_candidates" ON public.test_candidates;
DROP POLICY IF EXISTS "Staff can insert test_candidates" ON public.test_candidates;
DROP POLICY IF EXISTS "Staff can update test_candidates" ON public.test_candidates;
CREATE POLICY "rls_test_candidates_select_staff" ON public.test_candidates
  FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_test_candidates_insert_staff" ON public.test_candidates
  FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_test_candidates_update_staff" ON public.test_candidates
  FOR UPDATE TO authenticated USING (is_staff());

-- =============================================================================
-- 12–13. satisfaction_surveys — acesso público só por token via RPC
-- =============================================================================
DROP POLICY IF EXISTS "Public can view surveys" ON public.satisfaction_surveys;
DROP POLICY IF EXISTS "Public can update surveys" ON public.satisfaction_surveys;
DROP POLICY IF EXISTS "Anyone can view satisfaction_surveys by token" ON public.satisfaction_surveys;
DROP POLICY IF EXISTS "Anyone can insert satisfaction_surveys" ON public.satisfaction_surveys;
DROP POLICY IF EXISTS "Anyone can update satisfaction_surveys" ON public.satisfaction_surveys;

DROP POLICY IF EXISTS "Staff can insert surveys" ON public.satisfaction_surveys;
CREATE POLICY "rls_satisfaction_surveys_insert_staff" ON public.satisfaction_surveys
  FOR INSERT TO authenticated WITH CHECK (is_staff());

DROP POLICY IF EXISTS "rls_satisfaction_surveys_select_staff" ON public.satisfaction_surveys;
CREATE POLICY "rls_satisfaction_surveys_select_staff" ON public.satisfaction_surveys
  FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "rls_satisfaction_surveys_update_staff" ON public.satisfaction_surveys;
CREATE POLICY "rls_satisfaction_surveys_update_staff" ON public.satisfaction_surveys
  FOR UPDATE TO authenticated USING (is_staff());

CREATE OR REPLACE FUNCTION public.get_satisfaction_survey_context(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'survey', to_jsonb(s.*),
    'inscription', CASE WHEN ic.id IS NOT NULL THEN jsonb_build_object(
      'id', ic.id,
      'code', ic.code,
      'language', ic.language,
      'start_date', ic.start_date,
      'end_date', ic.end_date,
      'duration_hours', ic.duration_hours,
      'course_location', ic.course_location,
      'instructor_name', ic.instructor_name
    ) ELSE NULL END,
    'student', CASE WHEN st.id IS NOT NULL THEN jsonb_build_object(
      'id', st.id,
      'first_name', st.first_name,
      'last_name', st.last_name,
      'email', st.email
    ) ELSE NULL END
  )
  INTO result
  FROM public.satisfaction_surveys s
  LEFT JOIN public.inscriptions_complete ic ON ic.id = s.inscription_id
  LEFT JOIN public.students st ON st.id = s.student_id
  WHERE s.token = p_token
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_satisfaction_survey_by_token(
  p_token text,
  p_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RAISE EXCEPTION 'Token invalide';
  END IF;

  UPDATE public.satisfaction_surveys
  SET
    satisfaction_content = COALESCE((p_data->>'satisfaction_content')::int, satisfaction_content),
    satisfaction_animation = COALESCE((p_data->>'satisfaction_animation')::int, satisfaction_animation),
    satisfaction_duration = COALESCE((p_data->>'satisfaction_duration')::int, satisfaction_duration),
    satisfaction_utility = COALESCE((p_data->>'satisfaction_utility')::int, satisfaction_utility),
    satisfaction_materials = COALESCE((p_data->>'satisfaction_materials')::int, satisfaction_materials),
    satisfaction_organization = COALESCE((p_data->>'satisfaction_organization')::int, satisfaction_organization),
    satisfaction_expectations = COALESCE((p_data->>'satisfaction_expectations')::int, satisfaction_expectations),
    strong_points = COALESCE(p_data->>'strong_points', strong_points),
    weak_points = COALESCE(p_data->>'weak_points', weak_points),
    exit_test_scores = COALESCE(p_data->'exit_test_scores', exit_test_scores),
    completed_at = COALESCE((p_data->>'completed_at')::timestamptz, now())
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enquête introuvable';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_satisfaction_survey_context(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_satisfaction_survey_by_token(text, jsonb) TO anon, authenticated;

-- =============================================================================
-- Extra: instructor_availabilities (select público aberto)
-- =============================================================================
DROP POLICY IF EXISTS "rls_instructor_avail_select" ON public.instructor_availabilities;
CREATE POLICY "rls_instructor_avail_select" ON public.instructor_availabilities
  FOR SELECT TO authenticated USING (is_staff());
