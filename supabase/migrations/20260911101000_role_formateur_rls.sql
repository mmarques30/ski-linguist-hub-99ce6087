-- C.1 — rôle formateur : plus staff, RLS limitée à ses tests, vue invocateur.
-- Script de retour : docs/POINT_C1_ROLE_FORMATEUR.md

-- ---------------------------------------------------------------------------
-- 1. Lien compte ↔ fiche formateur
-- ---------------------------------------------------------------------------

ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'instructors_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.instructors
      ADD CONSTRAINT instructors_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_instructors_auth_user_id
  ON public.instructors (auth_user_id);

COMMENT ON COLUMN public.instructors.auth_user_id IS
  'Compte Auth du formateur (rôle app_role = formateur). NULL = pas de connexion.';

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_formateur()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'formateur'
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_my_instructor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.instructors
  WHERE auth_user_id = auth.uid()
  LIMIT 1
$function$;

-- is_staff : uniquement admin / user. Un formateur n'est plus « tout sauf stagiaire ».
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::public.app_role, 'user'::public.app_role)
  )
$function$;

CREATE OR REPLACE FUNCTION public.formateur_owns_booking(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.test_bookings b
    WHERE b.id = _booking_id
      AND b.instructor_id IS NOT NULL
      AND b.instructor_id = public.get_my_instructor_id()
  )
$function$;

CREATE OR REPLACE FUNCTION public.formateur_owns_candidate(_candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.test_bookings b
    WHERE b.candidate_id = _candidate_id
      AND b.instructor_id IS NOT NULL
      AND b.instructor_id = public.get_my_instructor_id()
  )
$function$;

CREATE OR REPLACE FUNCTION public.formateur_sees_ski_school(_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.test_bookings b
    JOIN public.test_candidates c ON c.id = b.candidate_id
    WHERE c.ski_school_id = _school_id
      AND b.instructor_id IS NOT NULL
      AND b.instructor_id = public.get_my_instructor_id()
  )
$function$;

GRANT EXECUTE ON FUNCTION public.is_formateur() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_instructor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.formateur_owns_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.formateur_owns_candidate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.formateur_sees_ski_school(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Vues : security_invoker pour que la RLS des tables s'applique
--    (test_bookings_complete était definer : un formateur voyait toutes les
--    réservations malgré les politiques sur test_bookings).
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER VIEW %I.%I SET (security_invoker = true)',
        r.nspname,
        r.relname
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'security_invoker skip %.%: %', r.nspname, r.relname, SQLERRM;
    END;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Politiques formateur
-- ---------------------------------------------------------------------------

-- instructors : sa fiche uniquement (lecture)
DROP POLICY IF EXISTS "rls_instructors_select_formateur" ON public.instructors;
CREATE POLICY "rls_instructors_select_formateur"
  ON public.instructors
  FOR SELECT TO authenticated
  USING (public.is_formateur() AND id = public.get_my_instructor_id());

-- test_bookings : lecture + maj statut (le formulaire d'évaluation pose status = evaluated)
DROP POLICY IF EXISTS "rls_test_bookings_select_formateur" ON public.test_bookings;
CREATE POLICY "rls_test_bookings_select_formateur"
  ON public.test_bookings
  FOR SELECT TO authenticated
  USING (public.is_formateur() AND public.formateur_owns_booking(id));

DROP POLICY IF EXISTS "rls_test_bookings_update_formateur" ON public.test_bookings;
CREATE POLICY "rls_test_bookings_update_formateur"
  ON public.test_bookings
  FOR UPDATE TO authenticated
  USING (public.is_formateur() AND public.formateur_owns_booking(id))
  WITH CHECK (public.is_formateur() AND public.formateur_owns_booking(id));

-- test_candidates : candidats de ses réservations
DROP POLICY IF EXISTS "rls_test_candidates_select_formateur" ON public.test_candidates;
CREATE POLICY "rls_test_candidates_select_formateur"
  ON public.test_candidates
  FOR SELECT TO authenticated
  USING (public.is_formateur() AND public.formateur_owns_candidate(id));

-- test_evaluations : CRUD limité à ses bookings (pas de DELETE)
DROP POLICY IF EXISTS "rls_test_evaluations_select_formateur" ON public.test_evaluations;
CREATE POLICY "rls_test_evaluations_select_formateur"
  ON public.test_evaluations
  FOR SELECT TO authenticated
  USING (public.is_formateur() AND public.formateur_owns_booking(booking_id));

DROP POLICY IF EXISTS "rls_test_evaluations_insert_formateur" ON public.test_evaluations;
CREATE POLICY "rls_test_evaluations_insert_formateur"
  ON public.test_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_formateur() AND public.formateur_owns_booking(booking_id));

DROP POLICY IF EXISTS "rls_test_evaluations_update_formateur" ON public.test_evaluations;
CREATE POLICY "rls_test_evaluations_update_formateur"
  ON public.test_evaluations
  FOR UPDATE TO authenticated
  USING (public.is_formateur() AND public.formateur_owns_booking(booking_id))
  WITH CHECK (public.is_formateur() AND public.formateur_owns_booking(booking_id));

-- Référentiel phrases / critères : lecture seule (formulaire d'évaluation)
DROP POLICY IF EXISTS "rls_test_phrases_select_formateur" ON public.test_phrases;
CREATE POLICY "rls_test_phrases_select_formateur"
  ON public.test_phrases
  FOR SELECT TO authenticated
  USING (public.is_formateur());

DROP POLICY IF EXISTS "rls_test_criteria_select_formateur" ON public.test_criteria;
CREATE POLICY "rls_test_criteria_select_formateur"
  ON public.test_criteria
  FOR SELECT TO authenticated
  USING (public.is_formateur());

-- ski_schools : nom d'école dans test_bookings_complete (LEFT JOIN)
DROP POLICY IF EXISTS "rls_ski_schools_select_formateur" ON public.ski_schools;
CREATE POLICY "rls_ski_schools_select_formateur"
  ON public.ski_schools
  FOR SELECT TO authenticated
  USING (public.is_formateur() AND public.formateur_sees_ski_school(id));

-- ---------------------------------------------------------------------------
-- 5. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'c1_role_formateur_rls',
  'instructors',
  jsonb_build_object(
    'migration', '20260911101000_role_formateur_rls',
    'point', 'C.1',
    'is_staff', 'admin|user only (formateur excluded)',
    'auth_user_id', 'instructors.auth_user_id',
    'views', 'public views security_invoker=true',
    'tables', jsonb_build_array(
      'test_evaluations', 'test_bookings', 'test_candidates',
      'test_phrases', 'test_criteria', 'instructors', 'ski_schools'
    )
  )
);
