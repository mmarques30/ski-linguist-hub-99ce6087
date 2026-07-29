-- Logement du formateur (pas du stagiaire) par inscription
ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS instructor_accommodation_dates text,
  ADD COLUMN IF NOT EXISTS instructor_accommodation_address text,
  ADD COLUMN IF NOT EXISTS instructor_accommodation_notes text;

COMMENT ON COLUMN public.inscriptions.instructor_accommodation_dates IS 'Dates du logement du formateur pour ce stage';
COMMENT ON COLUMN public.inscriptions.instructor_accommodation_address IS 'Adresse du logement du formateur';
COMMENT ON COLUMN public.inscriptions.instructor_accommodation_notes IS 'Observations logement formateur';
