-- Onda D8: CRM fields on leads (project dates, ski monitor link)
-- loss_reason, assigned_to, estimated_students already exist on public.leads

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS project_start date,
  ADD COLUMN IF NOT EXISTS project_end date,
  ADD COLUMN IF NOT EXISTS ski_monitor_id uuid REFERENCES public.ski_monitors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_ski_monitor_id ON public.leads(ski_monitor_id);

COMMENT ON COLUMN public.leads.project_start IS 'Date de début du projet commercial';
COMMENT ON COLUMN public.leads.project_end IS 'Date de fin du projet commercial';
COMMENT ON COLUMN public.leads.ski_monitor_id IS 'Moniteur ski lié (canal moniteur_ski)';
