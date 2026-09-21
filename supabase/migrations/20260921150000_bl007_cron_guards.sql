-- BL-007 suite — garde-fous crons email (Paula 21/09/2026)
--
-- 1. Marqueur d'origine sur invoices (import historique vs émise app).
-- 2. Crons planifiés passent par le même dry_run que run_email_cron_now
--    tant que app_settings.email_crons_live n'est pas true.
-- 3. Jobs restent inactifs : réactivation un par un après preuve ZZTEST.

-- ---------------------------------------------------------------------------
-- 1. invoices.origin
-- ---------------------------------------------------------------------------

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'app';

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_origin_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_origin_check
  CHECK (origin IN ('app', 'import_historique'));

COMMENT ON COLUMN public.invoices.origin IS
  'BL-007 : app = émise par la plateforme ; import_historique = CSV point 9. '
  'Les relances automatiques ignorent import_historique.';

-- Cohorte actuelle = import du 15/09/2026 (1292 lignes, seq ≤ 14302).
UPDATE public.invoices
SET origin = 'import_historique'
WHERE origin = 'app'
  AND (
    created_at::date = DATE '2026-09-15'
    OR (sequence_number IS NOT NULL AND sequence_number <= 14302)
  );

-- ---------------------------------------------------------------------------
-- 2. Setting : envoi réel des crons planifiés (défaut = simulation)
-- ---------------------------------------------------------------------------

INSERT INTO public.app_settings (key, value)
VALUES ('email_crons_live', 'false'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.email_crons_dispatch_query()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN COALESCE(
      (SELECT value #>> '{}' FROM public.app_settings WHERE key = 'email_crons_live'),
      'false'
    ) IN ('true', '1', 'oui')
    THEN NULL
    ELSE '?dry_run=true'
  END;
$$;

REVOKE ALL ON FUNCTION public.email_crons_dispatch_query() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_crons_dispatch_query() TO postgres;
GRANT EXECUTE ON FUNCTION public.email_crons_dispatch_query() TO service_role;

COMMENT ON FUNCTION public.email_crons_dispatch_query() IS
  'BL-007 : suffixe ?dry_run=true pour les crons planifiés tant que email_crons_live ≠ true.';

-- ---------------------------------------------------------------------------
-- 3. Recréer les 3 jobs email avec dry_run conditionnel (restent inactifs)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  spec record;
  target_jobid bigint;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('process-invoice-reminders',  '0 9 * * *',  'process-invoice-reminders'),
      ('process-schedule-reminders', '15 7 * * *', 'process-schedule-reminders'),
      ('process-survey-reminders',   '15 8 * * *', 'process-survey-reminders')
    ) AS t(jobname, schedule, fn)
  LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = spec.jobname) THEN
      PERFORM cron.unschedule(spec.jobname);
    END IF;

    PERFORM cron.schedule(
      spec.jobname,
      spec.schedule,
      format(
        'SELECT public.dispatch_edge_function(%L, ''{}''::jsonb, %L, public.email_crons_dispatch_query());',
        spec.fn,
        spec.jobname
      )
    );

    SELECT jobid INTO target_jobid FROM cron.job WHERE jobname = spec.jobname;
    PERFORM cron.alter_job(target_jobid, active := false);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'bl007_cron_guards',
  'invoices',
  jsonb_build_object(
    'migration', '20260921150000_bl007_cron_guards',
    'origin_import_historique', (
      SELECT count(*) FROM public.invoices WHERE origin = 'import_historique'
    ),
    'origin_app', (
      SELECT count(*) FROM public.invoices WHERE origin = 'app'
    ),
    'email_crons_live', (
      SELECT value FROM public.app_settings WHERE key = 'email_crons_live'
    ),
    'jobs_active', (
      SELECT jsonb_object_agg(jobname, active)
      FROM cron.job
      WHERE jobname IN (
        'process-invoice-reminders',
        'process-schedule-reminders',
        'process-survey-reminders'
      )
    )
  );
