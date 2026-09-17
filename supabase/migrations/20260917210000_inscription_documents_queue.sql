-- Modèle 2 : file d'attente +30 min (scheduled_reminders DOCUMENT) + cron inactif.
-- Paula active le job depuis /admin/emails après validation des textes.

UPDATE public.email_models
SET cron_jobname = 'send-inscription-documents'
WHERE slug = 'inscription_documents';

DO $$
DECLARE
  target_jobid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-inscription-documents') THEN
    PERFORM cron.unschedule('send-inscription-documents');
  END IF;

  -- Toutes les 10 minutes : traite les rappels DOCUMENT dus (scheduled_for <= now).
  PERFORM cron.schedule(
    'send-inscription-documents',
    '*/10 * * * *',
    $$SELECT public.dispatch_edge_function('send-inscription-documents', '{}'::jsonb, 'send-inscription-documents');$$
  );

  SELECT jobid INTO target_jobid FROM cron.job WHERE jobname = 'send-inscription-documents';
  IF target_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(target_jobid, active := false);
  END IF;
END $$;

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'inscription_documents_queue_cron',
  'cron.job',
  jsonb_build_object(
    'migration', '20260917210000_inscription_documents_queue',
    'job', 'send-inscription-documents',
    'schedule', '*/10 * * * *',
    'active', false,
    'delay_minutes', 30
  );
