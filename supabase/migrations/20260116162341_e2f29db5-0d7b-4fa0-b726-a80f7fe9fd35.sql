-- Add columns to track invoice payment reminders
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS reminder_1_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_2_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_3_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of overdue invoices
CREATE INDEX IF NOT EXISTS idx_invoices_overdue 
ON public.invoices (due_date, status) 
WHERE status IN ('draft', 'sent');

-- Schedule the invoice reminders edge function to run daily at 9:00 AM UTC
SELECT cron.schedule(
  'process-invoice-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-invoice-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);