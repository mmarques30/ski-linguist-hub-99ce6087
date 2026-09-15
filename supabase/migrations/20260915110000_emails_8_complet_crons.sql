-- Point 8 complet — crons pg_net (BL-007)
--
-- État avant : les deux jobs existants étaient « active », et échouaient
-- chaque jour depuis des mois avec
--     ERROR: schema "net" does not exist
-- parce que la commande appelait net.http_post directement et lisait
-- current_setting('app.settings.service_role_key') qui n'est pas posé.
--
-- Correctif : les jobs n'appellent plus que public.dispatch_edge_function(),
-- qui résout net.http_post avec un search_path fixe, lit son URL dans
-- public.edge_dispatch_config, sa clé dans le Vault (jamais dans le dépôt)
-- et journalise chaque appel dans public.edge_dispatch_log.
--
-- Les trois jobs qui envoient des emails sont (re)créés INACTIFS :
-- l'activation se fait modèle par modèle depuis /admin/emails, après
-- validation du texte correspondant.
--
-- generate-monthly-charges reste ACTIF : il n'envoie aucun email, il fait
-- un upsert sur (mois, cost_type) du mois courant, donc il est idempotent
-- et ne rattrape aucun arriéré. Seule sa commande est corrigée.

-- ---------------------------------------------------------------------------
-- 1. Configuration (aucun secret)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.edge_dispatch_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.edge_dispatch_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read edge_dispatch_config" ON public.edge_dispatch_config;
CREATE POLICY "Admin can read edge_dispatch_config" ON public.edge_dispatch_config
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can write edge_dispatch_config" ON public.edge_dispatch_config;
CREATE POLICY "Admin can write edge_dispatch_config" ON public.edge_dispatch_config
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.edge_dispatch_config (key, value, description) VALUES
  ('functions_base_url',
   'https://nghkrmvakjomzmfwdhbo.supabase.co/functions/v1',
   'Racine des fonctions Edge appelées par les crons.'),
  ('vault_secret_name',
   'edge_dispatch_jwt',
   'Nom du secret Vault contenant le JWT envoyé en Authorization. Secret absent = appel sans en-tête.')
ON CONFLICT (key) DO NOTHING;

-- Les fonctions Edge appelées par les crons lisent elles-mêmes
-- SUPABASE_SERVICE_ROLE_KEY dans leur propre environnement : le JWT du cron ne
-- sert qu'à franchir verify_jwt. La clé anon (déjà publique, présente dans .env)
-- suffit donc, et évite de stocker la clé service_role en base. Paula peut
-- remplacer la valeur du secret sans toucher au code si besoin.
DO $$
DECLARE
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5naGtybXZha2pvbXptZndkaGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDIzMjUsImV4cCI6MjA4MzUxODMyNX0.mgAmQpO28Au607Hu3TMjTErQaTvRijbD98WEs954qBU';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'edge_dispatch_jwt') THEN
    PERFORM vault.create_secret(
      anon_key,
      'edge_dispatch_jwt',
      'JWT envoyé en Authorization par les crons (clé anon, suffit pour verify_jwt).'
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Journal des appels sortants
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.edge_dispatch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  jobname text,
  request_id bigint,
  auth_mode text NOT NULL,
  triggered_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_dispatch_log_created_at
  ON public.edge_dispatch_log (created_at DESC);

ALTER TABLE public.edge_dispatch_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read edge_dispatch_log" ON public.edge_dispatch_log;
CREATE POLICY "Admin can read edge_dispatch_log" ON public.edge_dispatch_log
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Appel sortant unique, journalisé
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.dispatch_edge_function(
  p_function text,
  p_body jsonb DEFAULT '{}'::jsonb,
  p_jobname text DEFAULT NULL,
  p_query text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net', 'vault'
AS $function$
DECLARE
  base_url text;
  secret_name text;
  service_key text;
  headers jsonb;
  auth_mode text := 'aucun';
  target text;
  req_id bigint;
BEGIN
  SELECT value INTO base_url FROM public.edge_dispatch_config WHERE key = 'functions_base_url';
  IF base_url IS NULL THEN
    RAISE EXCEPTION 'edge_dispatch_config.functions_base_url absent'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT value INTO secret_name FROM public.edge_dispatch_config WHERE key = 'vault_secret_name';

  IF secret_name IS NOT NULL THEN
    BEGIN
      SELECT decrypted_secret INTO service_key
      FROM vault.decrypted_secrets
      WHERE name = secret_name
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      service_key := NULL;
    END;
  END IF;

  headers := jsonb_build_object('Content-Type', 'application/json');
  IF service_key IS NOT NULL AND btrim(service_key) <> '' THEN
    headers := headers || jsonb_build_object('Authorization', 'Bearer ' || service_key);
    auth_mode := 'vault_jwt';
  END IF;

  target := base_url || '/' || p_function || coalesce(p_query, '');

  SELECT net.http_post(
    url := target,
    body := coalesce(p_body, '{}'::jsonb),
    headers := headers,
    timeout_milliseconds := 30000
  ) INTO req_id;

  INSERT INTO public.edge_dispatch_log (function_name, jobname, request_id, auth_mode, triggered_by, note)
  VALUES (p_function, p_jobname, req_id, auth_mode, auth.uid(), coalesce(p_query, ''));

  RETURN req_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.dispatch_edge_function(text, jsonb, text, text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 4. Pilotage des crons depuis /admin/emails
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_email_cron_active(p_jobname text, p_active boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_jobid bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Réservé à un compte administrateur'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.email_models WHERE cron_jobname = p_jobname
  ) THEN
    RAISE EXCEPTION 'Job % hors périmètre des modèles d''emails', p_jobname
      USING ERRCODE = '42501';
  END IF;

  SELECT jobid INTO target_jobid FROM cron.job WHERE jobname = p_jobname;
  IF target_jobid IS NULL THEN
    RAISE EXCEPTION 'Aucun cron nommé %', p_jobname
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM cron.alter_job(target_jobid, active := p_active);

  INSERT INTO public.audit_log (user_id, action, table_name, new_values)
  VALUES (
    auth.uid(),
    CASE WHEN p_active THEN 'email_cron_active' ELSE 'email_cron_desactive' END,
    'cron.job',
    jsonb_build_object('jobname', p_jobname, 'active', p_active)
  );

  RETURN jsonb_build_object('jobname', p_jobname, 'active', p_active);
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_email_cron_now(p_jobname text, p_dry_run boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fn text;
  req_id bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Réservé à un compte administrateur'
      USING ERRCODE = '42501';
  END IF;

  SELECT edge_function INTO fn
  FROM public.email_models
  WHERE cron_jobname = p_jobname;

  IF fn IS NULL THEN
    RAISE EXCEPTION 'Job % hors périmètre des modèles d''emails', p_jobname
      USING ERRCODE = '42501';
  END IF;

  req_id := public.dispatch_edge_function(
    fn, '{}'::jsonb, p_jobname,
    CASE WHEN p_dry_run THEN '?dry_run=true' ELSE NULL END
  );

  RETURN jsonb_build_object('jobname', p_jobname, 'function', fn, 'dry_run', p_dry_run, 'request_id', req_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.set_email_cron_active(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_email_cron_now(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_email_cron_active(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_email_cron_now(text, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. (Re)création des jobs
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  spec record;
  target_jobid bigint;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('process-invoice-reminders',  '0 9 * * *',  'process-invoice-reminders',  false),
      ('process-schedule-reminders', '15 7 * * *', 'process-schedule-reminders', false),
      ('process-survey-reminders',   '15 8 * * *', 'process-survey-reminders',   false),
      ('generate-monthly-charges',   '0 2 1 * *',  'generate-monthly-charges',   true)
    ) AS t(jobname, schedule, fn, keep_active)
  LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = spec.jobname) THEN
      PERFORM cron.unschedule(spec.jobname);
    END IF;

    PERFORM cron.schedule(
      spec.jobname,
      spec.schedule,
      format(
        'SELECT public.dispatch_edge_function(%L, ''{}''::jsonb, %L);',
        spec.fn, spec.jobname
      )
    );

    SELECT jobid INTO target_jobid FROM cron.job WHERE jobname = spec.jobname;
    PERFORM cron.alter_job(target_jobid, active := spec.keep_active);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'emails_8_complet_crons',
  'cron.job',
  jsonb_build_object(
    'migration', '20260915110000_emails_8_complet_crons',
    'jobs', (SELECT jsonb_object_agg(jobname, active) FROM cron.job),
    'actifs', (SELECT count(*) FROM cron.job WHERE active),
    'secret_vault_pose', EXISTS (
      SELECT 1 FROM vault.secrets WHERE name = 'edge_service_role_key'
    )
  );
