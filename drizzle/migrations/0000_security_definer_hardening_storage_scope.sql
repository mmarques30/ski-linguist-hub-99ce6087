-- 1. Toutes les vues du schéma public en security_invoker (la RLS des tables s'applique)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS v
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v'
  LOOP
    BEGIN
      EXECUTE format('ALTER VIEW %s SET (security_invoker = true)', r.v);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'security_invoker skip %: %', r.v, SQLERRM;
    END;
  END LOOP;
END $$;

-- 2. Fonctions SECURITY DEFINER : retirer EXECUTE aux visiteurs anonymes,
--    sauf les points d'entrée publics par jeton (réservation de test, questionnaire,
--    signature de contrat).
DO $$
DECLARE
  r record;
  keep text[] := ARRAY[
    'submit_test_booking_candidate',
    'list_ski_schools_for_test',
    'get_satisfaction_survey_context',
    'submit_satisfaction_survey_by_token',
    'get_instructor_contract_by_signature_token',
    'sign_instructor_contract_by_token'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS f, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    IF NOT (r.proname = ANY(keep)) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.f);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.f);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.f);
    END IF;
  END LOOP;
END $$;

-- Les fonctions de déclencheur et de maintenance ne doivent pas être appelables
-- par un utilisateur connecté (elles tournent via triggers, pg_cron ou service_role).
DO $$
DECLARE
  r record;
  internal text[] := ARRAY[
    'audit_trigger_func',
    'update_updated_at_column',
    'set_inscription_code',
    'handle_new_user',
    'validate_inscription_status_transition',
    'test_evaluations_set_cecrl_label',
    'test_evaluations_verification_guard',
    'dispatch_edge_function',
    '_avancer_statuts_inscriptions',
    'cleanup_zztest_data',
    'match_candidate_to_student'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS f
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.proname = ANY(internal)
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', r.f);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.f);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.f);
  END LOOP;
END $$;

-- 3. Bucket « funding-documents » : rattacher l'accès à l'enregistrement
--    funding_documents (et non au seul bucket_id).
CREATE OR REPLACE FUNCTION public.funding_object_is_linked(_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.funding_documents fd
    JOIN public.funding_requests fr ON fr.id = fd.funding_request_id
    WHERE fd.file_url IS NOT NULL
      AND (fd.file_url = _name OR fd.file_url LIKE '%' || _name)
  )
$function$;

REVOKE ALL ON FUNCTION public.funding_object_is_linked(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.funding_object_is_linked(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "rls_funding_storage_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_funding_storage_delete_admin" ON storage.objects;

CREATE POLICY "rls_funding_storage_select_staff" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'funding-documents'
    AND is_staff()
    AND (public.funding_object_is_linked(name) OR owner = auth.uid())
  );

CREATE POLICY "rls_funding_storage_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'funding-documents'
    AND is_staff()
    AND (public.funding_object_is_linked(name) OR owner = auth.uid())
  )
  WITH CHECK (bucket_id = 'funding-documents' AND is_staff());

CREATE POLICY "rls_funding_storage_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'funding-documents'
    AND is_admin()
    AND (public.funding_object_is_linked(name) OR owner = auth.uid())
  );