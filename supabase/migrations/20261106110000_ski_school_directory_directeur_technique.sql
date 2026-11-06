-- Directeurs techniques ESF (fichier SNMSF « Coordonnées directeurs par départements »)
-- Noms stockés même sans courriel ; courriel_dt rempli quand disponible.

ALTER TABLE public.ski_school_directory
  ADD COLUMN IF NOT EXISTS directeur_technique text,
  ADD COLUMN IF NOT EXISTS courriel_directeur_technique text;

COMMENT ON COLUMN public.ski_school_directory.directeur_technique IS
  'Directeur·rice technique ESF (fonction DT), distinct du directeur (DIR).';
COMMENT ON COLUMN public.ski_school_directory.courriel_directeur_technique IS
  'Courriel personnel DT si fourni ; souvent vide — ne pas inventer d''adresse.';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'ski_school_directory_directeur_technique',
  'ski_school_directory',
  jsonb_build_object('migration', '20261106110000_ski_school_directory_directeur_technique')
);
