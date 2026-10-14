CREATE TABLE IF NOT EXISTS public.cron_dispatch_secret (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  token text NOT NULL DEFAULT (replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.cron_dispatch_secret FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.cron_dispatch_secret TO service_role;
ALTER TABLE public.cron_dispatch_secret ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.cron_dispatch_secret IS 'Jeton cron dédié, généré en base. Lu par dispatch_edge_function et par admin-auth (service_role). Aucune policy.';
INSERT INTO public.cron_dispatch_secret (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.dispatch_edge_function(p_function text, p_body jsonb DEFAULT '{}'::jsonb, p_jobname text DEFAULT NULL::text, p_query text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net'
AS $function$
DECLARE
  base_url text;
  cron_token text;
  headers jsonb;
  auth_mode text := 'aucun';
  target text;
  req_id bigint;
  anon_key constant text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5naGtybXZha2pvbXptZndkaGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDIzMjUsImV4cCI6MjA4MzUxODMyNX0.mgAmQpO28Au607Hu3TMjTErQaTvRijbD98WEs954qBU';
BEGIN
  SELECT value INTO base_url FROM public.edge_dispatch_config WHERE key = 'functions_base_url';
  IF base_url IS NULL THEN
    RAISE EXCEPTION 'edge_dispatch_config.functions_base_url absent'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT token INTO cron_token FROM public.cron_dispatch_secret WHERE id = true;

  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || anon_key,
    'apikey', anon_key
  );
  IF cron_token IS NOT NULL AND btrim(cron_token) <> '' THEN
    headers := headers || jsonb_build_object('x-cron-dispatch-token', cron_token);
    auth_mode := 'cron_token';
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