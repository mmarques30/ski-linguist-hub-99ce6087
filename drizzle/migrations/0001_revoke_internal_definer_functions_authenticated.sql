-- Fonctions de déclencheur / import réservées au service_role
DO $$
DECLARE
  r record;
  internal text[] := ARRAY[
    'on_funding_status_change',
    'prospection_gelee',
    'import_point9_invoices',
    'import_point9_payments'
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