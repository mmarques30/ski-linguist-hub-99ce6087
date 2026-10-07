-- CC systématique pour les envois de résultats de tests à une ESF.
-- Paula 2026-10-07 : ESF Courchevel 1550 → Stéphanie Sarratea <contact@esf-courchevel.com>.
--
-- `partners` est gelé (point 5) : pas d'UPDATE. Source de vérité =
-- app_settings.evaluation_results_cc (+ miroir ski_school_directory.courriel_resultats_cc).

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS evaluation_results_cc text[];

COMMENT ON COLUMN public.partners.evaluation_results_cc IS
  'Réservé : CC résultats de tests. Lecture seule tant que le gel prospection (point 5) tient. Préférer app_settings.evaluation_results_cc.';

ALTER TABLE public.ski_school_directory
  ADD COLUMN IF NOT EXISTS courriel_resultats_cc text;

COMMENT ON COLUMN public.ski_school_directory.courriel_resultats_cc IS
  'Adresse toujours en copie (CC) lors d''un envoi de résultats de tests à cette école. Ex. secrétaire.';

UPDATE public.ski_school_directory
SET courriel_resultats_cc = 'contact@esf-courchevel.com'
WHERE code = 'esf-302'
  AND courriel_resultats_cc IS DISTINCT FROM 'contact@esf-courchevel.com';

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'evaluation_results_cc',
  jsonb_build_object(
    'b475774d-e0c4-4651-9f7f-0be03c560de8',
    jsonb_build_object(
      'emails', jsonb_build_array(
        'contact@esf-courchevel.com',
        'direction@esf-courchevel.com'
      ),
      'label', 'Stéphanie Sarratea (secrétaire) + Lucas Dyen (direction) — ESF Courchevel 1550',
      'partner_name', 'ESF COURCHEVEL 1550',
      'ski_school_code', 'esf-302',
      'set_by', 'Paula',
      'set_at', '2026-10-07'
    )
  ),
  'CC systématique pour envois de résultats de tests, indexé par partners.id'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'evaluation_results_cc_courchevel_1550',
  'app_settings',
  jsonb_build_object(
    'migration', '20261007140000_evaluation_results_cc',
    'partner_id', 'b475774d-e0c4-4651-9f7f-0be03c560de8',
    'partner_name', 'ESF COURCHEVEL 1550',
    'ski_school_code', 'esf-302',
    'emails', ARRAY['contact@esf-courchevel.com', 'direction@esf-courchevel.com'],
    'contacts', 'Stéphanie Sarratea + Lucas Dyen',
    'note', 'partners gelé — config dans app_settings + ski_school_directory'
  )
);
