-- BL-036 — `/settings` : rendre l'identité de l'organisation enregistrable.
--
-- Recette du 11 → 15/09 : la carte « Organisation » de `/settings` affichait des
-- valeurs en dur et fausses (contact@fli-langues.fr, +33 4 79 00 00 00,
-- https://fli-langues.fr), et « Enregistrer les modifications » se limitait à un
-- `console.log` suivi d'un message de succès. Paula doit saisir l'identité
-- elle-même avant les premières conventions.
--
-- La source de vérité existe déjà : `app_settings.fli_identity`, lue par les PDF
-- d'évaluation (point C.5). On l'étend des mentions attendues sur une convention
-- de formation, à vide : Paula les remplit depuis `/settings`.

UPDATE public.app_settings
SET
  value = jsonb_build_object(
            'siret', '',
            'activity_number', '',
            'activity_authority', '',
            'representative', '',
            'website', ''
          ) || value,
  description = 'Identité de l''organisme de formation. Saisie dans /settings, lue par les PDF et les conventions.'
WHERE key = 'fli_identity';

-- Si la clé n'existe pas (base neuve), on la crée avec les seules valeurs déjà
-- publiées par FLI ; les mentions légales restent à saisir.
INSERT INTO public.app_settings (key, value, description)
SELECT
  'fli_identity',
  jsonb_build_object(
    'legal_name', 'France Langues International',
    'address_line', '25 avenue de la Gare',
    'postal_code', '73800',
    'city', 'Montmélian',
    'phone', '04 79 28 21 09',
    'email', 'info@fli.fr',
    'siret', '',
    'activity_number', '',
    'activity_authority', '',
    'representative', '',
    'website', ''
  ),
  'Identité de l''organisme de formation. Saisie dans /settings, lue par les PDF et les conventions.'
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'fli_identity');

-- Langues enseignées : la liste était en dur dans `Settings.tsx` et n'était
-- jamais enregistrée. On la matérialise avec les langues effectivement ouvertes
-- à ce jour pour que l'écran reparte de l'état réel.
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'taught_languages',
  jsonb_build_array('english', 'portuguese', 'russian', 'dutch'),
  'Langues enseignées cochées dans /settings. Le catalogue public reste piloté par registration_offerings.'
)
ON CONFLICT (key) DO NOTHING;

-- Vérification : les cinq mentions attendues sur une convention existent bien
-- dans la clé (vides ou remplies).
DO $$
DECLARE
  manquantes text;
BEGIN
  SELECT string_agg(champ, ', ')
    INTO manquantes
  FROM (
    SELECT champ
    FROM unnest(ARRAY[
      'legal_name', 'address_line', 'postal_code', 'city', 'phone', 'email',
      'siret', 'activity_number', 'activity_authority', 'representative', 'website'
    ]) AS champ
    WHERE NOT EXISTS (
      SELECT 1 FROM public.app_settings
      WHERE key = 'fli_identity' AND value ? champ
    )
  ) q;

  IF manquantes IS NOT NULL THEN
    RAISE EXCEPTION 'BL-036 : champs absents de fli_identity — %', manquantes;
  END IF;
END $$;

-- DOWN (ne pas exécuter sans validation Paula) :
-- UPDATE public.app_settings
-- SET value = value - 'siret' - 'activity_number' - 'activity_authority'
--                   - 'representative' - 'website'
-- WHERE key = 'fli_identity';
-- DELETE FROM public.app_settings WHERE key = 'taught_languages';
