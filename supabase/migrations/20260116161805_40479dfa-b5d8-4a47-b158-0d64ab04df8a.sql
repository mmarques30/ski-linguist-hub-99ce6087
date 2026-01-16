-- Add unique constraint for upsert on fixed_costs (mois + cost_type)
ALTER TABLE public.fixed_costs 
ADD CONSTRAINT fixed_costs_mois_cost_type_unique UNIQUE (mois, cost_type);

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run on the 1st of each month at 2:00 AM UTC
SELECT cron.schedule(
  'generate-monthly-charges',
  '0 2 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://nghkrmvakjomzmfwdhbo.supabase.co/functions/v1/generate-monthly-charges',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);