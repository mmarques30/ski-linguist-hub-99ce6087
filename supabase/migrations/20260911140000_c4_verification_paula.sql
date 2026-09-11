-- C.4 — vérification Paula : commentaire formateur, horodatage, garde de statut
-- Script de retour : docs/POINT_C4_VERIFICATION.md

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS reviewer_comment text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.test_evaluations.reviewer_comment IS
  'Commentaire Paula au formateur en cas de refus (retour brouillon).';
COMMENT ON COLUMN public.test_evaluations.reviewed_at IS
  'Horodatage de la dernière décision de vérification.';
COMMENT ON COLUMN public.test_evaluations.reviewed_by IS
  'Compte admin ayant validé ou refusé.';

CREATE OR REPLACE FUNCTION public.test_evaluations_verification_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'valide' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Seule l''administration peut valider une évaluation'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = 'a_verifier'
     AND NEW.status = 'brouillon' THEN
    IF NOT public.is_admin() THEN
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
      RAISE EXCEPTION 'Le formateur ne peut pas valider une évaluation'
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

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'c4_verification_paula',
  'test_evaluations',
  jsonb_build_object(
    'migration', '20260911140000_c4_verification_paula',
    'point', 'C.4',
    'columns', jsonb_build_array('reviewer_comment', 'reviewed_at', 'reviewed_by')
  )
);
