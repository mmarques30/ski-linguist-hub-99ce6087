-- Expansion channels: CPF, B2B (Alpespace), DSF (Fédération)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS expansion_channel text NOT NULL DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS cpf_amount_available numeric,
  ADD COLUMN IF NOT EXISTS course_interest text,
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS expected_volume integer;

COMMENT ON COLUMN public.leads.expansion_channel IS 'cpf | b2b | dsf';
COMMENT ON COLUMN public.leads.cpf_amount_available IS 'CPF: montant disponible en euros';
COMMENT ON COLUMN public.leads.course_interest IS 'CPF: formation souhaitée';
COMMENT ON COLUMN public.leads.project_name IS 'DSF: nom du projet';
COMMENT ON COLUMN public.leads.expected_volume IS 'DSF: volume prévu de stagiaires';

CREATE INDEX IF NOT EXISTS idx_leads_expansion_channel ON public.leads(expansion_channel);

-- Backfill existing leads: ESF/partner → b2b, rest → cpf
UPDATE public.leads SET expansion_channel = 'b2b' WHERE source = 'esf' AND expansion_channel = 'cpf';
UPDATE public.leads SET expansion_channel = 'dsf' WHERE notes ILIKE '%dsf%' AND expansion_channel = 'cpf';
