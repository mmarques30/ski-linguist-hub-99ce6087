ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS expansion_channel text NOT NULL DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS cpf_amount_available numeric,
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS course_interest text,
  ADD COLUMN IF NOT EXISTS expected_volume integer;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_expansion_channel_check
  CHECK (expansion_channel IN ('cpf', 'b2b', 'dsf', 'moniteur_ski'));

CREATE INDEX IF NOT EXISTS leads_expansion_channel_idx ON public.leads (expansion_channel);