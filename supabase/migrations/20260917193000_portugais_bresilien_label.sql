-- Canonicalise le libellé de langue : jamais « Portugais » seul.
-- Affichage et stockage métier = « Portugais brésilien » (ou minuscules pour instructors.languages).

UPDATE public.inscriptions
SET language = 'Portugais brésilien'
WHERE language IS NOT NULL
  AND lower(language) IN ('portugais', 'portuguese', 'português', 'pt', 'pt-br', 'pt_br')
  AND language <> 'Portugais brésilien';

UPDATE public.inscriptions
SET language = 'Portugais brésilien'
WHERE language IS NOT NULL
  AND lower(btrim(language)) = 'portugais brésilien'
  AND language <> 'Portugais brésilien';

-- instructors.languages est un text[] en minuscules côté métier
UPDATE public.instructors
SET languages = (
  SELECT array_agg(
    CASE
      WHEN lower(lang) IN ('portugais', 'portuguese', 'português', 'pt', 'pt-br', 'pt_br')
        THEN 'portugais brésilien'
      WHEN lower(lang) = 'portugais brésilien'
        THEN 'portugais brésilien'
      ELSE lang
    END
    ORDER BY ordinality
  )
  FROM unnest(coalesce(languages, ARRAY[]::text[])) WITH ORDINALITY AS t(lang, ordinality)
)
WHERE languages IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM unnest(languages) AS lang
    WHERE lower(lang) IN (
      'portugais', 'portuguese', 'português', 'pt', 'pt-br', 'pt_br'
    )
    OR (lower(lang) = 'portugais brésilien' AND lang <> 'portugais brésilien')
  );

UPDATE public.leads
SET language_interest = 'portugais'
WHERE language_interest IS NOT NULL
  AND lower(language_interest) IN ('portuguese', 'portugais bresilien', 'portugais brésilien', 'pt', 'pt-br');

-- leads garde la clé technique `portugais` ; l'UI affiche « Portugais brésilien ».

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'language_portugais_bresilien',
  'inscriptions',
  jsonb_build_object(
    'migration', '20260917193000_portugais_bresilien_label',
    'note', 'Libellé Portugais → Portugais brésilien'
  )
);
