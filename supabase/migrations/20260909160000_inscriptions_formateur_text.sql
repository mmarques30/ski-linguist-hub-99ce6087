-- Point 3 complément — conserver le libellé Excel « Formateur » sur inscriptions
-- Réversible : section DOWN

ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS formateur text,
  ADD COLUMN IF NOT EXISTS formateur_email text,
  ADD COLUMN IF NOT EXISTS formateur_telephone text;

COMMENT ON COLUMN public.inscriptions.formateur IS
  'Nom formateur tel qu''écrit dans Excel/CSV (avant rattachement instructor_id). Paula valide le rapprochement ligne à ligne.';
COMMENT ON COLUMN public.inscriptions.formateur_email IS
  'e-mail Prof du CSV d''import (aide au rapprochement).';
COMMENT ON COLUMN public.inscriptions.formateur_telephone IS
  'Tél Prof du CSV d''import (aide au rapprochement).';

-- =============================================================================
-- DOWN
-- =============================================================================
-- ALTER TABLE public.inscriptions
--   DROP COLUMN IF EXISTS formateur,
--   DROP COLUMN IF EXISTS formateur_email,
--   DROP COLUMN IF EXISTS formateur_telephone;
