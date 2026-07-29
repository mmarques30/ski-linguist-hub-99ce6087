-- Référence ESF nationale (BD directeurs) pour upsert et synchronisation

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS esf_code text;

COMMENT ON COLUMN public.partners.esf_code IS 'Code ESF national (BD directeurs)';

CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_esf_code
  ON public.partners(esf_code)
  WHERE esf_code IS NOT NULL;
