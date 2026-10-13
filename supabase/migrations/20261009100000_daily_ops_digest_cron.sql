-- Digest ops matinal (Paula 09/10/2026) — résumé dossiers + actions → info@fli.fr
-- Cron créé inactif : activer après validation du format (comme les autres crons email).

INSERT INTO public.email_models (
  model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname
)
VALUES (
  'daily_ops_digest',
  13,
  'Digest ops matinal',
  'Résumé des dossiers récents et actions à réaliser (acompte, chèque, dossier, début imminent). Destinataire interne info@fli.fr.',
  'interne',
  'send-daily-ops-digest',
  'send-daily-ops-digest'
)
ON CONFLICT (model_key) DO UPDATE SET
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

DO $$
DECLARE
  target_jobid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-ops-digest') THEN
    PERFORM cron.unschedule('send-daily-ops-digest');
  END IF;

  -- 06:00 UTC ≈ 07:00/08:00 Europe/Paris selon l'heure d'été
  PERFORM cron.schedule(
    'send-daily-ops-digest',
    '0 6 * * *',
    $cron$SELECT public.dispatch_edge_function(
      'send-daily-ops-digest',
      '{}'::jsonb,
      'send-daily-ops-digest',
      public.email_crons_dispatch_query()
    );$cron$
  );

  SELECT jobid INTO target_jobid FROM cron.job WHERE jobname = 'send-daily-ops-digest';
  PERFORM cron.alter_job(target_jobid, active := false);
END $$;
