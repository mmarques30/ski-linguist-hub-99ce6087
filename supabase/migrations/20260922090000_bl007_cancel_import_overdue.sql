-- BL-007 / Pilotage — factures import historique « sent » échues
--
-- Décision Paula (22/09/2026) :
--   • exercices < 25-26  → cancelled (hors périmètre, non relancés)
--   • exercices ≥ 25-26  → a_verifier (à contrôler manuellement)
-- Jamais paid : aucun encaissement inventé.
-- Les crons / KPI opérationnels ignorent déjà origin=import_historique.

-- 1. Anciens exercices : annulation
UPDATE public.invoices
SET
  status = 'cancelled',
  notes = CASE
    WHEN notes IS NULL OR btrim(notes) = '' THEN
      'Hors périmètre plateforme — import historique point 9, exercice < 25-26, non relancé (BL-007).'
    WHEN notes ILIKE '%BL-007%' THEN notes
    ELSE
      notes || E'\n---\nHors périmètre plateforme — import historique point 9, exercice < 25-26, non relancé (BL-007).'
  END,
  updated_at = now()
WHERE origin = 'import_historique'
  AND status = 'sent'
  AND due_date IS NOT NULL
  AND due_date < CURRENT_DATE
  AND (
    fiscal_year IS NULL
    OR fiscal_year < '25-26'
  );

-- 2. Exercices 25-26 et suivants : à vérifier
UPDATE public.invoices
SET
  status = 'a_verifier',
  notes = CASE
    WHEN notes IS NULL OR btrim(notes) = '' THEN
      'Import historique point 9 — exercice ≥ 25-26 : à vérifier (BL-007).'
    WHEN notes ILIKE '%à vérifier (BL-007)%' THEN notes
    ELSE
      notes || E'\n---\nImport historique point 9 — exercice ≥ 25-26 : à vérifier (BL-007).'
  END,
  updated_at = now()
WHERE origin = 'import_historique'
  AND status IN ('sent', 'cancelled')
  AND due_date IS NOT NULL
  AND due_date < CURRENT_DATE
  AND fiscal_year >= '25-26'
  AND (
    status = 'sent'
    OR notes ILIKE '%non relancé (BL-007)%'
    OR notes ILIKE '%point 9, non relancé%'
  );
