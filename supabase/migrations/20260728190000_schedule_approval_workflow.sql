-- Schedule assignment workflow: Paula approves matin/apres-midi ~10 days before course start
ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS schedule_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS schedule_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_approved_by uuid;

COMMENT ON COLUMN public.inscriptions.schedule_status IS 'pending | matin | apres-midi — requires admin approval before course start';
COMMENT ON COLUMN public.inscriptions.schedule_approved_at IS 'Timestamp when schedule was approved by admin (Paula)';
COMMENT ON COLUMN public.inscriptions.schedule_approved_by IS 'Auth user id of admin who approved the schedule';

CREATE INDEX IF NOT EXISTS idx_inscriptions_schedule_status ON public.inscriptions(schedule_status);
