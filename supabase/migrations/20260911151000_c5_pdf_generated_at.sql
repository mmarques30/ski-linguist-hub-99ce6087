-- C.5 complément — génération ≠ envoi
-- pdf_url + pdf_generated_at à la génération ; statut reste valide.
-- envoye + sent_at uniquement quand l'e-mail est réellement parti (pas encore).
-- Script de retour : docs/POINT_C5_PDF_HABILLAGES.md

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

COMMENT ON COLUMN public.test_evaluations.pdf_generated_at IS
  'Horodatage de la génération du PDF (statut reste valide).';
COMMENT ON COLUMN public.test_evaluations.sent_at IS
  'Horodatage de l''envoi réel du courriel au candidat ou au commanditaire. NULL tant que l''envoi n''existe pas.';

ALTER TABLE public.test_evaluations
  DROP CONSTRAINT IF EXISTS test_evaluations_envoye_requires_sent_at;
ALTER TABLE public.test_evaluations
  ADD CONSTRAINT test_evaluations_envoye_requires_sent_at
  CHECK (status <> 'envoye' OR sent_at IS NOT NULL);

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
  te.sent_at
FROM public.test_bookings tb
LEFT JOIN public.test_candidates tc ON tb.candidate_id = tc.id
LEFT JOIN public.ski_schools ss ON tc.ski_school_id = ss.id
LEFT JOIN public.instructors i ON tb.instructor_id = i.id
LEFT JOIN public.test_evaluations te ON tb.id = te.booking_id;

ALTER VIEW public.test_bookings_complete SET (security_invoker = true);
GRANT SELECT ON public.test_bookings_complete TO authenticated;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'c5_pdf_generated_not_sent',
  'test_evaluations',
  jsonb_build_object(
    'migration', '20260911151000_c5_pdf_generated_at',
    'point', 'C.5',
    'generate', 'pdf_url + pdf_generated_at, status stays valide',
    'envoye', 'only with sent_at after real email'
  )
);
