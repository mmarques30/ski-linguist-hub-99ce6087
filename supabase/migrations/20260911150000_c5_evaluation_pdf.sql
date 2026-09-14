-- C.5 — PDF serveur, trois habillages, DROP attestation_type
-- Script de retour : docs/POINT_C5_PDF_HABILLAGES.md
--
-- Habillage = test_bookings.sponsor_type (esf | ecole_ski | dsf).
-- Prix lu dans app_settings.evaluation_price_ttc (jsonb numérique 45).

-- ---------------------------------------------------------------------------
-- 1. Paramètres
-- ---------------------------------------------------------------------------

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'evaluation_price_ttc',
  '45'::jsonb,
  'Prix TTC de l''évaluation linguistique (PDF ESF et école de ski). C.5.'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'fli_identity',
  jsonb_build_object(
    'legal_name', 'France Langues International',
    'address_line', '25 avenue de la Gare',
    'postal_code', '73800',
    'city', 'Montmélian',
    'phone', '09 81 84 60 65',
    'email', 'info@fli.fr'
  ),
  'Identité FLI pour PDF / pied de page (C.5). Pas d''adresse en dur dans le rendu.'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- 2. pdf_url + DROP attestation_type
-- ---------------------------------------------------------------------------

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS pdf_url text;

COMMENT ON COLUMN public.test_evaluations.pdf_url IS
  'Chemin dans le bucket privé evaluation-pdfs. Lecture par URL signée.';

ALTER TABLE public.test_evaluations
  DROP CONSTRAINT IF EXISTS test_evaluations_attestation_type_check;

ALTER TABLE public.test_evaluations
  DROP COLUMN IF EXISTS attestation_type;

-- ---------------------------------------------------------------------------
-- 3. Vue test_bookings_complete
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.test_bookings_complete
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
  te.pdf_url
FROM public.test_bookings tb
LEFT JOIN public.test_candidates tc ON tb.candidate_id = tc.id
LEFT JOIN public.ski_schools ss ON tc.ski_school_id = ss.id
LEFT JOIN public.instructors i ON tb.instructor_id = i.id
LEFT JOIN public.test_evaluations te ON tb.id = te.booking_id;

ALTER VIEW public.test_bookings_complete SET (security_invoker = true);
GRANT SELECT ON public.test_bookings_complete TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Garde envoye : staff / admin / service_role uniquement
-- ---------------------------------------------------------------------------

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

  IF NEW.status = 'envoye' AND NOT public.is_staff() AND NOT service_caller THEN
    RAISE EXCEPTION 'Seuls le staff ou le service d''envoi peuvent marquer une évaluation comme envoyée'
      USING ERRCODE = '42501';
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

-- ---------------------------------------------------------------------------
-- 5. Bucket privé evaluation-pdfs
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('evaluation-pdfs', 'evaluation-pdfs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "rls_evaluation_pdfs_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_evaluation_pdfs_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_evaluation_pdfs_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_evaluation_pdfs_delete_admin" ON storage.objects;

CREATE POLICY "rls_evaluation_pdfs_select_staff" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'evaluation-pdfs' AND public.is_staff());

CREATE POLICY "rls_evaluation_pdfs_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evaluation-pdfs' AND public.is_staff());

CREATE POLICY "rls_evaluation_pdfs_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'evaluation-pdfs' AND public.is_staff())
  WITH CHECK (bucket_id = 'evaluation-pdfs' AND public.is_staff());

CREATE POLICY "rls_evaluation_pdfs_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'evaluation-pdfs' AND public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'c5_evaluation_pdf',
  'test_evaluations',
  jsonb_build_object(
    'migration', '20260911150000_c5_evaluation_pdf',
    'point', 'C.5',
    'bucket', 'evaluation-pdfs',
    'bucket_public', false,
    'dropped', 'attestation_type',
    'added', 'pdf_url',
    'price_key', 'evaluation_price_ttc',
    'habillage', 'test_bookings.sponsor_type'
  )
);
