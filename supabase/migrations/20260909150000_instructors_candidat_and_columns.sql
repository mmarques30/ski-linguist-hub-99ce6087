-- Point 3 — instructors : statut candidat + colonnes dédiées formateur·rices
-- Réversible : section DOWN en bas (docs/POINT_3_IMPORT_FORMATEURS.md)

-- 1) Nouvelles colonnes (toutes nullable)
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS alias text[],
  ADD COLUMN IF NOT EXISTS civilite text,
  ADD COLUMN IF NOT EXISTS pays text,
  ADD COLUMN IF NOT EXISTS statut_administratif text,
  ADD COLUMN IF NOT EXISTS identifiant_etranger text,
  ADD COLUMN IF NOT EXISTS assujetti_tva boolean,
  ADD COLUMN IF NOT EXISTS consentement_temoignage text,
  ADD COLUMN IF NOT EXISTS consentement_photo text,
  ADD COLUMN IF NOT EXISTS cv_url text,
  ADD COLUMN IF NOT EXISTS formulaire_2026 boolean,
  ADD COLUMN IF NOT EXISTS date_naissance date;

COMMENT ON COLUMN public.instructors.alias IS
  'Alias / variantes de nom pour rapprochement inscriptions.formateur et CSV facturation.';
COMMENT ON COLUMN public.instructors.statut_administratif IS
  'Statut administratif libre (Qualiopi indicateur 27).';
COMMENT ON COLUMN public.instructors.identifiant_etranger IS
  'Identifiant fiscal étranger si hors SIRET (Qualiopi 27).';
COMMENT ON COLUMN public.instructors.assujetti_tva IS
  'Assujetti à la TVA — conditionne factures de sous-traitance.';
COMMENT ON COLUMN public.instructors.consentement_temoignage IS
  'RGPD : oui | oui avec relecture | non | NULL (vide).';
COMMENT ON COLUMN public.instructors.consentement_photo IS
  'RGPD : oui | oui avec relecture | non | NULL (vide).';
COMMENT ON COLUMN public.instructors.cv_url IS
  'Lien CV (dossier formateur / futurs contrats).';
COMMENT ON COLUMN public.instructors.formulaire_2026 IS
  'Formulaire saison 2026 reçu (oui/non).';
COMMENT ON COLUMN public.instructors.date_naissance IS
  'Date de naissance (dossier formateur).';
COMMENT ON COLUMN public.instructors.civilite IS
  'Civilité (Madame / Monsieur / …).';
COMMENT ON COLUMN public.instructors.pays IS
  'Pays de résidence.';

-- 2) Contraintes consentements
ALTER TABLE public.instructors DROP CONSTRAINT IF EXISTS instructors_consentement_temoignage_check;
ALTER TABLE public.instructors
  ADD CONSTRAINT instructors_consentement_temoignage_check
  CHECK (
    consentement_temoignage IS NULL
    OR consentement_temoignage = ANY (ARRAY['oui'::text, 'oui avec relecture'::text, 'non'::text])
  );

ALTER TABLE public.instructors DROP CONSTRAINT IF EXISTS instructors_consentement_photo_check;
ALTER TABLE public.instructors
  ADD CONSTRAINT instructors_consentement_photo_check
  CHECK (
    consentement_photo IS NULL
    OR consentement_photo = ANY (ARRAY['oui'::text, 'oui avec relecture'::text, 'non'::text])
  );

-- 3) Statut : actif | inactif | candidat (remplace ACTIF/INACTIF/A_EVITER)
UPDATE public.instructors
SET status = CASE lower(status)
  WHEN 'actif' THEN 'actif'
  WHEN 'active' THEN 'actif'
  WHEN 'inactif' THEN 'inactif'
  WHEN 'inactive' THEN 'inactif'
  WHEN 'candidat' THEN 'candidat'
  WHEN 'a_eviter' THEN 'inactif'
  ELSE lower(coalesce(status, 'inactif'))
END
WHERE status IS NOT NULL;

UPDATE public.instructors
SET is_active = (status = 'actif')
WHERE status IS NOT NULL;

ALTER TABLE public.instructors DROP CONSTRAINT IF EXISTS instructors_status_check;
ALTER TABLE public.instructors
  ADD CONSTRAINT instructors_status_check
  CHECK (status = ANY (ARRAY['actif'::text, 'inactif'::text, 'candidat'::text]));

COMMENT ON CONSTRAINT instructors_status_check ON public.instructors IS
  'actif = affectable ; inactif = historique BPF ; candidat = recrutement (passage actif = action Paula).';

-- =============================================================================
-- DOWN (réversible — ne pas exécuter en prod sans validation Paula)
-- =============================================================================
-- ALTER TABLE public.instructors DROP CONSTRAINT IF EXISTS instructors_status_check;
-- ALTER TABLE public.instructors DROP CONSTRAINT IF EXISTS instructors_consentement_temoignage_check;
-- ALTER TABLE public.instructors DROP CONSTRAINT IF EXISTS instructors_consentement_photo_check;
-- UPDATE public.instructors SET status = upper(status) WHERE status IN ('actif','inactif');
-- -- candidats → INACTIF si rollback ancien CHECK
-- UPDATE public.instructors SET status = 'INACTIF' WHERE status = 'candidat';
-- ALTER TABLE public.instructors
--   ADD CONSTRAINT instructors_status_check
--   CHECK (status = ANY (ARRAY['ACTIF'::text, 'INACTIF'::text, 'A_EVITER'::text]));
-- ALTER TABLE public.instructors
--   DROP COLUMN IF EXISTS alias,
--   DROP COLUMN IF EXISTS civilite,
--   DROP COLUMN IF EXISTS pays,
--   DROP COLUMN IF EXISTS statut_administratif,
--   DROP COLUMN IF EXISTS identifiant_etranger,
--   DROP COLUMN IF EXISTS assujetti_tva,
--   DROP COLUMN IF EXISTS consentement_temoignage,
--   DROP COLUMN IF EXISTS consentement_photo,
--   DROP COLUMN IF EXISTS cv_url,
--   DROP COLUMN IF EXISTS formulaire_2026,
--   DROP COLUMN IF EXISTS date_naissance;
