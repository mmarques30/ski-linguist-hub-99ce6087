-- Point A — Sécurité des évaluations de test (SNMSF / DSF) + bucket certificats
--
-- Constat corrigé : test_evaluations avait SELECT/UPDATE TO authenticated USING (true)
-- et INSERT WITH CHECK (true) : tout compte connecté pouvait lire et modifier toutes
-- les évaluations. test_phrases / test_criteria étaient en ALL USING (true) pour
-- authenticated, avec en plus un SELECT public sur les lignes actives.
--
-- Script de retour (down) documenté dans docs/SECURITE_A_TEST_EVALUATIONS.md.

-- ---------------------------------------------------------------------------
-- 1. Fonctions d'aide
-- ---------------------------------------------------------------------------

-- Le candidat est rattaché à l'évaluation par test_bookings -> test_candidates.student_id.
CREATE OR REPLACE FUNCTION public.owns_test_booking(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.test_bookings b
    JOIN public.test_candidates c ON c.id = b.candidate_id
    WHERE b.id = _booking_id
      AND c.student_id IS NOT NULL
      AND c.student_id = public.get_my_student_id()
  )
$function$;

-- Commanditaire DSF : déduit aujourd'hui de l'école rattachée au candidat
-- (ski_schools.school_kind, ou le partenaire lié via ski_schools.partner_id).
-- Le point C.2 ajoutera test_bookings.sponsor_type / sponsor_id : cette fonction
-- devra alors lire sponsor_type en priorité.
CREATE OR REPLACE FUNCTION public.test_booking_is_dsf(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.test_bookings b
    LEFT JOIN public.test_candidates c ON c.id = b.candidate_id
    LEFT JOIN public.ski_schools s ON s.id = c.ski_school_id
    LEFT JOIN public.partners p ON p.id = s.partner_id
    WHERE b.id = _booking_id
      AND (
        lower(coalesce(s.school_kind, '')) IN (
          'dsf',
          'domaines_skiables',
          'remontees_mecaniques'
        )
        OR lower(coalesce(p.type, '')) IN (
          'dsf',
          'domaines_skiables',
          'domaines skiables de france'
        )
      )
  )
$function$;

-- ---------------------------------------------------------------------------
-- 2. test_evaluations — staff complet, candidat limité à ses lignes hors DSF
-- ---------------------------------------------------------------------------

ALTER TABLE public.test_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view test_evaluations" ON public.test_evaluations;
DROP POLICY IF EXISTS "Staff can insert test_evaluations" ON public.test_evaluations;
DROP POLICY IF EXISTS "Staff can update test_evaluations" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_select_staff" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_select_candidate" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_insert_staff" ON public.test_evaluations;
DROP POLICY IF EXISTS "rls_test_evaluations_update_staff" ON public.test_evaluations;

CREATE POLICY "rls_test_evaluations_select_staff" ON public.test_evaluations
  FOR SELECT TO authenticated USING (is_staff());

CREATE POLICY "rls_test_evaluations_select_candidate" ON public.test_evaluations
  FOR SELECT TO authenticated USING (
    is_student()
    AND public.owns_test_booking(booking_id)
    AND lower(coalesce(attestation_type, '')) <> 'dsf'
    AND NOT public.test_booking_is_dsf(booking_id)
  );

CREATE POLICY "rls_test_evaluations_insert_staff" ON public.test_evaluations
  FOR INSERT TO authenticated WITH CHECK (is_staff());

CREATE POLICY "rls_test_evaluations_update_staff" ON public.test_evaluations
  FOR UPDATE TO authenticated USING (is_staff()) WITH CHECK (is_staff());

-- ---------------------------------------------------------------------------
-- 3. test_bookings / test_candidates — lecture candidat sur ses seules lignes
-- ---------------------------------------------------------------------------

ALTER TABLE public.test_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_test_bookings_select_candidate" ON public.test_bookings;
CREATE POLICY "rls_test_bookings_select_candidate" ON public.test_bookings
  FOR SELECT TO authenticated USING (
    is_student()
    AND public.owns_test_booking(id)
    AND NOT public.test_booking_is_dsf(id)
  );

DROP POLICY IF EXISTS "rls_test_candidates_select_candidate" ON public.test_candidates;
CREATE POLICY "rls_test_candidates_select_candidate" ON public.test_candidates
  FOR SELECT TO authenticated USING (
    is_student()
    AND student_id IS NOT NULL
    AND student_id = public.get_my_student_id()
  );

-- ---------------------------------------------------------------------------
-- 4. test_phrases / test_criteria — référentiel réservé au staff
-- ---------------------------------------------------------------------------

ALTER TABLE public.test_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage phrases" ON public.test_phrases;
DROP POLICY IF EXISTS "Public can view active phrases" ON public.test_phrases;
DROP POLICY IF EXISTS "rls_test_phrases_select_staff" ON public.test_phrases;
DROP POLICY IF EXISTS "rls_test_phrases_insert_staff" ON public.test_phrases;
DROP POLICY IF EXISTS "rls_test_phrases_update_staff" ON public.test_phrases;
DROP POLICY IF EXISTS "rls_test_phrases_delete_admin" ON public.test_phrases;

CREATE POLICY "rls_test_phrases_select_staff" ON public.test_phrases
  FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_test_phrases_insert_staff" ON public.test_phrases
  FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_test_phrases_update_staff" ON public.test_phrases
  FOR UPDATE TO authenticated USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY "rls_test_phrases_delete_admin" ON public.test_phrases
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Staff can manage criteria" ON public.test_criteria;
DROP POLICY IF EXISTS "Public can view active criteria" ON public.test_criteria;
DROP POLICY IF EXISTS "rls_test_criteria_select_staff" ON public.test_criteria;
DROP POLICY IF EXISTS "rls_test_criteria_insert_staff" ON public.test_criteria;
DROP POLICY IF EXISTS "rls_test_criteria_update_staff" ON public.test_criteria;
DROP POLICY IF EXISTS "rls_test_criteria_delete_admin" ON public.test_criteria;

CREATE POLICY "rls_test_criteria_select_staff" ON public.test_criteria
  FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_test_criteria_insert_staff" ON public.test_criteria
  FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_test_criteria_update_staff" ON public.test_criteria
  FOR UPDATE TO authenticated USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY "rls_test_criteria_delete_admin" ON public.test_criteria
  FOR DELETE TO authenticated USING (is_admin());

-- ---------------------------------------------------------------------------
-- 5. Bucket privé des certificats
--    Chemin imposé : <student_id>/<inscription_id>/<certificate_id>.pdf
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "rls_certificates_storage_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_certificates_storage_select_owner" ON storage.objects;
DROP POLICY IF EXISTS "rls_certificates_storage_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_certificates_storage_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_certificates_storage_delete_admin" ON storage.objects;

CREATE POLICY "rls_certificates_storage_select_staff" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND is_staff());

CREATE POLICY "rls_certificates_storage_select_owner" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'certificates'
    AND is_student()
    AND (storage.foldername(name))[1] = public.get_my_student_id()::text
  );

CREATE POLICY "rls_certificates_storage_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND is_staff());

CREATE POLICY "rls_certificates_storage_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'certificates' AND is_staff())
  WITH CHECK (bucket_id = 'certificates' AND is_staff());

CREATE POLICY "rls_certificates_storage_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'certificates' AND is_admin());

-- ---------------------------------------------------------------------------
-- 6. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'securite_rls_test_evaluations',
  'test_evaluations',
  jsonb_build_object(
    'migration', '20260910090000_secure_test_evaluations_rls',
    'point', 'A',
    'before', 'select/update TO authenticated USING (true)',
    'after', 'staff via is_staff(); candidat via owns_test_booking() hors DSF',
    'tables', jsonb_build_array(
      'test_evaluations', 'test_bookings', 'test_candidates',
      'test_phrases', 'test_criteria'
    ),
    'storage_bucket', 'certificates (privé)'
  )
);
