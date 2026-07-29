-- Lier les écoles de ski (ESF et autres) aux partenaires organisationnels

ALTER TABLE public.ski_schools
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS school_kind text CHECK (school_kind IN ('esf', 'ecole_ski', 'autre')),
  ADD COLUMN IF NOT EXISTS station text;

COMMENT ON COLUMN public.ski_schools.partner_id IS 'Partenaire organisation (école de ski hôte)';
COMMENT ON COLUMN public.ski_schools.school_kind IS 'esf | ecole_ski (non-ESF) | autre';
COMMENT ON COLUMN public.ski_schools.station IS 'Station normalisée pour matching';

CREATE INDEX IF NOT EXISTS idx_ski_schools_partner ON public.ski_schools(partner_id);
CREATE INDEX IF NOT EXISTS idx_ski_schools_station ON public.ski_schools(station);
