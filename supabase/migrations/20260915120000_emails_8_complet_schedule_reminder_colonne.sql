-- Point 8 complet — rattrapage de dérive : inscriptions.schedule_reminder_sent_at
--
-- La migration 20260728193000_schedule_reminder_alerts.sql n'a jamais été
-- appliquée sur la base hébergée : la colonne et son index étaient absents,
-- et le cron process-schedule-reminders n'existait pas.
--
-- Conséquence observée en live avant correctif : la fonction Edge
-- process-schedule-reminders filtrait sur .is('schedule_reminder_sent_at', null),
-- PostgREST renvoyait une erreur de colonne inconnue, et la fonction répondait
-- HTTP 500 {"success":false,"error":"Internal error"} — y compris en dry_run.
--
-- Ce rattrapage est idempotent et ne touche aucune donnée existante.

ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS schedule_reminder_sent_at timestamptz;

COMMENT ON COLUMN public.inscriptions.schedule_reminder_sent_at IS
  'Horodatage de l''alerte J-10 envoyée à l''administration pour validation des horaires.';

CREATE INDEX IF NOT EXISTS idx_inscriptions_schedule_reminder
  ON public.inscriptions (start_date, schedule_status)
  WHERE schedule_status = 'pending' AND schedule_reminder_sent_at IS NULL;

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'emails_8_complet_schedule_reminder_colonne',
  'inscriptions',
  jsonb_build_object(
    'migration', '20260915120000_emails_8_complet_schedule_reminder_colonne',
    'colonne_presente', EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'inscriptions'
        AND column_name = 'schedule_reminder_sent_at'
    ),
    'a_relancer', (
      SELECT count(*) FROM public.inscriptions
      WHERE schedule_status = 'pending' AND schedule_reminder_sent_at IS NULL
    )
  );
