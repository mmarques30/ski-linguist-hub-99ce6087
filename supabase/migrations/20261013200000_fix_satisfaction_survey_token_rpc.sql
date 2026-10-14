-- Questionnaire public /survey/:token cassé depuis le durcissement RLS
-- (20260731150000) : satisfaction_surveys.token est uuid, mais les RPC
-- comparaient p_token text → « operator does not exist: uuid = text ».
-- Alignement sur get_inscription_suivi_by_token / get_instructor_contract_by_signature_token.
--
-- Secondaire : ne plus joindre inscriptions_complete (security_invoker) depuis
-- une fonction SECURITY DEFINER — sous anon la vue ne voit aucune ligne.
-- Jointure directe sur inscriptions + instructors.

DROP FUNCTION IF EXISTS public.get_satisfaction_survey_context(text);
DROP FUNCTION IF EXISTS public.submit_satisfaction_survey_by_token(text, jsonb);

CREATE OR REPLACE FUNCTION public.get_satisfaction_survey_context(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_token IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'survey', to_jsonb(s.*),
    'inscription', CASE WHEN i.id IS NOT NULL THEN jsonb_build_object(
      'id', i.id,
      'code', i.code,
      'language', i.language,
      'start_date', i.start_date,
      'end_date', i.end_date,
      'duration_hours', i.duration_hours,
      'course_location', i.course_location,
      'instructor_name', CASE
        WHEN ins.id IS NOT NULL THEN trim(both FROM concat_ws(' ', ins.first_name, ins.last_name))
        ELSE NULL
      END
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
  LEFT JOIN public.inscriptions i ON i.id = s.inscription_id
  LEFT JOIN public.instructors ins ON ins.id = i.instructor_id
  LEFT JOIN public.students st ON st.id = s.student_id
  WHERE s.token = p_token
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_satisfaction_survey_by_token(
  p_token uuid,
  p_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL THEN
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

COMMENT ON FUNCTION public.get_satisfaction_survey_context(uuid) IS
  'Page publique /survey/:token — contexte enquête + inscription + stagiaire (SECURITY DEFINER).';
COMMENT ON FUNCTION public.submit_satisfaction_survey_by_token(uuid, jsonb) IS
  'Page publique /survey/:token — enregistrement des scores (SECURITY DEFINER).';

GRANT EXECUTE ON FUNCTION public.get_satisfaction_survey_context(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_satisfaction_survey_by_token(uuid, jsonb) TO anon, authenticated;
