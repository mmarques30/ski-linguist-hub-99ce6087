-- Track when J-10 schedule validation alert was sent to Paula
ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS schedule_reminder_sent_at timestamptz;

COMMENT ON COLUMN public.inscriptions.schedule_reminder_sent_at IS 'When the J-10 email alert was sent to admin for schedule validation';

CREATE INDEX IF NOT EXISTS idx_inscriptions_schedule_reminder
  ON public.inscriptions (start_date, schedule_status)
  WHERE schedule_status = 'pending' AND schedule_reminder_sent_at IS NULL;

-- Email template for schedule validation digest
INSERT INTO public.email_templates (slug, subject_fr, subject_en, subject_pt, body_fr, body_en, body_pt, variables)
SELECT
  'schedule_validation_reminder',
  'FLI — Validation des horaires (J-10) — {{total_count}} inscription(s)',
  'FLI — Schedule validation (D-10) — {{total_count}} enrollment(s)',
  'FLI — Validação de horários (D-10) — {{total_count}} inscrição(ões)',
  '<h2>Bonjour Paula,</h2><p>Des inscriptions débutent dans <strong>10 jours</strong> ({{start_date}}) et nécessitent la validation des groupes matin/après-midi.</p>{{groups_html}}<p><a href="{{dashboard_url}}">Ouvrir les inscriptions →</a></p><p>Cordialement,<br/>Système FLI</p>',
  '<h2>Hello Paula,</h2><p>Enrollments start in <strong>10 days</strong> ({{start_date}}) and require morning/afternoon group validation.</p>{{groups_html}}<p><a href="{{dashboard_url}}">Open enrollments →</a></p><p>Best regards,<br/>FLI System</p>',
  '<h2>Olá Paula,</h2><p>Inscrições começam em <strong>10 dias</strong> ({{start_date}}) e precisam de validação dos grupos manhã/tarde.</p>{{groups_html}}<p><a href="{{dashboard_url}}">Abrir inscrições →</a></p><p>Atenciosamente,<br/>Sistema FLI</p>',
  '["start_date","total_count","groups_html","dashboard_url"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates WHERE slug = 'schedule_validation_reminder'
);

-- Daily cron at 08:00 UTC — 10 days before course start
SELECT cron.schedule(
  'process-schedule-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-schedule-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);
