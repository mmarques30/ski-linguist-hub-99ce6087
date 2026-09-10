-- Ops : finaliser migration certificat bilan (vue + rapport backfill + audit)
-- Statut 09/09/2026 : APPLIQUÉ en live (Lovable query_database).
-- Vue inscriptions_complete expose les colonnes bilan ; backfill need_*=0 ;
-- audit_log point=certificat_bilan / mode=legacy_levels_backfill_and_view (sans PII).
-- Script conservé pour ré-idempotence / environnement hors prod.
-- À exécuter avec service-role / Lovable query_database

-- 1) Colonnes (idempotent)
ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS niveau_general_entree text,
  ADD COLUMN IF NOT EXISTS niveau_technique_entree text,
  ADD COLUMN IF NOT EXISTS remarques_entree text,
  ADD COLUMN IF NOT EXISTS niveau_general_sortie text,
  ADD COLUMN IF NOT EXISTS niveau_technique_sortie text,
  ADD COLUMN IF NOT EXISTS objectif_atteint text,
  ADD COLUMN IF NOT EXISTS commentaire_sortie text,
  ADD COLUMN IF NOT EXISTS hours_followed numeric,
  ADD COLUMN IF NOT EXISTS entry_form_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS exit_form_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS formateur text,
  ADD COLUMN IF NOT EXISTS formateur_email text,
  ADD COLUMN IF NOT EXISTS formateur_telephone text;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS hours_followed numeric,
  ADD COLUMN IF NOT EXISTS hours_planned numeric,
  ADD COLUMN IF NOT EXISTS progression_snapshot jsonb;

-- 2) Backfill sans écraser les valeurs déjà renseignées
WITH before_counts AS (
  SELECT
    count(*) FILTER (WHERE entry_level IS NOT NULL AND btrim(entry_level) <> '') AS with_entry_level,
    count(*) FILTER (WHERE exit_level IS NOT NULL AND btrim(exit_level) <> '') AS with_exit_level,
    count(*) FILTER (WHERE final_general_level IS NOT NULL AND btrim(final_general_level) <> '') AS with_final_general,
    count(*) FILTER (WHERE final_specific_level IS NOT NULL AND btrim(final_specific_level) <> '') AS with_final_specific,
    count(*) FILTER (WHERE niveau_general_entree IS NOT NULL) AS already_gen_entree,
    count(*) FILTER (WHERE niveau_general_sortie IS NOT NULL) AS already_gen_sortie,
    count(*) FILTER (WHERE niveau_technique_sortie IS NOT NULL) AS already_tech_sortie
  FROM public.inscriptions
), updated AS (
  UPDATE public.inscriptions SET
    niveau_general_entree = COALESCE(niveau_general_entree, NULLIF(btrim(entry_level), '')),
    niveau_general_sortie = COALESCE(
      niveau_general_sortie,
      NULLIF(btrim(exit_level), ''),
      NULLIF(btrim(final_general_level), '')
    ),
    niveau_technique_sortie = COALESCE(
      niveau_technique_sortie,
      NULLIF(btrim(final_specific_level), '')
    )
  WHERE
    (niveau_general_entree IS NULL AND entry_level IS NOT NULL AND btrim(entry_level) <> '')
    OR (niveau_general_sortie IS NULL AND (
      (exit_level IS NOT NULL AND btrim(exit_level) <> '')
      OR (final_general_level IS NOT NULL AND btrim(final_general_level) <> '')
    ))
    OR (niveau_technique_sortie IS NULL AND final_specific_level IS NOT NULL AND btrim(final_specific_level) <> '')
  RETURNING id
)
INSERT INTO public.audit_log (action, table_name, record_id, new_values)
SELECT
  'import',
  'inscriptions',
  NULL,
  jsonb_build_object(
    'point', 'certificat_bilan',
    'mode', 'legacy_levels_backfill_and_view',
    'rows_updated', (SELECT count(*) FROM updated),
    'before', (SELECT to_jsonb(before_counts.*) FROM before_counts)
  );

-- 3) Recréer la vue (voir migration repo 20260909180000…)
-- Exécuter le CREATE VIEW de la migration ensuite.

-- 4) Vérification vue
-- SELECT id, niveau_general_entree, niveau_technique_entree, niveau_general_sortie, niveau_technique_sortie
-- FROM inscriptions_complete LIMIT 5;
