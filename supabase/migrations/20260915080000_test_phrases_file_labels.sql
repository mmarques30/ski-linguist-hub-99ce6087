-- Point 7 : test_phrases accueille le fichier tel quel.
-- Les étiquettes langue (COMMON, EN, PT, ES, NL, RU, IT, ZH, DE, FR) et catégorie
-- (INTRODUCTION, COMPREHENSION, CONCLUSION, PRONONCIATION, GRAMMAIRE, VOCABULAIRE)
-- du fichier sont conservées telles quelles : ni renommage, ni dédoublonnage.
-- Trois colonnes reprennent les champs du fichier qui n'avaient pas d'équivalent.

ALTER TABLE public.test_phrases
  ADD COLUMN IF NOT EXISTS context text,
  ADD COLUMN IF NOT EXISTS is_correction boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_type text;

COMMENT ON COLUMN public.test_phrases.context IS
  'Champ "context" du fichier source (INTRODUCTION / COMPREHENSION / CONCLUSION). NULL ailleurs.';
COMMENT ON COLUMN public.test_phrases.is_correction IS
  'Champ "is_correction" du fichier source : true = correction adressée au candidat, false = explication.';
COMMENT ON COLUMN public.test_phrases.error_type IS
  'Champ "error_type" du fichier source : étiquette courte du point de langue visé.';
COMMENT ON COLUMN public.test_phrases.language IS
  'Étiquette de langue du fichier source, non traduite. COMMON = phrase toutes langues.';
COMMENT ON COLUMN public.test_phrases.category IS
  'Étiquette de catégorie du fichier source, non traduite. Indépendante du bloc du compte-rendu.';

-- Le code du fichier est l'identifiant de reprise d'import : il doit rester unique.
-- Index non partiel, sinon ON CONFLICT (code) ne peut pas s'y accrocher.
-- Plusieurs phrases sans code restent possibles (NULL distincts).
CREATE UNIQUE INDEX IF NOT EXISTS test_phrases_code_key
  ON public.test_phrases (code);

CREATE INDEX IF NOT EXISTS test_phrases_language_category_idx
  ON public.test_phrases (language, category)
  WHERE active;
