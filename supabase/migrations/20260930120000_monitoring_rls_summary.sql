-- RPC admin : résumé RLS pour le dashboard Monitoramento

CREATE OR REPLACE FUNCTION public.monitoring_rls_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy_count integer;
  tables_without text[];
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'user')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT count(*)::integer INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  SELECT coalesce(array_agg(c.relname ORDER BY c.relname), ARRAY[]::text[])
  INTO tables_without
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = false
    AND c.relname NOT LIKE 'pg_%';

  RETURN jsonb_build_object(
    'policyCount', policy_count,
    'tablesWithoutRls', to_jsonb(tables_without)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.monitoring_rls_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.monitoring_rls_summary() TO authenticated;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'monitoring_rls_summary_rpc',
  'pg_policies',
  jsonb_build_object('migration', '20260930120000_monitoring_rls_summary')
);
