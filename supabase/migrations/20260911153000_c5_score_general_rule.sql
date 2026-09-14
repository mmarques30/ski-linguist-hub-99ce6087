-- C.5 — règle d'appréciation générale, identité FLI, ESF discipline/cycle, verified_at
-- Script de retour : docs/POINT_C5_PDF_HABILLAGES.md

-- 1. Note générale saisie, pas un calcul affiché.
-- score_general_calcule reste en colonne générée (contrôle).
-- |général − calculé| > 1 : refus. Note méthodologique facultative.

ALTER TABLE public.test_evaluations
  DROP CONSTRAINT IF EXISTS test_evaluations_note_methodo_check;

COMMENT ON COLUMN public.test_evaluations.score_general_calcule IS
  'Contrôle en arrière-plan (moyenne des cinq notes, demi-point). Non affiché à la saisie ni sur le CR.';
COMMENT ON COLUMN public.test_evaluations.note_methodologique IS
  'Facultative. Proposée si |général − calculé| est entre 0,5 et 1 (demi-points : 1). Jamais affichée si écart nul ou 0,5.';
COMMENT ON COLUMN public.test_evaluations.score_general IS
  'Appréciation générale saisie par l''évaluateur·rice — une note, pas un calcul.';

CREATE OR REPLACE FUNCTION public.test_evaluations_score_general_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_calcule numeric;
BEGIN
  v_calcule := round((
    NEW.score_comprehension
    + NEW.score_expression
    + NEW.score_structure
    + NEW.score_technique
    + NEW.score_conversation
  ) / 5.0 * 2) / 2.0;
  IF abs(NEW.score_general - v_calcule) > 1 THEN
    RAISE EXCEPTION 'note générale incohérente avec les cinq compétences'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS test_evaluations_score_general_guard ON public.test_evaluations;
CREATE TRIGGER test_evaluations_score_general_guard
  BEFORE INSERT OR UPDATE OF
    score_general,
    score_comprehension,
    score_expression,
    score_structure,
    score_technique,
    score_conversation
  ON public.test_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.test_evaluations_score_general_guard();

-- 2. Identité FLI unique (plus le 09 81 84 60 65 du modèle Word).
UPDATE public.app_settings
SET value = jsonb_set(value, '{phone}', '"04 79 28 21 09"'::jsonb)
WHERE key = 'fli_identity';

-- 3. Discipline + cycle de formation (candidat, obligatoires si moniteur).
ALTER TABLE public.test_candidates
  ADD COLUMN IF NOT EXISTS ski_discipline text,
  ADD COLUMN IF NOT EXISTS training_cycle text;

ALTER TABLE public.test_candidates
  DROP CONSTRAINT IF EXISTS test_candidates_ski_discipline_check;
ALTER TABLE public.test_candidates
  ADD CONSTRAINT test_candidates_ski_discipline_check
  CHECK (ski_discipline IS NULL OR ski_discipline IN ('alpin', 'nordique'));

ALTER TABLE public.test_candidates
  DROP CONSTRAINT IF EXISTS test_candidates_moniteur_ski_fields_check;
ALTER TABLE public.test_candidates
  ADD CONSTRAINT test_candidates_moniteur_ski_fields_check
  CHECK (
    profession IS DISTINCT FROM 'moniteur'
    OR (
      ski_discipline IN ('alpin', 'nordique')
      AND training_cycle IS NOT NULL
      AND length(btrim(training_cycle)) > 0
    )
  );

COMMENT ON COLUMN public.test_candidates.ski_discipline IS
  'Alpin ou nordique. Obligatoire si profession = moniteur.';
COMMENT ON COLUMN public.test_candidates.training_cycle IS
  'Cycle de formation saisi par le candidat. Obligatoire si profession = moniteur.';

-- 4. Date de validation Paula (« Fait à Montmélian, le »).
ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

COMMENT ON COLUMN public.test_evaluations.verified_at IS
  'Date de validation par Paula (passage à valide). Pied ecole_ski « Fait à …, le ».';

CREATE OR REPLACE FUNCTION public.test_evaluations_verification_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  service_caller boolean;
BEGIN
  service_caller := coalesce(auth.role(), '') = 'service_role';

  IF NEW.status = 'valide' AND NOT public.is_admin() AND NOT service_caller THEN
    RAISE EXCEPTION 'Seule l''administration peut valider une évaluation'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status = 'envoye' THEN
    IF NOT public.is_staff() AND NOT service_caller THEN
      RAISE EXCEPTION 'Seuls le staff ou le service d''envoi peuvent marquer une évaluation comme envoyée'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.sent_at IS NULL THEN
      RAISE EXCEPTION 'Statut envoye uniquement après envoi réel du courriel (sent_at requis)'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = 'a_verifier'
     AND NEW.status = 'brouillon' THEN
    IF NOT public.is_admin() AND NOT service_caller THEN
      RAISE EXCEPTION 'Seule l''administration peut renvoyer une évaluation en brouillon'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.reviewer_comment IS NULL OR length(btrim(NEW.reviewer_comment)) = 0 THEN
      RAISE EXCEPTION 'Commentaire au formateur obligatoire pour un refus'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.status = 'valide'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'valide') THEN
    IF NEW.verified_at IS NULL THEN
      NEW.verified_at := now();
    END IF;
  END IF;

  IF public.is_formateur() AND NOT public.is_staff() THEN
    IF NEW.status NOT IN ('brouillon', 'a_verifier') THEN
      RAISE EXCEPTION 'Le formateur ne peut pas valider ni envoyer une évaluation'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      NEW.reviewer_comment := OLD.reviewer_comment;
      NEW.reviewed_at := OLD.reviewed_at;
      NEW.reviewed_by := OLD.reviewed_by;
      NEW.sent_at := OLD.sent_at;
      NEW.verified_at := OLD.verified_at;
      IF OLD.status IN ('valide', 'envoye') THEN
        RAISE EXCEPTION 'Évaluation déjà validée'
          USING ERRCODE = '42501';
      END IF;
      IF OLD.status = 'a_verifier' AND NEW.status = 'a_verifier' THEN
        RAISE EXCEPTION 'Évaluation en cours de vérification'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS test_evaluations_verification_guard ON public.test_evaluations;
CREATE TRIGGER test_evaluations_verification_guard
  BEFORE INSERT OR UPDATE ON public.test_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.test_evaluations_verification_guard();

-- 5. Formulaire public de réservation : liste des écoles + insert candidat.
CREATE OR REPLACE FUNCTION public.list_ski_schools_for_test()
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.name
  FROM public.ski_schools s
  ORDER BY s.name;
$$;

REVOKE ALL ON FUNCTION public.list_ski_schools_for_test() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_ski_schools_for_test() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_test_booking_candidate(
  p_name text,
  p_email text,
  p_phone text,
  p_profession text,
  p_profession_autre text,
  p_ski_school_id uuid,
  p_carte_syndicale text,
  p_ski_discipline text,
  p_training_cycle text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_profession text;
  v_discipline text;
  v_cycle text;
BEGIN
  v_profession := nullif(btrim(coalesce(p_profession, '')), '');
  IF v_profession IS NULL OR v_profession NOT IN (
    'moniteur', 'pisteur', 'rm', 'caissier', 'controleur', 'autre'
  ) THEN
    RAISE EXCEPTION 'Profession invalide'
      USING ERRCODE = '23514';
  END IF;
  IF nullif(btrim(coalesce(p_name, '')), '') IS NULL
     OR nullif(btrim(coalesce(p_email, '')), '') IS NULL
     OR nullif(btrim(coalesce(p_phone, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Nom, e-mail et téléphone sont obligatoires'
      USING ERRCODE = '23514';
  END IF;
  IF p_ski_school_id IS NULL THEN
    RAISE EXCEPTION 'École de ski obligatoire'
      USING ERRCODE = '23514';
  END IF;

  v_discipline := nullif(btrim(coalesce(p_ski_discipline, '')), '');
  v_cycle := nullif(btrim(coalesce(p_training_cycle, '')), '');
  IF v_profession = 'moniteur' THEN
    IF v_discipline IS NULL OR v_discipline NOT IN ('alpin', 'nordique') THEN
      RAISE EXCEPTION 'Discipline (alpin / nordique) obligatoire pour un moniteur de ski'
        USING ERRCODE = '23514';
    END IF;
    IF v_cycle IS NULL THEN
      RAISE EXCEPTION 'Cycle de formation obligatoire pour un moniteur de ski'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    v_discipline := NULL;
    v_cycle := NULL;
  END IF;

  INSERT INTO public.test_candidates (
    name,
    email,
    phone,
    profession,
    profession_autre,
    ski_school_id,
    carte_syndicale,
    ski_discipline,
    training_cycle
  ) VALUES (
    btrim(p_name),
    btrim(p_email),
    btrim(p_phone),
    v_profession,
    CASE WHEN v_profession = 'autre' THEN nullif(btrim(coalesce(p_profession_autre, '')), '') ELSE NULL END,
    p_ski_school_id,
    nullif(btrim(coalesce(p_carte_syndicale, '')), ''),
    v_discipline,
    v_cycle
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_test_booking_candidate(
  text, text, text, text, text, uuid, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_test_booking_candidate(
  text, text, text, text, text, uuid, text, text, text
) TO anon, authenticated;

-- 6. Vue : discipline, cycle, verified_at.
DROP VIEW IF EXISTS public.test_bookings_complete;
CREATE VIEW public.test_bookings_complete
WITH (security_invoker = true)
AS
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
  tc.name AS candidate_name,
  tc.email AS candidate_email,
  tc.phone AS candidate_phone,
  tc.profession AS candidate_profession,
  tc.photo_face_url AS candidate_photo,
  tc.ski_discipline AS candidate_ski_discipline,
  tc.training_cycle AS candidate_training_cycle,
  tc.student_id,
  ss.name AS ski_school_name,
  ss.id AS ski_school_id,
  CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
  i.email AS instructor_email,
  te.id AS evaluation_id,
  te.score_general,
  te.attestation_url,
  te.attestation_sent_at,
  tb.sponsor_type,
  tb.sponsor_id,
  te.status AS evaluation_status,
  te.pdf_url,
  te.pdf_generated_at,
  te.sent_at,
  te.verified_at
FROM public.test_bookings tb
LEFT JOIN public.test_candidates tc ON tb.candidate_id = tc.id
LEFT JOIN public.ski_schools ss ON tc.ski_school_id = ss.id
LEFT JOIN public.instructors i ON tb.instructor_id = i.id
LEFT JOIN public.test_evaluations te ON tb.id = te.booking_id;

ALTER VIEW public.test_bookings_complete SET (security_invoker = true);
GRANT SELECT ON public.test_bookings_complete TO authenticated;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'c5_score_general_rule',
  'test_evaluations',
  jsonb_build_object(
    'migration', '20260911153000_c5_score_general_rule',
    'point', 'C.5',
    'phone', '04 79 28 21 09',
    'methodo', 'optional if gap is 1, hidden if gap <= 0.5',
    'verified_at', 'Fait a Montmelian'
  )
);
